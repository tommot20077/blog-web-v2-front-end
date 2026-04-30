import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = 'http://localhost:9010'

async function loginUI(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForURL(/\/login/, { timeout: 5000 })
  await page.getByTestId('auth-login-field-email').fill(email)
  await page.getByTestId('auth-login-field-password').fill(password)
  await page.getByTestId('auth-login-submit').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('Settings (B1/B2/B3/B4)', () => {
  test('B1: /settings 載入 user 資料 (nickname 帶入既有值)', async ({ page }) => {
    const author = getCredentials('author')
    await loginUI(page, author.email, author.password)
    await page.evaluate(() => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
      return router.push('/settings')
    })
    await page.waitForURL('/settings', { timeout: 5000 })

    const nicknameInput = page.locator('input[placeholder="輸入你的顯示名稱"]')
    await expect(nicknameInput).toBeVisible({ timeout: 5000 })
    await expect(nicknameInput).toHaveValue(/.+/, { timeout: 5000 })
  })

  test('B2: 改 nickname 並儲存後，後端 GET /users/me 顯示新值', async ({ page, request }) => {
    const author = getCredentials('author')
    const newNickname = `Author Test ${Date.now()}`

    await loginUI(page, author.email, author.password)
    await page.evaluate(() => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
      return router.push('/settings')
    })
    await page.waitForURL('/settings', { timeout: 5000 })

    const nicknameInput = page.locator('input[placeholder="輸入你的顯示名稱"]')
    await expect(nicknameInput).toBeVisible({ timeout: 5000 })
    await nicknameInput.fill(newNickname)

    // 同時 register response listener 與 trigger click，避免 race
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/users/me/profile') && resp.request().method() === 'PATCH',
        { timeout: 10000 },
      ),
      page.getByRole('button', { name: '儲存變更' }).click(),
    ])

    // 用 API 直接驗證
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const accessToken = (await loginResp.json()).data.accessToken
    const me = await request.get(`${BACKEND}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect((await me.json()).data.nickname).toBe(newNickname)

    // restore
    await request.patch(`${BACKEND}/api/v1/users/me/profile`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      data: { nickname: 'Author' },
    })
  })

  test('B3+B4: 改密碼後舊 token 失效 (401), 新密碼可登入', async ({ request }) => {
    const author = getCredentials('author')
    const oldPw = author.password
    const newPw = `Test_${Date.now()}!`

    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: oldPw },
    })
    const oldToken = (await loginResp.json()).data.accessToken

    const change = await request.post(`${BACKEND}/api/v1/users/me/change-password`, {
      headers: { Authorization: `Bearer ${oldToken}`, 'Content-Type': 'application/json' },
      data: { oldPassword: oldPw, newPassword: newPw },
    })
    expect((await change.json()).code).toBe('00000')

    // B3: 舊 token 應 401 + ApiResponse 格式 (#12 修復後)
    const meWithOld = await request.get(`${BACKEND}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${oldToken}` },
    })
    expect(meWithOld.status()).toBe(401)
    expect((await meWithOld.json()).code).toBe('A0005')

    // B4: 新密碼可登入
    const newLogin = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: newPw },
    })
    const newToken = (await newLogin.json()).data.accessToken
    expect(newToken).toBeTruthy()

    // restore
    await request.post(`${BACKEND}/api/v1/users/me/change-password`, {
      headers: { Authorization: `Bearer ${newToken}`, 'Content-Type': 'application/json' },
      data: { oldPassword: newPw, newPassword: oldPw },
    })
  })
})
