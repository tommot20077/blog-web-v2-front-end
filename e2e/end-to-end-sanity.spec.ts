import { execSync } from 'child_process'
import { test, expect, type Page } from '@playwright/test'
import { getCredentials } from './fixtures/auth'

const BACKEND = 'http://localhost:9010'

interface PiniaWindow {
  __pinia: { state: { value: { auth: { accessToken: string | null } } } }
  __router: { push: (path: string) => Promise<void> }
}

function activateUser(email: string, role: 'AUTHOR' | 'USER' | 'ADMIN' = 'AUTHOR'): void {
  const sql = `UPDATE users SET email_verified=true, status='ACTIVE', role='${role}' WHERE email='${email}'`
  execSync(
    `docker run --rm -e PGPASSWORD=tommot40 postgres:15-alpine psql -h 10.0.0.214 -p 30120 -U luca -d blog_v2_db -c "${sql}"`,
    { stdio: 'pipe' },
  )
}

async function loginUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForURL(/\/login/, { timeout: 5000 })
  await page.getByTestId('auth-login-field-email').fill(email)
  await page.getByTestId('auth-login-field-password').fill(password)
  await page.getByTestId('auth-login-submit').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })
}

async function logoutUI(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as PiniaWindow
    return w.__router.push('/')
  })
  await page.waitForURL('/', { timeout: 5000 })
  // 透過 store 直接 logout 比依賴具體 UI 元件穩定（navbar logout 互動因 viewport 而異）
  await page.evaluate(async () => {
    const w = window as unknown as { __pinia: { _s: Map<string, { logout: () => Promise<void> }> } }
    const store = w.__pinia._s.get('auth')
    if (store) await store.logout()
  })
}

test('C2 端到端 sanity: 完整 user journey 一條龍', async ({ page, request }) => {
  test.skip(process.env.E2E_MOCK === '1', '需要真實後端，在 e2e-integration job 執行')
  test.setTimeout(120_000)

  const ts = Date.now()
  const author = {
    email: `c2author_${ts}@test.local`,
    username: `c2auth${ts}`,
    nickname: `C2Author${ts}`,
    password: 'Test1234!',
  }
  const adminCreds = getCredentials('admin')

  // Step 1: 訪首頁
  await page.goto('/')
  await expect(page.locator('.hero, .hero-title, [data-testid="hero"]').first()).toBeVisible({ timeout: 5000 })

  // Step 2: API 註冊 + docker psql 激活 + 升 AUTHOR
  const reg = await request.post(`${BACKEND}/api/v1/auth/register`, {
    data: author,
  })
  expect((await reg.json()).code).toBe('00000')
  activateUser(author.email, 'AUTHOR')

  // Step 3: UI 登入 author → 寫文 → 提交審核
  await loginUI(page, author.email, author.password)
  // 用 router.push 進 fresh editor (避免 helper 副作用)
  await page.evaluate(() => {
    const w = window as unknown as PiniaWindow
    return w.__router.push('/editor')
  })
  await page.waitForURL('/editor', { timeout: 5000 })

  const articleTitle = `C2 Sanity Article ${ts}`
  await page.getByTestId('editor-title-input').fill(articleTitle)
  // CodeMirror content fill 透過 click + keyboard
  await page.locator('.cm-content').click()
  await page.keyboard.type('# Hello from C2 sanity\n\nSome content for end-to-end test.')

  // 儲存 + 提交
  await page.getByTestId('editor-save-btn').click()
  await page.waitForURL(/\/editor\/.+/, { timeout: 5000 })
  await page.getByTestId('editor-publish-btn').click()
  // 提交後可能 redirect 或停留, 等 toast / state
  await page.waitForTimeout(1500)
  await logoutUI(page)

  // Step 4: 換 admin 登入 → /admin/review → 通過該文
  await loginUI(page, adminCreds.email, adminCreds.password)
  await page.evaluate(() => {
    const w = window as unknown as PiniaWindow
    return w.__router.push('/admin/review')
  })
  await page.waitForURL('/admin/review', { timeout: 5000 })

  const articleCard = page.locator('.admin-card', { hasText: articleTitle })
  await expect(articleCard).toBeVisible({ timeout: 8000 })
  await articleCard.getByRole('button', { name: '通過' }).click()
  await expect(articleCard).toHaveCount(0, { timeout: 5000 })
  await logoutUI(page)

  // Step 5: anonymous 瀏覽公開列表 → 文章可見並可點進
  await page.goto('/articles')
  // 找到該文（可能在第一頁，因為剛發布、按 createdAt 倒序）
  const articleLink = page.locator('a', { hasText: articleTitle })
  await expect(articleLink.first()).toBeVisible({ timeout: 8000 })
  await articleLink.first().click()
  await expect(page).toHaveURL(/\/articles\//)
  await expect(page.locator('.article-title, h1', { hasText: articleTitle })).toBeVisible({ timeout: 5000 })

  // Step 6: author 登回 /settings → 改 nickname
  await loginUI(page, author.email, author.password)
  await page.evaluate(() => {
    const w = window as unknown as PiniaWindow
    return w.__router.push('/settings')
  })
  await page.waitForURL('/settings', { timeout: 5000 })

  const newNickname = `${author.nickname}-Updated`
  const nickInput = page.locator('input[placeholder="輸入你的顯示名稱"]')
  await nickInput.fill(newNickname)
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/v1/users/me/profile') && r.request().method() === 'PATCH',
      { timeout: 8000 },
    ),
    page.getByRole('button', { name: '儲存變更' }).click(),
  ])

  // 驗證 — 用 fresh request 看後端
  const adminLogin = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: { identifier: adminCreds.email, password: adminCreds.password },
  })
  const adminToken = (await adminLogin.json()).data.accessToken
  // author 自己登入拿 token 確認
  const meLogin = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: { identifier: author.email, password: author.password },
  })
  const meToken = (await meLogin.json()).data.accessToken
  const meResp = await request.get(`${BACKEND}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${meToken}` },
  })
  expect((await meResp.json()).data.nickname).toBe(newNickname)

  // 清理: admin 刪該篇文章（admin 有 ARTICLE_DELETE 權限 — 測試 fixture 衛生）
  const articlesResp = await request.get(`${BACKEND}/api/v1/articles?page=1&size=20`)
  const recordsList = (await articlesResp.json()).data.records as Array<{ uuid: string; title: string }>
  const target = recordsList.find((a) => a.title === articleTitle)
  if (target) {
    await request.delete(`${BACKEND}/api/v1/articles/${target.uuid}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  }
})
