import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { contrastRatio, WCAG_AA_NORMAL_TEXT } from './utils/contrastRatio'

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
