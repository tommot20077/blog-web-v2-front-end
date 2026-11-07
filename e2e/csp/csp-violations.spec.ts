import { test as base, expect, type Page } from '@playwright/test'
import { readNginxCsp } from './nginxCsp'

/**
 * A2（XSS-03）：用 E2E 收集 CSP 違規。決策：零違規後 nginx.conf 才從 Report-Only 改為強制；不建收報端點。
 *
 * 頁面由 vite.csp.config.ts 供應：mock 模式的正式建置 + preview.headers 送出 nginx.conf 解析出的 CSP
 *（字串單一來源，見 e2e/csp/nginxCsp.ts）。這個 spec 先確認 header 真的帶上，再走過主要頁面與互動，
 * 同時收集兩種訊號：document 的 `securitypolicyviolation` 事件、瀏覽器 console 的 CSP 訊息。
 *
 * 正式建置沒有 window.__router（僅 DEV 掛載），站內導覽改用 history.pushState + popstate，
 * vue-router 對 popstate 與使用者按連結走同一套導覽流程；登入後不能 page.goto（reload 會丟掉 mock 的記憶體登入狀態）。
 */
const { headerName, policy } = readNginxCsp()

type Violation = {
  source: 'event' | 'console'
  directive?: string
  blockedURI?: string
  documentURI?: string
  sourceFile?: string
  line?: number
  sample?: string
  text?: string
}

/**
 * 唯一的排除項：mock 資料（src/api/mock/data.ts）的封面圖用 https://picsum.photos。
 * 這是 mock 資料的假象，正式環境的圖片一律是同源的 /api/v1/files/{id}/content（見 nginx.conf img-src 註解），
 * 真實 service（src/api/real）不會產生這種網址，故不應為了它放寬政策。只排除這一個主機的 img-src，其餘一律算違規。
 */
// picsum.photos 會 302 到 fastly.picsum.photos，兩者都是同一個 mock 圖床
const MOCK_IMAGE_URL = /^https:\/\/(?:fastly\.)?picsum\.photos\//
const isMockOnlyImageHost = (v: Violation) =>
  v.directive === 'img-src' && MOCK_IMAGE_URL.test(v.blockedURI ?? '')
const isMockOnlyImageConsole = (v: Violation) =>
  v.source === 'console' && new RegExp(`Loading the image '${MOCK_IMAGE_URL.source.slice(1)}`).test(v.text ?? '')

const test = base.extend<{ violations: Violation[] }>({
  violations: async ({ page }, use) => {
    const violations: Violation[] = []

    // 建置時 API 位址是正式環境的 https://90030.xyz（見 playwright.config.ts）；mock 模式本來不打網路，
    // 只有 useAuthedImages 會直接請求檔案，這裡攔下回 404，避免測試連到真實主機。
    // page.route 在網路層攔截，CSP 檢查仍在它之前發生，不影響違規的偵測。
    await page.route('https://90030.xyz/**', (route) => route.fulfill({ status: 404, body: '' }))

    await page.exposeFunction('__reportCspViolation', (v: Violation) => {
      if (!isMockOnlyImageHost(v)) violations.push(v)
    })
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        ;(window as unknown as { __reportCspViolation: (v: unknown) => void }).__reportCspViolation({
          source: 'event',
          directive: e.effectiveDirective,
          blockedURI: e.blockedURI,
          documentURI: e.documentURI,
          sourceFile: e.sourceFile,
          line: e.lineNumber,
          sample: e.sample,
        })
      })
    })
    page.on('console', (msg) => {
      const text = msg.text()
      if (/content security policy|violates the following|Refused to (load|apply|execute|connect|frame)/i.test(text)) {
        const v: Violation = { source: 'console', text }
        if (!isMockOnlyImageConsole(v)) violations.push(v)
      }
    })

    await use(violations)
  },
})

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
}

/** 站內導覽（不 reload）：vue-router 會處理 popstate。 */
async function spaNavigate(page: Page, path: string) {
  // 若有「未儲存修改」確認框擋住導覽，要讓測試明確失敗而不是被 Playwright 自動關掉後卡在原頁
  page.once('dialog', (dialog) => {
    throw new Error(`導覽到 ${path} 時出現非預期對話框：${dialog.message()}`)
  })
  await page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
  }, path)
  await page.waitForURL((url) => url.pathname + url.search === path || url.pathname === path.split('?')[0])
  await settle(page)
}

