import { test as base } from '@playwright/test'
import { EditorPage } from '../pages/editor.page'

// Mock 預設帳號（對應 authMockData.ts seed users）
export const AUTHOR_CREDENTIALS = {
  email: 'user@test.com',
  password: 'Password1',
}

type AuthFixtures = {
  editorPage: EditorPage
  /**
   * 以 AUTHOR 身份登入並導航至編輯器新建頁。
   *
   * 策略：
   * 1. 在 /login 頁面完成登入（重導至首頁）
   * 2. 透過 window.__router.push('/editor') 觸發 SPA 內部導航，
   *    避免 page.goto('/editor') 全頁重載清空 Pinia 記憶體狀態
   */
  loginAsAuthorAndGoToEditor: () => Promise<void>
}

export const test = base.extend<AuthFixtures>({
  editorPage: async ({ page }, use) => {
    await use(new EditorPage(page))
  },

  loginAsAuthorAndGoToEditor: async ({ page }, use) => {
    const go = async () => {
      // 1. 直接到 /login（不透過 /editor，避免在 goto 前 returnUrl 尚未設定）
      await page.goto('/login')
      await page.waitForURL(/\/login/, { timeout: 5000 })

      // 2. 填入 AUTHOR 帳號並登入
      await page.getByPlaceholder('請輸入 Email').fill(AUTHOR_CREDENTIALS.email)
      await page.getByPlaceholder('請輸入密碼').fill(AUTHOR_CREDENTIALS.password)
      await page.getByRole('button', { name: /^登入$/ }).click()

      // 3. 等待離開 /login（登入成功後重導至首頁）
      await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })

      // 4. 透過 SPA 內部路由導航至 /editor（避免全頁重載清空 Pinia 狀態）
      await page.evaluate(() => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
        return router.push('/editor')
      })
      await page.waitForURL('/editor', { timeout: 5000 })
    }
    await use(go)
  },
})

export { expect } from '@playwright/test'
