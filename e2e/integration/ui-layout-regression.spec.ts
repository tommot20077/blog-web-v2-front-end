import { test, expect } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

/**
 * UI Layout Regression（T6–T9）— RED 釘樁測試
 *
 * 根因：src/index.css 缺少 `@tailwind utilities` 指令，全站 Tailwind utility class
 * 完全沒被產生，凡靠 Tailwind class 排版的畫面都會塌陷成瀏覽器原生外觀。
 * 本檔只負責「釘住」使用者實測回報的 4 個缺陷，本輪不修任何 src/ 程式碼。
 *
 * 設計原則：使用者尚未選定最終導覽列/樣式方案，因此一律斷言「缺陷消失」的不變量
 * （不得裁切、必須水平排列、必須有提示、密度不得超過上限），不寫死具體設計值。
 */

// 帳號一律取自 global-setup 播種的 AUTHOR（reader/author/admin 三者中唯一同時
// 具備 ARTICLE_CREATE/EDIT 又不會在導覽列多出「後台」項目的角色）。
// 注意：本檔原本寫死 `yuan.test@example.com` 與一個開發機上的草稿 UUID —— 兩者
// 都只存在於 Yuan 的本機 DB，CI 是全新資料庫，於是 loginUI 的 waitForURL 必然逾時
// （CI 實測 T6–T9 五支全掛在 spec:27，錯誤為 waitForURL 5000ms exceeded）。
const CREDS = getCredentials('author')
const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

async function loginUI(page: Page) {
  await page.goto('/login')
  await page.waitForURL(/\/login/, { timeout: 5000 })
  await page.getByTestId('auth-login-field-email').fill(CREDS.email)
  await page.getByTestId('auth-login-field-password').fill(CREDS.password)
  await page.getByTestId('auth-login-submit').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })
}

/**
 * 以 API 建立一篇屬於 AUTHOR 的草稿，供 T6-a / T6-b 開啟 /editor/{uuid}。
 * 沿用 editor-edit-existing.spec.ts 既有慣例（API 建 → 測 → finally 刪），
 * 讓本檔不依賴任何預先存在的資料，本機與 CI 行為一致。
 */
async function apiLoginAsAuthor(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: { identifier: CREDS.email, password: CREDS.password },
  })
  expect(res.ok(), `API 登入失敗（HTTP ${res.status()}），無法建立測試用草稿`).toBeTruthy()
  return (await res.json()).data.accessToken
}

async function createDraft(request: APIRequestContext, token: string): Promise<string> {
  const res = await request.post(`${BACKEND}/api/v1/articles`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: `UI Layout Regression Draft ${Date.now()}`,
      summary: 'layout regression fixture',
      content: '# Layout fixture\n\nfixture body',
      categoryIds: [],
      tagNames: [],
    },
  })
  expect(res.ok(), `建立測試用草稿失敗（HTTP ${res.status()}）`).toBeTruthy()
  return (await res.json()).data.uuid
}