async function login(page: Page, role: 'author' | 'admin') {
  const creds = {
    author: { email: 'author@test.com', password: 'Password1' },
    admin: { email: 'admin@test.com', password: 'Password1' },
  }[role]
  await page.goto('/login')
  await page.getByTestId('auth-login-field-email').fill(creds.email)
  await page.getByTestId('auth-login-field-password').fill(creds.password)
  await page.getByTestId('auth-login-submit').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
  await settle(page)
}

test.describe('CSP 違規收集（零違規才允許強制）', () => {
  test.afterEach(async ({ violations }, testInfo) => {
    // 失敗時把違規清單附進報告，方便直接依清單修正
    if (violations.length > 0) {
      await testInfo.attach('csp-violations.json', {
        body: JSON.stringify(violations, null, 2),
        contentType: 'application/json',
      })
    }
  })

  test('測試平台確實套用 nginx.conf 的 CSP header（防止 E2E 在沒有 header 的頁面上空轉）', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.headers()[headerName.toLowerCase()]).toBe(policy)
  })

  test('公開頁面：首頁、文章列表、文章詳情、標籤、作者、搜尋', async ({ page, violations }) => {
    await page.goto('/')
    await settle(page)

    await page.goto('/articles')
    await settle(page)
    const articleHref = await page.locator('a[href^="/articles/"]').first().getAttribute('href')
    expect(articleHref, '文章列表應有至少一篇文章').toBeTruthy()

    await page.goto(articleHref!)
    await settle(page)
    await expect(page.locator('article, .prose').first()).toBeVisible()

    await page.goto('/tags')
    await settle(page)
    const tagHref = await page.locator('a[href^="/tags/"]').first().getAttribute('href')
    if (tagHref) {
      await page.goto(tagHref)
      await settle(page)
    }

    const authorHref = await page
      .goto(articleHref!)
      .then(() => settle(page))
      .then(() => page.locator('a[href^="/author/"]').first().getAttribute('href'))
    if (authorHref) {
      await page.goto(authorHref)
      await settle(page)
    }

    await page.goto('/search')
    await page.getByTestId('search-input').fill('Vue')
    await page.keyboard.press('Enter')
    await settle(page)

    await page.goto('/archive')
    await settle(page)

    expect(violations).toEqual([])
  })

  test('登入、錯誤密碼與註冊頁', async ({ page, violations }) => {
    await page.goto('/login')
    await page.getByTestId('auth-login-field-email').fill('nobody@test.com')
    await page.getByTestId('auth-login-field-password').fill('WrongPass1')
    await page.getByTestId('auth-login-submit').click()
    await settle(page)

    await page.goto('/register')
    await settle(page)
    await page.goto('/forgot-password')
    await settle(page)

    expect(violations).toEqual([])
  })

  test('作者：編輯器（CodeMirror 輸入、程式碼高亮預覽）、設定頁頭像預覽 blob:、我的文章', async ({ page, violations }) => {
    await login(page, 'author')

    await spaNavigate(page, '/editor')
    await page.getByTestId('editor-title-input').fill('CSP 測試文章')
    await page.locator('.cm-content').click()
    await page.keyboard.type('# 標題\n\n內文 **粗體**\n\n```js\nconst answer = 42\n```\n\n![同源圖片](/api/v1/files/csp-e2e/content)\n\n')
    await expect(page.getByTestId('editor-preview').locator('pre')).toBeVisible()
    await page.getByTestId('editor-mode-split').click()
    await page.getByTestId('editor-save-btn').click()
    await expect(page.getByText('草稿已儲存')).toBeVisible()
    await settle(page)

    await spaNavigate(page, '/my-articles')
    await spaNavigate(page, '/settings')
    await expect(page.getByTestId('settings-public-note')).toBeVisible()
    await page.locator('input[type="file"][accept="image/*"]').setInputFiles('e2e/fixtures/test-image.png')
    await expect(page.locator('img[src^="blob:"]').first()).toBeVisible()
    await settle(page)

    await spaNavigate(page, '/bookmarks')
    await spaNavigate(page, '/my-stats')

    expect(violations).toEqual([])
  })

  test('管理員：後台各頁', async ({ page, violations }) => {
    await login(page, 'admin')

    for (const path of ['/admin', '/admin/review', '/admin/categories', '/admin/tags', '/admin/search']) {
      await spaNavigate(page, path)
    }

    expect(violations).toEqual([])
  })
})
