import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  contrastRatio,
  contrastRatioRgb,
  compositeOver,
  hexToRgb,
  WCAG_AA_NORMAL_TEXT,
  type RgbColor,
} from './utils/contrastRatio'

/**
 * 驗證暗色模式下「錯誤/危險」訊息的對比度是否達 WCAG AA（4.5:1）。
 *
 * 不做字串比對「有沒有出現 --danger」——直接解析實際 CSS 原始碼、
 * 解析出真正渲染的色碼，再用 contrastRatio() 真的算對比度。這樣一來，
 * 若日後有人把 --danger 或背景 token 改壞，測試會算出真實對比度不足並失敗，
 * 而不是只檢查 token 名稱是否存在。
 *
 * 背景：全站錯誤訊息曾用硬編碼 #b91c1c / #ef4444，暗色模式對暗色背景
 * （--bg #1d1d1f、--bg-sub #242426）僅 ≈2.2~2.6:1，遠低於 4.5:1；
 * 亮色模式對 --bg #f4f4f4 已 ≈5.9:1，合格（純暗色模式的 bug）。
 */

function readFile(path: string): string {
  return readFileSync(path, 'utf8')
}

/** 找出 css 文字中所有符合 selector 的區塊內容（不處理巢狀大括號，本專案 token 區塊皆為單層）。 */
function findBlocks(css: string, selector: string): string[] {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')
  return [...css.matchAll(pattern)].map((m) => m[1])
}

/**
 * 在指定 selector 的區塊中找出某個 CSS 屬性的值。
 * 若同一 selector 有多個區塊都定義該屬性，取最後一個（模擬 CSS 「後載入者勝」）。
 */
function findDeclaration(css: string, selector: string, property: string): string | undefined {
  const escapedProp = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // 用 lookbehind 確保不是「identifier 中段」被誤命中（例如找 --bg 誤中 --bg-sub 的一部分），
  // 不再依賴「前面必須緊接 ; 或字串開頭」——區塊第一個宣告前常有註解，不會緊接 ; 。
  const propPattern = new RegExp(`(?<![\\w-])${escapedProp}\\s*:\\s*([^;]+?)\\s*(?:;|$)`)

  let found: string | undefined
  for (const block of findBlocks(css, selector)) {
    const match = block.match(propPattern)
    if (match) found = match[1].trim()
  }
  return found
}

/**
 * 解析某 selector 的某屬性最終渲染出的色碼：
 * - 若宣告值是字面量色碼（如 `#b91c1c`）→ 直接回傳（對應修正前的現況）
 * - 若宣告值是 `var(--x)` → 到 varScope 區塊解析 `--x` 的值（對應修正後的 token 化寫法）
 */
function resolveRenderedColor(css: string, selector: string, property: string, varScope: string): string {
  const raw = findDeclaration(css, selector, property)
  if (raw === undefined) {
    throw new Error(`找不到宣告：${selector} { ${property}: ... }`)
  }

  const varMatch = raw.match(/^var\((--[\w-]+)\)$/)
  if (!varMatch) return raw

  const varName = varMatch[1]
  const resolved = findDeclaration(css, varScope, varName)
  if (resolved === undefined) {
    throw new Error(`找不到 token 定義：${varScope} { ${varName}: ... }`)
  }
  return resolved
}

const indexCss = readFile('src/index.css')
const designStylesCss = readFile('src/assets/design/styles.css')
const adminCategoriesVue = readFile('src/views/AdminCategoriesView.vue')
const adminTagsVue = readFile('src/views/AdminTagsView.vue')
const myArticlesVue = readFile('src/views/MyArticlesView.vue')

