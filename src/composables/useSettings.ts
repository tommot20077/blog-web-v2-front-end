import { ref, watch, onMounted, onUnmounted } from 'vue'
import { userService } from '../api/userService'
import { fileService } from '../api/fileService'
import { useAuthStore } from '../stores/auth'
import { useToast } from './useToast'
import { getPasswordRules } from './useFormValidation'

type SaveStatus = 'idle' | 'saving' | 'saved'

function useSaveStatus() {
  const status = ref<SaveStatus>('idle')
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  async function withSave(fn: () => Promise<void>) {
    if (resetTimer) clearTimeout(resetTimer)
    status.value = 'saving'
    try {
      await fn()
      status.value = 'saved'
      resetTimer = setTimeout(() => { status.value = 'idle' }, 2400)
    } catch (e) {
      status.value = 'idle'
      throw e
    }
  }

  onUnmounted(() => {
    if (resetTimer) clearTimeout(resetTimer)
  })

  return { status, withSave }
}

export function useSettings() {
  const authStore = useAuthStore()
  const { showToast } = useToast()

  // Active section persisted
  const activeSection = ref(localStorage.getItem('blog.settings.section') || 'profile')
  function setSection(s: string) {
    activeSection.value = s
    localStorage.setItem('blog.settings.section', s)
  }

  // ── Profile ──
  const nickname = ref('')
  const bio = ref('')
  const location = ref('')
  const website = ref('')
  const avatarUrl = ref<string | null>(null)
  const avatarFile = ref<File | null>(null)
  const { status: profileStatus, withSave: withProfileSave } = useSaveStatus()

  // ── Account ──
  const email = ref('')
  const pwCurrent = ref('')
  const pwNew = ref('')
  const pwConfirm = ref('')
  const { status: accountStatus, withSave: withAccountSave } = useSaveStatus()

  // ── Social ──
  const github = ref('')
  const twitter = ref('')
  const linkedin = ref('')
  const { status: socialStatus, withSave: withSocialSave } = useSaveStatus()

  // ── Writing Preferences (localStorage) ──
  // Note: editorMode key 'blog.edMode' is read by EditorView.vue
  const editorMode = ref(localStorage.getItem('blog.edMode') || 'split')
  const wordUnit = ref(localStorage.getItem('blog.settings.wordUnit') || 'characters')
  const autosave = ref(localStorage.getItem('blog.settings.autosave') !== 'false')
  const { status: writingStatus, withSave: withWritingSave } = useSaveStatus()

  // ── Notifications (localStorage only — TODO: backend) ──
  const nComment = ref(localStorage.getItem('blog.settings.nComment') !== 'false')
  const nLike = ref(localStorage.getItem('blog.settings.nLike') !== 'false')
  const nReview = ref(localStorage.getItem('blog.settings.nReview') !== 'false')
  const nFollow = ref(localStorage.getItem('blog.settings.nFollow') !== 'false')
  const nNewsletter = ref(localStorage.getItem('blog.settings.nNewsletter') !== 'false')
  const { status: notifStatus, withSave: withNotifSave } = useSaveStatus()

  // Parse socialLinks JSON string from user profile
  function parseSocialLinks(raw: string | null | undefined) {
    if (!raw) return { github: '', twitter: '', linkedin: '' }
    try {
      const parsed = JSON.parse(raw)
      return {
        github: parsed.github ?? '',
        twitter: parsed.twitter ?? '',
        linkedin: parsed.linkedin ?? '',
      }
    } catch {
      return { github: '', twitter: '', linkedin: '' }
    }
  }

  function hydrateSocial(user: typeof authStore.user) {
    const restored = parseSocialLinks(user?.socialLinks)
    github.value = restored.github
    twitter.value = restored.twitter
    linkedin.value = restored.linkedin
  }

  // Initialize from auth store
  onMounted(() => {
    if (authStore.user) {
      nickname.value = authStore.user.nickname || ''
      bio.value = authStore.user.bio || ''
      email.value = authStore.user.email || ''
      // TODO: backend profile update endpoint does not yet accept avatarUrl
      avatarUrl.value = authStore.user.avatarUrl || localStorage.getItem('blog.settings.avatarUrl') || null
      hydrateSocial(authStore.user)
    }
    location.value = localStorage.getItem('blog.settings.location') || ''
    website.value = localStorage.getItem('blog.settings.website') || ''
  })

  // 若 authStore.user 在 onMounted 後才就緒（e.g. refresh token 完成），即時同步
  watch(() => authStore.user, (user) => {
    if (user) {
      nickname.value = user.nickname || ''
      bio.value = user.bio || ''
      email.value = user.email || ''
      avatarUrl.value = user.avatarUrl || localStorage.getItem('blog.settings.avatarUrl') || null
      hydrateSocial(user)
    }
  })

  // Save functions
  async function saveProfile() {
    try {
      await withProfileSave(async () => {
        if (avatarFile.value) {
          // Upload avatar first, get URL
          const resp = await fileService.uploadFile(avatarFile.value, 'AVATAR')
          avatarUrl.value = resp.url
          avatarFile.value = null
          // TODO: backend profile update endpoint does not yet accept avatarUrl
          localStorage.setItem('blog.settings.avatarUrl', resp.url)
        }
        await userService.updateProfile({ nickname: nickname.value, bio: bio.value || undefined })
        // Refresh the auth store user object so the rest of the app sees updated data
        await authStore.fetchUser()
        // Persist remaining fields locally (TODO: backend support)
        localStorage.setItem('blog.settings.location', location.value)
        localStorage.setItem('blog.settings.website', website.value)
      })
    } catch {
      showToast('儲存個人資料失敗', 'error')
    }
  }

  async function saveAccount() {
    if (!pwCurrent.value || !pwNew.value) return
    if (pwNew.value !== pwConfirm.value) {
      showToast('新密碼不一致', 'error')
      return
    }
    // client-side 對齊後端 PasswordPolicy（min 8、含字母+數字）
    const passwordRules = getPasswordRules(pwNew.value)
    if (!passwordRules.length || !passwordRules.letter || !passwordRules.digit) {
      showToast('新密碼須為 8-50 字元，且包含至少一個英文字母及一個數字', 'error')
      return
    }
    try {
      await withAccountSave(async () => {
        await userService.changePassword({ oldPassword: pwCurrent.value, newPassword: pwNew.value })
        pwCurrent.value = ''
        pwNew.value = ''
        pwConfirm.value = ''
      })
    } catch {
      showToast('更新密碼失敗', 'error')
    }
  }

  async function saveSocial() {
    if (!authStore.user) return
    try {
      await withSocialSave(async () => {
        const socialLinks = JSON.stringify({
          github: github.value,
          twitter: twitter.value,
          linkedin: linkedin.value,
        })
        await userService.updateProfile({
          nickname: authStore.user!.nickname,
          bio: authStore.user!.bio,
          socialLinks,
        })
        await authStore.fetchUser()
      })
    } catch {
      showToast('儲存社群連結失敗', 'error')
    }
  }

  async function saveWriting() {
    try {
      await withWritingSave(async () => {
        localStorage.setItem('blog.edMode', editorMode.value)
        localStorage.setItem('blog.settings.wordUnit', wordUnit.value)
        localStorage.setItem('blog.settings.autosave', String(autosave.value))
      })
    } catch {
      showToast('儲存寫作偏好失敗', 'error')
    }
  }

  async function saveNotifications() {
    try {
      await withNotifSave(async () => {
        // TODO: backend notifications API
        localStorage.setItem('blog.settings.nComment', String(nComment.value))
        localStorage.setItem('blog.settings.nLike', String(nLike.value))
        localStorage.setItem('blog.settings.nReview', String(nReview.value))
        localStorage.setItem('blog.settings.nFollow', String(nFollow.value))
        localStorage.setItem('blog.settings.nNewsletter', String(nNewsletter.value))
      })
    } catch {
      showToast('儲存通知設定失敗', 'error')
    }
  }

  function removeAvatar() {
    if (avatarUrl.value?.startsWith('blob:')) URL.revokeObjectURL(avatarUrl.value)
    avatarUrl.value = null
    avatarFile.value = null
    localStorage.removeItem('blog.settings.avatarUrl')
  }

  async function deleteAccount(password: string) {
    try {
      await userService.deleteAccount({ password })
      authStore.logout()
    } catch (e) {
      showToast('刪除帳號失敗', 'error')
      throw e
    }
  }

  return {
    activeSection, setSection,
    // Profile
    nickname, bio, location, website, avatarUrl, avatarFile, profileStatus, saveProfile,
    // Account
    email, pwCurrent, pwNew, pwConfirm, accountStatus, saveAccount,
    // Social
    github, twitter, linkedin, socialStatus, saveSocial,
    // Writing
    editorMode, wordUnit, autosave, writingStatus, saveWriting,
    // Notifications
    nComment, nLike, nReview, nFollow, nNewsletter, notifStatus, saveNotifications,
    // Profile actions
    removeAvatar,
    // Danger
    deleteAccount,
    // Toast
    showToast,
  }
}
