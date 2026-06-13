import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

function makeTestComponent(setup: () => Record<string, unknown>) {
  return defineComponent({ setup, template: '<div />' })
}

vi.mock('../api/userService', () => ({
  userService: {
    updateProfile: vi.fn().mockResolvedValue({}),
    updateNotifications: vi.fn().mockResolvedValue({}),
    changePassword: vi.fn().mockResolvedValue({}),
    deleteAccount: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../api/fileService', () => ({
  fileService: {
    uploadFile: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/avatar.png' }),
  },
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { nickname: 'TestUser', bio: '測試', email: 'test@example.com', avatarUrl: null },
    fetchUser: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
  })),
}))

vi.mock('./useToast', () => ({
  useToast: vi.fn(() => ({ showToast: vi.fn() })),
}))

describe('useSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('useSaveStatus timer cleanup', () => {
    it('元件 unmount 後 resetTimer 被清除，status 不再變回 idle', async () => {
      const { useSettings } = await import('./useSettings')

      let capturedStatus: { value: string } | null = null

      const TestComp = makeTestComponent(() => {
        const s = useSettings()
        capturedStatus = s.profileStatus
        return { saveProfile: s.saveProfile }
      })

      const wrapper = mount(TestComp)
      await (wrapper.vm as unknown as { saveProfile: () => Promise<void> }).saveProfile()
      expect(capturedStatus!.value).toBe('saved')

      // 卸載元件後計時器應已清除
      wrapper.unmount()
      vi.runAllTimers()

      // status 應維持 saved，不被殘留 timer 改為 idle
      expect(capturedStatus!.value).toBe('saved')
    })
  })

  describe('localStorage 持久化', () => {
    it('setSection 將 activeSection 寫入 localStorage', async () => {
      const { useSettings } = await import('./useSettings')
      let capturedSetSection: ((s: string) => void) | null = null

      const TestComp = makeTestComponent(() => {
        const { setSection } = useSettings()
        capturedSetSection = setSection
        return {}
      })

      mount(TestComp)
      capturedSetSection!('account')
      expect(localStorage.getItem('blog.settings.section')).toBe('account')
    })

    it('activeSection 初始值從 localStorage 讀取', async () => {
      localStorage.setItem('blog.settings.section', 'social')
      const { useSettings } = await import('./useSettings')

      let capturedActiveSection: { value: string } | null = null
      const TestComp = makeTestComponent(() => {
        const { activeSection } = useSettings()
        capturedActiveSection = activeSection
        return {}
      })

      mount(TestComp)
      expect(capturedActiveSection!.value).toBe('social')
    })
  })

  describe('removeAvatar', () => {
    it('removeAvatar 清除 avatarUrl ref（不再使用 localStorage）', async () => {
      const { useSettings } = await import('./useSettings')

      let s: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => {
        s = useSettings()
        return {}
      })

      mount(TestComp)
      ;(s!.avatarUrl as { value: string | null }).value = 'https://cdn.example.com/old.png'
      s!.removeAvatar()
      expect(s!.avatarUrl.value).toBeNull()
      // 確認沒有寫入任何 avatarUrl localStorage key
      expect(localStorage.getItem('blog.settings.avatarUrl')).toBeNull()
    })
  })

  describe('saveProfile error/toast', () => {
    it('saveProfile 失敗時顯示 error toast', async () => {
      const { userService } = await import('../api/userService')
      vi.mocked(userService.updateProfile).mockRejectedValueOnce(new Error('Network error'))

      const { useToast } = await import('./useToast')
      const mockShowToast = vi.fn()
      vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast })

      vi.resetModules()
      const { useSettings } = await import('./useSettings')

      let capturedSaveProfile: (() => Promise<void>) | null = null
      const TestComp = makeTestComponent(() => {
        const s = useSettings()
        capturedSaveProfile = s.saveProfile
        return {}
      })

      mount(TestComp)
      await capturedSaveProfile!()

      expect(mockShowToast).toHaveBeenCalledWith('儲存個人資料失敗', 'error')
    })

    it('saveProfile 成功時 profileStatus 依序為 saving → saved', async () => {
      const { useSettings } = await import('./useSettings')

      let capturedStatus: { value: string } | null = null
      let capturedSaveProfile: (() => Promise<void>) | null = null

      const TestComp = makeTestComponent(() => {
        const s = useSettings()
        capturedStatus = s.profileStatus
        capturedSaveProfile = s.saveProfile
        return {}
      })

      mount(TestComp)

      const savePromise = capturedSaveProfile!()
      expect(capturedStatus!.value).toBe('saving')

      await savePromise
      expect(capturedStatus!.value).toBe('saved')
    })
  })

  describe('saveAccount 密碼驗證', () => {
    it('新密碼不一致時不呼叫 API，並顯示 toast', async () => {
      const { userService } = await import('../api/userService')
      const { useToast } = await import('./useToast')
      const mockShowToast = vi.fn()
      vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast })

      vi.resetModules()
      const { useSettings } = await import('./useSettings')

      let capturedSettings: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => {
        capturedSettings = useSettings()
        return {}
      })

      mount(TestComp)
      capturedSettings!.pwCurrent.value = 'oldpass'
      capturedSettings!.pwNew.value = 'newpass1'
      capturedSettings!.pwConfirm.value = 'newpass2'
      await capturedSettings!.saveAccount()

      expect(userService.changePassword).not.toHaveBeenCalled()
      expect(mockShowToast).toHaveBeenCalledWith('新密碼不一致', 'error')
    })
  })

  describe('avatarUrl / location 改接後端', () => {
    it('saveProfile 將 avatarUrl 與 location 一併送至 updateProfile', async () => {
      const { useAuthStore } = await import('../stores/auth')
      vi.mocked(useAuthStore).mockReturnValue({
        user: {
          nickname: 'TestUser', bio: '測試', email: 'test@example.com',
          avatarUrl: 'https://cdn.example.com/me.png', website: null,
          socialLinks: null, location: 'Tokyo',
        },
        fetchUser: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore>)

      const { userService } = await import('../api/userService')
      vi.resetModules()
      const { useSettings } = await import('./useSettings')

      let s: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => { s = useSettings(); return {} })
      mount(TestComp)

      s!.nickname.value = 'TestUser'
      s!.location.value = 'Berlin'
      ;(s!.avatarUrl as { value: string | null }).value = 'https://cdn.example.com/new.png'
      await s!.saveProfile()

      expect(userService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          nickname: 'TestUser',
          avatarUrl: 'https://cdn.example.com/new.png',
          location: 'Berlin',
        }),
      )
    })

    it('saveProfile 不再寫入 blog.settings.avatarUrl / blog.settings.location 到 localStorage', async () => {
      const { useSettings } = await import('./useSettings')
      let s: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => { s = useSettings(); return {} })
      mount(TestComp)

      s!.location.value = 'Berlin'
      await s!.saveProfile()

      expect(localStorage.getItem('blog.settings.avatarUrl')).toBeNull()
      expect(localStorage.getItem('blog.settings.location')).toBeNull()
    })

    it('location 初始值由 authStore.user.location 載入（而非 localStorage）', async () => {
      const { useAuthStore } = await import('../stores/auth')
      vi.mocked(useAuthStore).mockReturnValue({
        user: {
          nickname: 'TestUser', bio: '', email: 'test@example.com',
          avatarUrl: null, website: null, socialLinks: null, location: 'Osaka',
        },
        fetchUser: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore>)

      vi.resetModules()
      const { useSettings } = await import('./useSettings')
      let s: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => { s = useSettings(); return {} })
      mount(TestComp)

      expect(s!.location.value).toBe('Osaka')
    })
  })

  describe('通知偏好改接後端', () => {
    it('初始值由 authStore.user 的 notification* 欄位載入', async () => {
      const { useAuthStore } = await import('../stores/auth')
      vi.mocked(useAuthStore).mockReturnValue({
        user: {
          nickname: 'TestUser', bio: '', email: 'test@example.com',
          avatarUrl: null, website: null, socialLinks: null, location: null,
          notificationComment: false, notificationLike: true,
          notificationReview: false, notificationFollow: true,
          notificationNewsletter: false,
        },
        fetchUser: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore>)

      vi.resetModules()
      const { useSettings } = await import('./useSettings')
      let s: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => { s = useSettings(); return {} })
      mount(TestComp)

      expect(s!.nComment.value).toBe(false)
      expect(s!.nLike.value).toBe(true)
      expect(s!.nReview.value).toBe(false)
      expect(s!.nFollow.value).toBe(true)
      expect(s!.nNewsletter.value).toBe(false)
    })

    it('saveNotifications 呼叫 updateNotifications 並帶上 5 個布林偏好（後端欄位名）', async () => {
      const { userService } = await import('../api/userService')
      const { useSettings } = await import('./useSettings')

      let s: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => { s = useSettings(); return {} })
      mount(TestComp)

      s!.nComment.value = true
      s!.nLike.value = false
      s!.nReview.value = true
      s!.nFollow.value = false
      s!.nNewsletter.value = true
      await s!.saveNotifications()

      expect(userService.updateNotifications).toHaveBeenCalledWith({
        comment: true,
        like: false,
        review: true,
        follow: false,
        newsletter: true,
      })
    })

    it('saveNotifications 不再寫入 blog.settings.n* 到 localStorage', async () => {
      const { useSettings } = await import('./useSettings')
      let s: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => { s = useSettings(); return {} })
      mount(TestComp)

      await s!.saveNotifications()

      expect(localStorage.getItem('blog.settings.nComment')).toBeNull()
      expect(localStorage.getItem('blog.settings.nLike')).toBeNull()
      expect(localStorage.getItem('blog.settings.nReview')).toBeNull()
      expect(localStorage.getItem('blog.settings.nFollow')).toBeNull()
      expect(localStorage.getItem('blog.settings.nNewsletter')).toBeNull()
    })

    it('saveNotifications 失敗時顯示 error toast', async () => {
      const { userService } = await import('../api/userService')
      vi.mocked(userService.updateNotifications).mockRejectedValueOnce(new Error('Network error'))

      const { useToast } = await import('./useToast')
      const mockShowToast = vi.fn()
      vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast })

      vi.resetModules()
      const { useSettings } = await import('./useSettings')
      let s: ReturnType<typeof useSettings> | null = null
      const TestComp = makeTestComponent(() => { s = useSettings(); return {} })
      mount(TestComp)

      await s!.saveNotifications()
      expect(mockShowToast).toHaveBeenCalledWith('儲存通知設定失敗', 'error')
    })
  })
})
