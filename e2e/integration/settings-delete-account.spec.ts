import { test, expect } from '@playwright/test'
import { activateUser } from '../fixtures/admin-helpers'

test.describe('Settings 帳號刪除 (B5)', () => {
  test('B5: 註冊臨時 user → 刪除 → 該帳號無法再登入', async ({ request, page }) => {
    // 此 spec 需要 user activation 機制（kubectl/docker compose exec psql），
    // 本地 dev 若 kubectl 連不上 k3s 會 skip。CI 走 docker compose path 應正常。
    test.skip(
      process.env.E2E_CI !== '1' && !process.env.E2E_FORCE_DELETE_ACCOUNT,
      'B5 needs activateUser via kubectl/docker — set E2E_FORCE_DELETE_ACCOUNT=1 to force locally',
    )
    const ts = Date.now()
    const email = `b5_${ts}@test.local`
    const username = `b5_${ts}`
    const password = 'Test1234!'

    // 1. 註冊
    const regResp = await request.post('http://localhost:9010/api/v1/auth/register', {
      data: { email, password, username, nickname: `B5User${ts}` },
    })
    expect((await regResp.json()).code).toBe('00000')

    // 2. 啟用
    activateUser(email, 'USER')

    // 3. 登入
    await page.goto('/login')
    await page.getByTestId('auth-login-field-email').fill(email)
    await page.getByTestId('auth-login-field-password').fill(password)
    await page.getByTestId('auth-login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))

    // 4. 進 settings → 切「危險操作」section
    // 用 router.push 避免 page.goto full reload 重置 Pinia state
    await page.evaluate(() => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
      return router.push('/settings')
    })
    await page.waitForURL('/settings', { timeout: 5000 })
    await page.getByRole('button', { name: /危險操作/ }).click()

    // 5. 處理 native confirm + prompt
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm')
      await dialog.accept()
    })
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt')
      await dialog.accept(password)
    })

    // 監聽 backend DELETE response
    const deleteResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/users/me') && r.request().method() === 'DELETE',
      { timeout: 10000 },
    )

    await page.getByTestId('delete-account-btn').click()
    const deleteResp = await deleteResponsePromise
    expect(deleteResp.status()).toBeLessThan(400)

    // 6. 驗該帳號已刪：用同 credentials 登入應失敗
    const reLoginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
      data: { identifier: email, password },
    })
    const reLoginBody = await reLoginResp.json()
    expect(reLoginBody.code).not.toBe('00000')
  })
})