describe('.auth-msg-error 的對比度（代表全站共用 --danger token 的錯誤訊息）', () => {
  it('亮色模式：文字對 --bg(#f4f4f4) 需達 WCAG AA 4.5:1（現況已合格，不應回歸）', () => {
    const fg = resolveRenderedColor(indexCss, '.auth-msg-error', 'color', ':root')
    const bg = findDeclaration(designStylesCss, ':root', '--bg')
    expect(bg).toBeDefined()

    const ratio = contrastRatio(fg, bg!)
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })

  it('暗色模式：文字對實際暗色背景 --bg-sub(#242426) 需達 WCAG AA 4.5:1', () => {
    const fg = resolveRenderedColor(indexCss, '.auth-msg-error', 'color', '[data-theme="dark"]')
    // index.css 內的 [data-theme="dark"] 覆寫（Apple 色調）晚於 styles.css 的 @import 載入，
    // 同特異性下後載入者勝，故直接以 index.css 解析出的值為準（真正渲染出的背景）。
    const bg = findDeclaration(indexCss, '[data-theme="dark"]', '--bg-sub')
    expect(bg).toBeDefined()

    const ratio = contrastRatio(fg, bg!)
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })

  it('暗色模式：文字對 --bg(#1d1d1f) 也需達 WCAG AA 4.5:1', () => {
    const fg = resolveRenderedColor(indexCss, '.auth-msg-error', 'color', '[data-theme="dark"]')
    const bg = findDeclaration(indexCss, '[data-theme="dark"]', '--bg')
    expect(bg).toBeDefined()

    const ratio = contrastRatio(fg, bg!)
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })
})

describe('全站不再殘留硬編碼的 danger 色（rg -n "239,\\s*68,\\s*68|#b91c1c|#ef4444" 應為 0 命中）', () => {
  const targetFiles = [
    'src/index.css',
    'src/components/ui/FormField.vue',
    'src/views/AdminCategoriesView.vue',
    'src/views/AdminTagsView.vue',
    'src/views/AdminDashboardView.vue',
    'src/views/AdminSearchView.vue',
    'src/views/MyArticlesView.vue',
  ]

  // --danger / --danger-strong 的 token 定義本身合法持有字面量色碼，註解裡
  // 說明色值選擇過程也合法提到這些色碼——排除註解與 token 定義行後，才檢查
  // 「使用端」（實際 CSS 屬性值）是否還殘留硬編碼。
  function stripCommentsAndTokenDefinitions(css: string): string {
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
    return withoutComments
      .split('\n')
      .filter((line) => !/--danger(-strong)?\s*:/.test(line))
      .join('\n')
  }

  const hardcodedDangerPattern = /239,\s*68,\s*68|#b91c1c|#ef4444/i

  it.each(targetFiles)('%s 的 danger 色使用端已改為 token，不含硬編碼色碼', (file) => {
    const content = readFile(file)
    const contentToCheck = file === 'src/index.css' ? stripCommentsAndTokenDefinitions(content) : content

    expect(contentToCheck).not.toMatch(hardcodedDangerPattern)
  })
})

/**
 * ── 半透明 color-mix 疊色的「合成背景」對比度 ──────────────────────
 *
 * 上面 `.auth-msg-error` 的三個對比度斷言只驗證「--danger 文字 vs 純色
 * --bg/--bg-sub token」，但全站 15 個 danger token 替換點裡，多數實際渲染
 * 並非文字疊在純色背景上，而是疊在 `color-mix(in srgb, var(--danger-strong)
 * X%, transparent)` 半透明紅底之上，而那個紅底本身又疊在頁面背景（或先疊
 * 在 --glass 面板上、面板再疊在頁面背景上）——真實合成後的背景色與純
 * --bg/--bg-sub 不同，對比度也不同，且沒有任何既有測試驗證過這個合成值。
 *
 * 這裡對每個實際疊色情境做標準 alpha over 合成（compositeOver()，
 * out = alpha*src + (1-alpha)*dst），算出「真正會被畫出來的背景色」，
 * 再用該色與文字色算真實對比度。情境與各自的 backdrop 皆從實際 CSS/模板
 * 逐一 grep 推導（見各情境下方註解的檔案:行號），不是憑印象假設。
 *
 * 範圍：只涵蓋「color: var(--danger) 文字疊在 color-mix 紅底上」的情境
 * （8 條 CSS 宣告、10 種實際渲染 context，因為 .cat-btn-danger／
 * .tag-btn-danger 各自出現在「表格列」與「刪除確認對話框」兩種不同背景的
 * context 下）。刻意不含 `.admin-btn-confirm-reject`（90% 紅底配白字）與
 * `.ma-btn--danger`（實色紅底配白字）——這兩處白字對紅底的對比度本身是
 * 改版前就存在、已在報告 concerns 揭露的殘留問題（約 3.4~4.4:1，未達
 * 4.5:1），brief 明確不改色值，此處若新增「必須 ≥4.5:1」的斷言會與已知
 * 現況矛盾，等於要求偽造一條會恆假或需被跳過的測試，因此不將它們納入
 * 本組情境（該殘留問題已在 review 報告與本輪 concerns 中另行揭露）。
 */
