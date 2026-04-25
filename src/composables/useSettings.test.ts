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
    it('removeAvatar 同時清除 localStorage 的 blog.settings.avatarUrl', async () => {
      localStorage.setItem('blog.settings.avatarUrl', 'https://cdn.example.com/old.png')
      const { useSettings } = await import('./useSettings')

      let capturedRemoveAvatar: (() => void) | null = null
      const TestComp = makeTestComponent(() => {
        const { removeAvatar } = useSettings()
        capturedRemoveAvatar = removeAvatar
        return {}
      })

      mount(TestComp)
      capturedRemoveAvatar!()
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
})
