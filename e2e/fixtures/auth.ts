import { test as base } from '@playwright/test'
import { EditorPage } from '../pages/editor.page'

const USE_MOCK = process.env.E2E_MOCK === '1'

type Role = 'reader' | 'author' | 'admin'

interface Credentials {
  email: string
  password: string
  nickname: string
}

const MOCK_CREDENTIALS: Record<Role, Credentials> = {
  reader: { email: 'reader@test.com', password: 'Password1', nickname: 'Yuan Reader' },
  author: { email: 'author@test.com', password: 'Password1', nickname: 'Yuan Author' },
  admin: { email: 'admin@test.com', password: 'Password1', nickname: 'Admin' },
}

const REAL_CREDENTIALS: Record<Role, Credentials> = {
  reader: { email: 'reader@test.local', password: 'Test1234!', nickname: 'Reader' },
  author: { email: 'author@test.local', password: 'Test1234!', nickname: 'Author' },
  admin: { email: 'admin@test.local', password: 'Test1234!', nickname: 'Admin' },
}

export function getCredentials(role: Role): Credentials {
  return USE_MOCK ? MOCK_CREDENTIALS[role] : REAL_CREDENTIALS[role]
}

// Keep AUTHOR_CREDENTIALS for backwards compatibility with existing specs
export const AUTHOR_CREDENTIALS = getCredentials('author')

type AuthFixtures = {
  editorPage: EditorPage
  /**
   * 以 AUTHOR 身份登入並導航至編輯器新建頁。
   */
  loginAsAuthorAndGoToEditor: () => Promise<void>
}

// 每一步導覽的等待上限。冷啟動時 Vite dev server 要先編譯 login／editor 的 chunk，
// 原本的 5 秒不夠（偶發在 beforeEach 逾時）。取 15 秒：夠冷啟動，又低於 playwright.config 的
// 單測 timeout（20 秒），逾時時看到的是「等不到哪個 URL」而不是籠統的 test timeout。
const NAVIGATION_TIMEOUT_MS = 15_000

export const test = base.extend<AuthFixtures>({
  editorPage: async ({ page }, use) => {
    await use(new EditorPage(page))
  },

  loginAsAuthorAndGoToEditor: async ({ page }, use) => {
    const creds = getCredentials('author')
    const go = async () => {
      await page.goto('/login')
      await page.waitForURL(/\/login/, { timeout: NAVIGATION_TIMEOUT_MS })

      await page.getByTestId('auth-login-field-email').fill(creds.email)
      await page.getByTestId('auth-login-field-password').fill(creds.password)
      await page.getByTestId('auth-login-submit').click()

      await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: NAVIGATION_TIMEOUT_MS })

      await page.evaluate(() => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
        return router.push('/editor')
      })
      await page.waitForURL('/editor', { timeout: NAVIGATION_TIMEOUT_MS })
    }
    await use(go)
  },
})

export { expect } from '@playwright/test'
