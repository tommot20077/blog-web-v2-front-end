import { test, expect } from '@playwright/test'
import { fetchVerificationToken, resetAuthRateLimits } from '../fixtures/admin-helpers'

/**
 * N1：註冊 → 信箱驗證 → 登入（全鏈）
 *
 * 為什麼需要這條：其餘 E2E 一律以 `activateUser`（直接下 SQL 把帳號改成
 * ACTIVE）跳過驗證流程，因此「使用者收到連結後如何啟用帳號」這段旅程
 * 在此之前沒有任何 E2E 走過。
 *
 * 刻意寫在**旅程層**而非端點層（不斷言 HTTP method / 請求形狀）：
 * 後端 PR #48 正把 verify-email 從 GET+query 改為 POST+body、前端 PR #38
 * 同步改呼叫。兩種實作都應讓本測試通過；但**只有一邊上線時會紅** ——
 * 那正是這條測試要抓的部署耦合（H6 型缺陷：兩邊各自綠燈、接起來 405）。
 *
 * 對應設計文件：blog-web-v2/ai-docs/integration-tests/2026-07-17-fullstack-e2e-test-cases.md
 */
test('N1 註冊 → 信箱驗證 → 登入', async ({ page }) => {
  test.setTimeout(60_000)

  // 後端對 auth 端點有 per-IP 限流（register 10/60min、login 20/15min），
  // 而 E2E 全部請求同 IP、共用計數器。撞頂後的症狀是「註冊後沒有導向」這種
  // 看似與限流無關的失敗（實測踩過）。本 spec 會註冊 1 次、登入 2 次。
  resetAuthRateLimits()

  const ts = Date.now()
  const email = `n1verify_${ts}@test.local`
  const password = 'Test1234!'

  // ── 1. 註冊 ────────────────────────────────────────────────────────────
  await page.goto('/register')
  await page.getByTestId('auth-register-field-email').fill(email)
  await page.getByTestId('auth-register-field-username').fill(`n1user_${ts}`)
  await page.getByTestId('auth-register-field-nickname').fill(`N1 User ${ts}`)
  await page.getByTestId('auth-register-field-password').fill(password)
  await page.getByTestId('auth-register-submit').click()

  // 註冊成功會導向 /login 並提示前往信箱驗證
  await page.waitForURL(/\/login/, { timeout: 15_000 })

  // ── 2. 驗證前不得能登入（帳號尚未啟用）──────────────────────────────
  await page.getByTestId('auth-login-field-email').fill(email)
  await page.getByTestId('auth-login-field-password').fill(password)
  await page.getByTestId('auth-login-submit').click()
  // 仍停留在 /login：未驗證的帳號不應取得 session
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })

  // ── 3. 取得驗證 token（等同使用者從驗證信取得）──────────────────────
  // compose 內無 SMTP，但 token 於註冊當下即寫入 verification_tokens
  const token = fetchVerificationToken(email)
  expect(token).toBeTruthy()

  // ── 4. 走驗證頁（真瀏覽器 → 真 HTTP → 真後端 → 真 DB）───────────────
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`)
  await expect(page.getByTestId('auth-verify-success')).toBeVisible({ timeout: 15_000 })

  // ── 5. 驗證後可正常登入 ────────────────────────────────────────────────
  await page.goto('/login')
  await page.getByTestId('auth-login-field-email').fill(email)
  await page.getByTestId('auth-login-field-password').fill(password)
  await page.getByTestId('auth-login-submit').click()

  // 離開 /login 即代表取得 session（沿用 end-to-end-sanity 的判準）
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
})

/**
 * N1 異常流：無效 token 必須「顯性」報錯。
 *
 * 判準原則：顯性錯誤 > 靜默降級。H5 的教訓是前端把後端錯誤靜默吞成空狀態，
 * 使用者與測試都看不到問題。
 */
test('N1-E 無效的驗證 token → 顯性錯誤，不得靜默成功', async ({ page }) => {
  await page.goto('/verify-email?token=definitely-not-a-valid-token')

  await expect(page.getByTestId('auth-verify-failure')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('auth-verify-success')).toBeHidden()
})

/**
 * N1 邊界:完全沒有 token 時不得打 API，直接顯示無效連結。
 */
test('N1-B 驗證頁無 token → 顯示無效連結', async ({ page }) => {
  await page.goto('/verify-email')

  await expect(page.getByTestId('auth-verify-no-token')).toBeVisible({ timeout: 10_000 })
})
