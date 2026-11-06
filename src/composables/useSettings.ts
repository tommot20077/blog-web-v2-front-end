import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { userService } from '../api/userService'
import { fileService } from '../api/fileService'
import { useAuthStore } from '../stores/auth'
import { useToast } from './useToast'
import { getPasswordRules, PASSWORD_POLICY_MESSAGE } from './useFormValidation'
import { isSafeHandle, isHttpUrl } from '../utils/socialLinks'

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

/** 對齊後端 UpdateProfileRequest.website 的 maxLength */
const MAX_WEBSITE_LENGTH = 255
const HANDLE_ERROR = '請只填帳號名稱，不要貼網址（不可含 / : \\ < > " 或空白，最多 100 字，@ 只能放在開頭一個）'
const WEBSITE_ERROR = '請輸入以 http:// 或 https:// 開頭的完整網址（最多 255 字）'

export function useSettings() {
  const authStore = useAuthStore()
  const { showToast } = useToast()

  // ── Profile ──
  const nickname = ref('')
  const bio = ref('')
  const location = ref('')
  const website = ref('')
  const avatarUrl = ref<string | null>(null)
  const avatarFile = ref<File | null>(null)

  /** 覆寫 avatarUrl 前先釋放舊的 blob 預覽 URL，避免 object URL 洩漏 */
  function replaceAvatarUrl(next: string | null) {
    const prev = avatarUrl.value
    if (prev && prev !== next && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
    avatarUrl.value = next
  }
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

  // ── 公開頁欄位即時驗證（規則與後端同一份：socialLinks 為帳號名稱、website 僅 http(s)）──
  const handleError = (v: string) => (isSafeHandle(v) ? '' : HANDLE_ERROR)
  const githubError = computed(() => handleError(github.value))
  const twitterError = computed(() => handleError(twitter.value))
  const linkedinError = computed(() => handleError(linkedin.value))
  const hasSocialErrors = computed(() => !!(githubError.value || twitterError.value || linkedinError.value))
  const websiteError = computed(() => {
    const w = website.value
    if (!w) return ''
    return isHttpUrl(w) && w.length <= MAX_WEBSITE_LENGTH ? '' : WEBSITE_ERROR
  })

  /** 「查看我的公開頁」連結；尚未取得 uuid 時為 null */
  const publicProfilePath = computed(() => {
    const uuid = authStore.user?.uuid
    return uuid ? `/author/${encodeURIComponent(uuid)}` : null
  })

  // ── Writing Preferences (localStorage) ──
  // editorMode key 'blog.edMode' 與 useEditorMode.ts 共用：這裡改的是「預設值」，
  // EditorView.vue 透過 useEditorMode() 在掛載時讀取、切換模式時立即寫回同一把 key。
  const editorMode = ref(localStorage.getItem('blog.edMode') || 'split')
  const wordUnit = ref(localStorage.getItem('blog.settings.wordUnit') || 'characters')
  const autosave = ref(localStorage.getItem('blog.settings.autosave') !== 'false')
  const { status: writingStatus, withSave: withWritingSave } = useSaveStatus()

  // ── Notifications (後端持久化，初始值由 GET /users/me 載入) ──
  const nComment = ref(true)
  const nLike = ref(true)
  const nReview = ref(true)
  const nFollow = ref(true)
  const nNewsletter = ref(true)
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

  // 從 authStore.user 同步通知偏好（後端 UserProfileResponse.notification* 欄位）
  function hydrateNotifications(user: typeof authStore.user) {
    if (!user) return
    nComment.value = user.notificationComment ?? true
    nLike.value = user.notificationLike ?? true
    nReview.value = user.notificationReview ?? true
    nFollow.value = user.notificationFollow ?? true
    nNewsletter.value = user.notificationNewsletter ?? true
  }

  // 從 authStore.user 同步 profile 欄位（onMounted 與 watch 共用 logic）
  function hydrateProfile(user: typeof authStore.user) {
    if (!user) return
    nickname.value = user.nickname || ''
    bio.value = user.bio || ''
    email.value = user.email || ''
    website.value = user.website ?? ''
    // 有尚未存檔的頭像選擇時保留預覽（avatarFile 仍在，下次存檔才會上傳它）
    if (!avatarFile.value) replaceAvatarUrl(user.avatarUrl || null)
    location.value = user.location ?? ''
    hydrateSocial(user)
    hydrateNotifications(user)
  }

  // Initialize from auth store
  onMounted(() => {
    hydrateProfile(authStore.user)
  })

  // 若 authStore.user 在 onMounted 後才就緒（e.g. refresh token 完成），即時同步
  watch(() => authStore.user, (user) => hydrateProfile(user))

  // Save functions
  async function saveProfile() {
    if (websiteError.value) {
      showToast('個人網站格式不正確', 'error')
      return
    }
    try {
      await withProfileSave(async () => {
        if (avatarFile.value) {
          // Upload avatar first, get URL
          const resp = await fileService.uploadFile(avatarFile.value, 'AVATAR')
          replaceAvatarUrl(resp.url)
          avatarFile.value = null
        }
        // 帶上 socialLinks 現值，避免後端 setWebsite(null) 模式的反向問題：
        // 若不送 socialLinks，後端 updateProfile 會把它清成 null
        // 舊資料可能是網址格式，原樣送出會被後端 400：isSafeHandle 不通過的值改成 ''
        const rawSocial = authStore.user?.socialLinks
        let socialLinks: string | undefined
        if (rawSocial) {
          const parsed = parseSocialLinks(rawSocial)
          socialLinks = JSON.stringify({
            github: isSafeHandle(parsed.github) ? parsed.github : '',
            twitter: isSafeHandle(parsed.twitter) ? parsed.twitter : '',
            linkedin: isSafeHandle(parsed.linkedin) ? parsed.linkedin : '',
          })
        }
        await userService.updateProfile({
          nickname: nickname.value,
          bio: bio.value || undefined,
          website: website.value || undefined,
          socialLinks,
          avatarUrl: avatarUrl.value || undefined,
          location: location.value || undefined,
        })
        // Refresh the auth store user object so the rest of the app sees updated data
        await authStore.fetchUser()
      })
    } catch {
      showToast('儲存個人資料失敗', 'error')
    }
  }

  async function saveAccount() {
    if (!pwCurrent.value || !pwNew.value) {
      showToast('請輸入目前密碼與新密碼', 'error')
      return
    }
    if (pwNew.value !== pwConfirm.value) {
      showToast('新密碼不一致', 'error')
      return
    }
    // client-side 對齊後端 PasswordPolicy（8-50 字元、含大小寫字母+數字+特殊字元）
    const passwordRules = getPasswordRules(pwNew.value)
    if (
      !passwordRules.length ||
      !passwordRules.lowercase ||
      !passwordRules.uppercase ||
      !passwordRules.digit ||
      !passwordRules.special
    ) {
      showToast(`新${PASSWORD_POLICY_MESSAGE}`, 'error')
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
    if (hasSocialErrors.value) {
      showToast('社群帳號名稱格式不正確', 'error')
      return
    }
    try {
      await withSocialSave(async () => {
        const socialLinks = JSON.stringify({
          github: github.value,
          twitter: twitter.value,
          linkedin: linkedin.value,
        })
        // 解構帶上現值，避免後端無條件 set(null) 抹掉既有 website / avatarUrl / location
        const { nickname, bio, website: currentWebsite, avatarUrl: currentAvatar, location: currentLocation } = authStore.user!
        await userService.updateProfile({
          nickname,
          bio,
          website: currentWebsite ?? undefined,
          socialLinks,
          avatarUrl: currentAvatar ?? undefined,
          location: currentLocation ?? undefined,
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
        await userService.updateNotifications({
          comment: nComment.value,
          like: nLike.value,
          review: nReview.value,
          follow: nFollow.value,
          newsletter: nNewsletter.value,
        })
      })
    } catch {
      showToast('儲存通知設定失敗', 'error')
    }
  }

  function removeAvatar() {
    replaceAvatarUrl(null)
    avatarFile.value = null
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
    // Profile
    nickname, bio, location, website, avatarUrl, avatarFile, profileStatus, saveProfile,
    // Account
    email, pwCurrent, pwNew, pwConfirm, accountStatus, saveAccount,
    // Social
    github, twitter, linkedin, socialStatus, saveSocial,
    githubError, twitterError, linkedinError, hasSocialErrors,
    // Public profile
    websiteError, publicProfilePath,
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
