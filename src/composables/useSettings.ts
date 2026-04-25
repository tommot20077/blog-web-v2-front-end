import { ref, onMounted } from 'vue'
import { userService } from '../api/userService'
import { fileService } from '../api/fileService'
import { useAuthStore } from '../stores/auth'
import { useToast } from './useToast'

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

  // ── Social (localStorage only — TODO: backend) ──
  const github = ref(localStorage.getItem('blog.settings.github') || '')
  const twitter = ref(localStorage.getItem('blog.settings.twitter') || '')
  const linkedin = ref(localStorage.getItem('blog.settings.linkedin') || '')
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

  // Initialize from auth store
  onMounted(() => {
    if (authStore.user) {
      nickname.value = authStore.user.nickname || ''
      bio.value = authStore.user.bio || ''
      email.value = authStore.user.email || ''
      avatarUrl.value = authStore.user.avatarUrl
    }
    location.value = localStorage.getItem('blog.settings.location') || ''
    website.value = localStorage.getItem('blog.settings.website') || ''
  })

  // Save functions
  async function saveProfile() {
    await withProfileSave(async () => {
      if (avatarFile.value) {
        // Upload avatar first, get URL
        const resp = await fileService.uploadFile(avatarFile.value, 'AVATAR')
        avatarUrl.value = resp.url
        avatarFile.value = null
      }
      await userService.updateProfile({ nickname: nickname.value, bio: bio.value || undefined })
      // Persist remaining fields locally (TODO: backend support)
      localStorage.setItem('blog.settings.location', location.value)
      localStorage.setItem('blog.settings.website', website.value)
    })
  }

  async function saveAccount() {
    if (!pwCurrent.value || !pwNew.value) return
    if (pwNew.value !== pwConfirm.value) {
      showToast('新密碼不一致', 'error')
      return
    }
    await withAccountSave(async () => {
      await userService.changePassword({ oldPassword: pwCurrent.value, newPassword: pwNew.value })
      pwCurrent.value = ''
      pwNew.value = ''
      pwConfirm.value = ''
    })
  }

  async function saveSocial() {
    await withSocialSave(async () => {
      // TODO: backend social links API
      localStorage.setItem('blog.settings.github', github.value)
      localStorage.setItem('blog.settings.twitter', twitter.value)
      localStorage.setItem('blog.settings.linkedin', linkedin.value)
    })
  }

  async function saveWriting() {
    await withWritingSave(async () => {
      localStorage.setItem('blog.edMode', editorMode.value)
      localStorage.setItem('blog.settings.wordUnit', wordUnit.value)
      localStorage.setItem('blog.settings.autosave', String(autosave.value))
    })
  }

  async function saveNotifications() {
    await withNotifSave(async () => {
      // TODO: backend notifications API
      localStorage.setItem('blog.settings.nComment', String(nComment.value))
      localStorage.setItem('blog.settings.nLike', String(nLike.value))
      localStorage.setItem('blog.settings.nReview', String(nReview.value))
      localStorage.setItem('blog.settings.nFollow', String(nFollow.value))
      localStorage.setItem('blog.settings.nNewsletter', String(nNewsletter.value))
    })
  }

  async function deleteAccount(password: string) {
    await userService.deleteAccount({ password })
    authStore.logout()
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
    // Danger
    deleteAccount,
  }
}