describe('半透明 color-mix 疊色的合成背景對比度（真實渲染，非純色 token 對 token）', () => {
  type Theme = 'light' | 'dark'

  /** 解析 `color-mix(in srgb, var(--x) N%, transparent)` 的疊色百分比（回傳 0~1 的 alpha）。 */
  function parseColorMixAlpha(raw: string): number {
    const m = raw.match(/^color-mix\(in srgb,\s*var\(--[\w-]+\)\s+([\d.]+)%,\s*transparent\)$/)
    if (!m) throw new Error(`無法解析 color-mix 疊色百分比：${raw}`)
    return Number(m[1]) / 100
  }

  /** 解析 `rgba(r, g, b, a)` 字串為 RgbColor + alpha（--glass 皆以此格式定義）。 */
  function parseRgba(raw: string): { rgb: RgbColor; alpha: number } {
    const m = raw.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/)
    if (!m) throw new Error(`無法解析 rgba 色碼：${raw}`)
    return {
      rgb: { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) },
      alpha: m[4] !== undefined ? Number(m[4]) : 1,
    }
  }

  /**
   * 解析某 token 在指定主題下「實際渲染出的值」（依同特異性、後載入者勝的
   * 順序：index.css 的覆寫優先於 designer source 的 styles.css）。
   * light 模式的 --danger / --danger-strong 定義在 index.css 的 :root
   * （這兩個是本次新增、不可寫進 designer source 的語意 token）。
   */
  function resolveThemeToken(varName: string, theme: Theme): string {
    const scope = theme === 'dark' ? '[data-theme="dark"]' : ':root'
    const resolved = findDeclaration(indexCss, scope, varName) ?? findDeclaration(designStylesCss, scope, varName)
    if (resolved === undefined) {
      throw new Error(`找不到 ${theme} 主題下的 token 定義：${scope} { ${varName}: ... }`)
    }
    return resolved
  }

  // --danger-strong 刻意不分暗色版（見 src/index.css:37-39 註解：白字/紅字疊色
  // 用色要維持原本不隨主題變化的觀感），故兩個主題共用同一個值，只需解析一次。
  const dangerStrongHex = findDeclaration(indexCss, ':root', '--danger-strong')
  if (dangerStrongHex === undefined) throw new Error('找不到 --danger-strong 定義')
  const dangerStrongRgb = hexToRgb(dangerStrongHex)

  interface OverlayScenario {
    /** 情境描述，含「背景百分比疊在哪個 backdrop 上」的判斷依據與來源檔案:行號。 */
    label: string
    /** 含 `background: color-mix(...)` 與 `color: var(--danger)` 宣告的 CSS 原始碼。 */
    css: string
    selector: string
    /** 最底層的頁面背景 token（--bg 或 --bg-sub），依實際渲染出的 context 決定。 */
    baseBackdropVar: '--bg' | '--bg-sub'
    /** 是否在 baseBackdrop 與 color-mix 紅底之間還疊了一層 --glass 面板。 */
    glassOverlay: boolean
  }

  const scenarios: OverlayScenario[] = [
    {
      label:
        '.auth-msg-error：疊在 .auth-form-col { background: var(--bg) }（AuthFormLayout.vue:121），' +
        '無額外面板',
      css: indexCss,
      selector: '.auth-msg-error',
      baseBackdropVar: '--bg',
      glassOverlay: false,
    },
    {
      label:
        '.admin-btn-reject：疊在 .admin-card { background: var(--glass) }（index.css:152），' +
        '面板本身疊在 body { background: var(--bg) }（styles.css:64）上，兩層合成',
      css: indexCss,
      selector: '.admin-btn-reject',
      baseBackdropVar: '--bg',
      glassOverlay: true,
    },
    {
      label:
        '.cat-btn-danger／表格列情境：「刪除」觸發鈕直接位於 .admin-wrap 內（AdminCategoriesView.vue:253），' +
        '無額外背景，backdrop 即 body { --bg }',
      css: adminCategoriesVue,
      selector: '.cat-btn-danger',
      baseBackdropVar: '--bg',
      glassOverlay: false,
    },
    {
      label:
        '.cat-btn-danger／刪除確認對話框情境：「確認刪除」鈕位於 .cat-confirm-box ' +
        '{ background: var(--bg-sub) }（AdminCategoriesView.vue:349-353）內',
      css: adminCategoriesVue,
      selector: '.cat-btn-danger',
      baseBackdropVar: '--bg-sub',
      glassOverlay: false,
    },
    {
      label:
        '.cat-load-error：直接位於 .admin-wrap 內（AdminCategoriesView.vue:204），無額外背景',
      css: adminCategoriesVue,
      selector: '.cat-load-error',
      baseBackdropVar: '--bg',
      glassOverlay: false,
    },
    {
      label:
        '.tag-btn-danger／表格列情境：「刪除」觸發鈕直接位於 .admin-wrap 內（AdminTagsView.vue:237）',
      css: adminTagsVue,
      selector: '.tag-btn-danger',
      baseBackdropVar: '--bg',
      glassOverlay: false,
    },
    {
      label:
        '.tag-btn-danger／刪除確認對話框情境：「確認刪除」鈕位於 .tag-confirm-box ' +
        '{ background: var(--bg-sub) }（AdminTagsView.vue:335-339）內',
      css: adminTagsVue,
      selector: '.tag-btn-danger',
      baseBackdropVar: '--bg-sub',
      glassOverlay: false,
    },
    {
      label: '.tag-load-error：直接位於 .admin-wrap 內（AdminTagsView.vue:184），無額外背景',
      css: adminTagsVue,
      selector: '.tag-load-error',
      baseBackdropVar: '--bg',
      glassOverlay: false,
    },
    {
      label:
        '.ma-status.REJECTED：位於 .ma-table 內（MyArticlesView.vue:170），表格無額外背景，' +
        'backdrop 即 body { --bg }',
      css: myArticlesVue,
      selector: '.ma-status.REJECTED',
      baseBackdropVar: '--bg',
      glassOverlay: false,
    },
    {
      label: '.ma-reject-reason：同一張 .ma-table 內（MyArticlesView.vue:211），無額外背景',
      css: myArticlesVue,
      selector: '.ma-reject-reason',
      baseBackdropVar: '--bg',
      glassOverlay: false,
    },
  ]

  const themes: Theme[] = ['light', 'dark']

  const cases = scenarios.flatMap((scenario) => themes.map((theme) => ({ scenario, theme })))

  it.each(cases)('$scenario.label（$theme 模式）', ({ scenario, theme }) => {
    // 1. 解析「文字色」：宣告值必為 var(--danger)，依主題解析出實際 hex。
    const colorDecl = findDeclaration(scenario.css, scenario.selector, 'color')
    expect(colorDecl).toBe('var(--danger)')
    const dangerHex = resolveThemeToken('--danger', theme)
    const textRgb = hexToRgb(dangerHex)

    // 2. 由下到上組出真實 backdrop：先解析最底層頁面背景 token。
    let backdrop = hexToRgb(resolveThemeToken(scenario.baseBackdropVar, theme))

    // 3. 若這個情境還有一層 --glass 面板疊在頁面背景之上，先合成這一層。
    if (scenario.glassOverlay) {
      const glassRaw = resolveThemeToken('--glass', theme)
      const glass = parseRgba(glassRaw)
      backdrop = compositeOver(glass.rgb, glass.alpha, backdrop)
    }

    // 4. 解析這個情境實際的 color-mix 疊色百分比，合成最上層的半透明紅底。
    const bgDecl = findDeclaration(scenario.css, scenario.selector, 'background')
    if (bgDecl === undefined) throw new Error(`找不到 ${scenario.selector} 的 background 宣告`)
    const alpha = parseColorMixAlpha(bgDecl)
    backdrop = compositeOver(dangerStrongRgb, alpha, backdrop)

    // 5. 用「真正會被畫出來的合成背景」算對比度，而不是任何 flat token。
    const ratio = contrastRatioRgb(textRgb, backdrop)
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })
})
