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

  describe('activeSection 狀態改由 SettingsView 透過路由 query 掌管（2026-07-19 樹狀導覽併欄）', () => {
    it('useSettings() 不再回傳 activeSection / setSection（不再用 localStorage 記錄區塊）', async () => {
      const { useSettings } = await import('./useSettings')

      let captured: Record<string, unknown> | null = null
      const TestComp = makeTestComponent(() => {
        captured = useSettings() as unknown as Record<string, unknown>
        return {}
      })

      mount(TestComp)
      expect(captured).not.toHaveProperty('activeSection')
      expect(captured).not.toHaveProperty('setSection')
    })

    it('不再寫入 blog.settings.section 到 localStorage', async () => {
      const { useSettings } = await import('./useSettings')
      const TestComp = makeTestComponent(() => {
        useSettings()
        return {}
      })

      mount(TestComp)
      expect(localStorage.getItem('blog.settings.section')).toBeNull()
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
  describe('公開頁欄位即時驗證（website／社群帳號名稱）', () => {
    async function setup(userOverrides: Record<string, unknown> = {}) {
      const { useAuthStore } = await import('../stores/auth')
      vi.mocked(useAuthStore).mockReturnValue({
        user: {
          uuid: 'me-uuid', nickname: 'TestUser', bio: '', email: 'test@example.com',
          avatarUrl: null, website: null, socialLinks: null, location: null,
          ...userOverrides,
        },
        fetchUser: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore>)
      const { useSettings } = await import('./useSettings')
      const { userService } = await import('../api/userService')
      vi.mocked(userService.updateProfile).mockClear()
      let s: ReturnType<typeof useSettings> | null = null
      mount(makeTestComponent(() => { s = useSettings(); return {} }))
      return { s: s!, userService }
    }

    it('website 不是 http(s) → websiteError 有訊息，saveProfile 不呼叫 API', async () => {
      const { s, userService } = await setup()
      s.website.value = 'javascript:alert(1)'
      expect(s.websiteError.value).not.toBe('')
      await s.saveProfile()
      expect(userService.updateProfile).not.toHaveBeenCalled()
    })

    it.each(['https://example.com', 'http://example.com/a?b=1', ''])('website %j 合格', async (v) => {
      const { s, userService } = await setup()
      s.website.value = v
      expect(s.websiteError.value).toBe('')
      await s.saveProfile()
      expect(userService.updateProfile).toHaveBeenCalledTimes(1)
    })

    it('website 超過後端上限 255 字 → 不合格', async () => {
      const { s } = await setup()
      s.website.value = 'https://example.com/' + 'a'.repeat(256)
      expect(s.websiteError.value).not.toBe('')
    })

    it.each([
      ['github', 'https://github.com/octocat'],
      ['twitter', '@@user'],
      ['linkedin', 'a/b'],
      ['github', 'my handle'],
      ['twitter', 'javascript:alert(1)'],
      ['linkedin', 'a'.repeat(101)],
    ] as const)('%s 填 %j → 對應欄位有錯誤，saveSocial 不呼叫 API', async (field, value) => {
      const { s, userService } = await setup()
      s[field].value = value
      const err = { github: s.githubError, twitter: s.twitterError, linkedin: s.linkedinError }[field]
      expect(err.value).not.toBe('')
      expect(s.hasSocialErrors.value).toBe(true)
      await s.saveSocial()
      expect(userService.updateProfile).not.toHaveBeenCalled()
    })

    it('合格的帳號名稱（含前導 @、中文、空白＝未填）→ 無錯誤並送出 JSON', async () => {
      const { s, userService } = await setup()
      s.github.value = 'octocat'
      s.twitter.value = '@yuan_dev'
      s.linkedin.value = ''
      expect(s.hasSocialErrors.value).toBe(false)
      await s.saveSocial()
      expect(userService.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
        socialLinks: JSON.stringify({ github: 'octocat', twitter: '@yuan_dev', linkedin: '' }),
      }))
    })

    it('既有資料是舊的網址格式 → 載入後即顯示錯誤，提醒改成帳號名稱', async () => {
      const { s } = await setup({ socialLinks: JSON.stringify({ github: 'https://github.com/old', twitter: '', linkedin: '' }) })
      expect(s.githubError.value).not.toBe('')
      expect(s.hasSocialErrors.value).toBe(true)
    })

    it('publicProfilePath 指向 /author/{我的 uuid}；沒有 uuid 時為 null', async () => {
      const a = await setup()
      expect(a.s.publicProfilePath.value).toBe('/author/me-uuid')
      vi.resetModules()
      const b = await setup({ uuid: undefined })
      expect(b.s.publicProfilePath.value).toBeNull()
    })
  })
})