async function deleteDraft(request: APIRequestContext, token: string, uuid: string) {
  await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// SPA 內部導航（沿用既有慣例：透過 App 掛在 window 上的 __router，避免整頁重新載入
// 造成 Pinia authStore 重新水合的競態）
async function spaNavigate(page: Page, path: string) {
  await page.evaluate((p) => {
    const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
    return router.push(p)
  }, path)
  await page.waitForURL(path, { timeout: 5000 })
}

test.describe('UI Layout Regression (T6-T9)', () => {

  // ── T6-a: /editor 工具列按鈕應水平排列 ─────────────────────────────────────
  test('T6-a: /editor 工具列按鈕應水平排列（不得被拆成多列）', async ({ page, request }) => {
    const token = await apiLoginAsAuthor(request)
    const draftUuid = await createDraft(request, token)
    try {
      await loginUI(page)
      await page.goto(`/editor/${draftUuid}`)
      await page.getByTestId('editor-root').waitFor({ state: 'visible', timeout: 5000 })

    // 實測發現：EditorToolbar.vue 用 `flex flex-wrap` 排列按鈕群組，群組間以一個
    // <div>（分隔線）隔開。Tailwind 失效後 <div> 退化成 block 元素，會強制換行；
    // 但同一群組內的 <button> 因瀏覽器預設 display:inline-block，即使版面塌陷仍會
    // 排在同一行——所以「只比較工具列最前面兩顆按鈕（H1/H2）」測不出這個 bug
    // （已實測驗證：H1/H2 兩者 y 座標永遠相同）。真正能反映「群組被垂直堆疊」的
    // 斷言，是比較橫跨不同群組的按鈕（各群組的第一顆），這裡取 6 個群組各自的
    // 代表按鈕，斷言它們的 y 座標範圍（spread）夠小，才代表整條工具列在同一行。
      const groupFirstButtonTitles = ['H1', '粗體', '程式碼區塊', '有序列表', '連結', '復原']
      const ys: number[] = []
      for (const title of groupFirstButtonTitles) {
        const box = await page.getByTitle(title, { exact: true }).boundingBox()
        expect(box, `找不到工具列按鈕（title="${title}"），可能是選擇器失效而非樣式問題`).not.toBeNull()
        ys.push(box!.y)
      }
      const spread = Math.max(...ys) - Math.min(...ys)
      expect(
        spread,
        `工具列 6 個按鈕群組的第一顆按鈕應在同一行（y 座標差 < 8px），實際 y 座標範圍達 ${spread}px，` +
        `代表工具列被拆成多列垂直堆疊（Tailwind flex 排版失效）`,
      ).toBeLessThan(8)
    } finally {
      await deleteDraft(request, token, draftUuid)
    }
  })

  // ── T6-b: /editor META 面板標籤輸入框不應是瀏覽器原生外觀 ─────────────────────
  test('T6-b: /editor META 面板標籤輸入框不應呈現瀏覽器原生未樣式化外觀', async ({ page, request }) => {
    const token = await apiLoginAsAuthor(request)
    const draftUuid = await createDraft(request, token)
    try {
      await loginUI(page)
      await page.goto(`/editor/${draftUuid}`)
      await page.getByTestId('editor-root').waitFor({ state: 'visible', timeout: 5000 })

      // EditorMetaSidebar.vue 的標籤輸入框套用 `rounded-xl border ...`（Tailwind）。
      // 實測：Tailwind 失效時 computed border-radius 為 "0px"、border 退化成瀏覽器
      // 原生的 "2px inset rgb(118, 118, 118)"（Chromium 表單控制項預設外觀）。
      // border-radius 是最不會受深色模式 / 背景色等其他因素干擾的穩健訊號。
      const tagInput = page.getByPlaceholder('輸入標籤後按 Enter')
      await expect(tagInput).toBeVisible({ timeout: 5000 })
      const borderRadius = await tagInput.evaluate((el) => getComputedStyle(el).borderRadius)
      const radiusPx = parseFloat(borderRadius)
      expect(
        radiusPx,
        `標籤輸入框 border-radius 應 > 0（對應 Tailwind "rounded-xl" = 12px），` +
        `實際 computed border-radius="${borderRadius}"，等同瀏覽器原生未樣式化外觀`,
      ).toBeGreaterThan(0)
    } finally {
      await deleteDraft(request, token, draftUuid)
    }
  })

  // ── T7: /bookmarks 於 768×824 視窗下站名 logo 不得被裁切 ─────────────────────
  test('T7: /bookmarks 於 768×824 視窗站名 logo 不得被裁切', async ({ page }) => {
    await loginUI(page)
    await page.setViewportSize({ width: 768, height: 824 })
    await spaNavigate(page, '/bookmarks')
    await page.getByTestId('bookmarks-root').waitFor({ state: 'visible', timeout: 5000 })

    // 注意（與任務描述不同，已實地確認）：/bookmarks 走 shell layout（App.vue 的
    // isShellOrFull 分支），不會渲染主站 NavigationBar，因此 [data-testid=navbar-logo]
    // 在這個頁面「不存在」，不是選擇器打錯，是不同元件。站名 logo 實際位於
    // BookmarksView.vue 的 `.shell-rail .brand`（目前無 data-testid，見回報建議）。
    const brand = page.locator('.shell-rail .brand')
    await expect(brand).toBeVisible({ timeout: 5000 })

    const metrics = await brand.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, x: r.x, width: r.width }
    })

    // 主斷言：logo 容器內部不得溢出（scrollWidth 不應大於 clientWidth）。
    // 實測：.shell-rail 寬度在窄視窗下沒有響應式收合，"MY BLOG WEB." 文字被擠壓
    // 到每行只容得下 2-3 個字元、逐字換行，clientWidth=35 但 scrollWidth=56。
    expect(
      metrics.scrollWidth,
      `logo 容器不應內部溢出：scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}` +
      `（文字被擠壓/裁切，未隨窄視窗響應式調整）`,
    ).toBeLessThanOrEqual(metrics.clientWidth)

    // 次斷言：logo 容器本身仍應完整落在 viewport 內（防止另一種跑版：整體溢出視窗外）
    expect(metrics.x, 'logo 容器左界不應在 viewport 外').toBeGreaterThanOrEqual(0)
    expect(metrics.x + metrics.width, 'logo 容器右界不應超出 768px viewport').toBeLessThanOrEqual(768)
  })

  // ── T8: /settings 帳號安全區空表單送出應顯示可見錯誤提示 ─────────────────────
  test('T8: /settings 帳號安全空表單送出必須顯示可見驗證提示，且不得發request', async ({ page }) => {
    await loginUI(page)
    await spaNavigate(page, '/settings')
    await page.getByText('帳號安全').click()

    // 監聽是否有密碼更新相關的 PUT/POST 請求送出（正確行為：不應該送）
    let passwordRequestCount = 0
    page.on('request', (req) => {
      const method = req.method()
      if ((method === 'PUT' || method === 'POST') && /\/api\/v1\/.*password/i.test(req.url())) {
        passwordRequestCount += 1
      }
    })

    // 點擊前先記錄畫面上既有的「錯誤/提示類」元素數量作為基準值，避免誤把頁面
    // 上既有、與本次操作無關的元素（例如其他 toast 殘留）誤判為本次的回饋
    const feedbackSelector = '[data-testid=toast-message], [role="alert"], .st-toast, .auth-msg-error, [class*="field-error"]'
    const beforeCount = await page.locator(feedbackSelector).count()

    const updateBtn = page.getByRole('button', { name: '更新密碼' })
    await expect(updateBtn).toBeVisible({ timeout: 5000 })
    await updateBtn.click()
    await page.waitForTimeout(500)

    // 實測：useSettings.ts 的 saveAccount() 對空欄位是 `if (!pwCurrent.value || !pwNew.value) return`
    // 直接靜默 return，不呼叫 showToast、accountStatus 也維持 'idle'（SettingSaveToast
    // 只在 status !== 'idle' 時渲染），因此畫面上完全沒有任何提示元素出現。
    const afterCount = await page.locator(feedbackSelector).count()
    expect(
      afterCount,
      `空白表單送出後，畫面上應至少新增 1 個可見的錯誤/提示元素（beforeCount=${beforeCount}，` +
      `afterCount=${afterCount}），但目前完全沒有任何回饋（saveAccount 空欄位靜默 return）`,
    ).toBeGreaterThan(beforeCount)

    // 正確行為的防呆：確認真的沒有送出密碼更新請求（這條預期本來就會通過，
    // 用來鎖住「至少不能更糟」——未來修復 UI 提示時不能順便誤發請求）
    expect(passwordRequestCount, '空白表單不應該對密碼更新端點發出 PUT/POST 請求').toBe(0)
  })

  // ── T9: 登入後導覽列直接可見互動元素數量應有上限（密度預算） ─────────────────
  test('T9: 登入後導覽列（.nav-inner）直接可見互動元素數量應有上限', async ({ page }) => {
    await loginUI(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await spaNavigate(page, '/')
    await page.waitForSelector('[data-testid=navbar-user-menu]', { timeout: 5000 })

    // 密度預算測試：刻意的「不得超過上限」測試，用來防止日後又把功能一個個塞回
    // 導覽列。實測現況：.nav-inner 平鋪 logo + 4 個導覽連結 + 主題切換鈕，
    // 加上巢狀在 navbar-user-menu 內的收藏/寫文章/設定/登出，共 10 個可見互動元素
    // （logo, Writing, Articles, Search, About, 主題切換, 收藏, 寫文章, 設定, 登出）。
    // 「你好, Yuan!」問候語是純文字 <span>，非互動元素，不計入。
    const interactiveCount = await page.locator('.nav-inner a, .nav-inner button').evaluateAll(
      (els) => els.filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      }).length,
    )
    expect(
      interactiveCount,
      `導覽列（.nav-inner）直接可見互動元素數量應 <= 8（密度預算），實際為 ${interactiveCount}` +
      `（現況已知為 10：logo/Writing/Articles/Search/About/主題切換/收藏/寫文章/設定/登出）`,
    ).toBeLessThanOrEqual(8)
  })
})
