import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * nginx.conf 的 CSP 守衛（後端 findings XSS-03；決策 A2：用 Playwright E2E 收集違規、零違規後改為強制 Content-Security-Policy）。
 * 政策本身的正確性由 e2e/csp/csp-violations.spec.ts 以同一份 nginx.conf 的 CSP 實際驗證；這裡鎖住 header 形態與關鍵屬性。
 * 這是純設定變更，沒有可單元執行的程式碼，故以讀檔斷言鎖住政策的關鍵屬性；
 * 實際的語法與 header 輸出另以 `nginx -t` 與 curl 驗證（見 PR 說明）。
 */
const conf = readFileSync('nginx.conf', 'utf8')

/** 去掉整行註解後的有效設定。 */
const activeConf = conf
  .split('\n')
  .filter((line) => !line.trim().startsWith('#'))
  .join('\n')

/** 取出 `set $csp "...";` 的政策字串。 */
function readPolicy(): string {
  const match = activeConf.match(/set\s+\$csp\s+"([^"]+)"\s*;/)
  expect(match, 'nginx.conf 應以 set $csp "..." 定義政策').not.toBeNull()
  return match![1]
}

/** 取出某個 location 區塊內文（以大括號配對）。 */
function readBlock(header: RegExp): string {
  const start = activeConf.search(header)
  expect(start, `找不到區塊 ${header}`).toBeGreaterThanOrEqual(0)
  const open = activeConf.indexOf('{', start)
  let depth = 0
  for (let i = open; i < activeConf.length; i++) {
    if (activeConf[i] === '{') depth++
    if (activeConf[i] === '}' && --depth === 0) return activeConf.slice(open + 1, i)
  }
  throw new Error('區塊未閉合')
}

const directive = (policy: string, name: string) =>
  policy.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name} `) || part === name)

describe('nginx.conf CSP（強制）', () => {
  it('送出強制的 Content-Security-Policy header', () => {
    expect(activeConf).toMatch(/add_header\s+Content-Security-Policy\s+\$csp\s+always\s*;/)
  })

  it('不再送 Report-Only 版本（零違規後已改為強制；不建收報端點）', () => {
    expect(activeConf).not.toMatch(/Content-Security-Policy-Report-Only/)
    expect(activeConf).not.toMatch(/report-uri|report-to/)
  })

  it('index.html 的 location 也要帶 CSP header（nginx 的 add_header 在子層宣告時不繼承上層）', () => {
    const indexBlock = readBlock(/location\s*=\s*\/index\.html\s*\{/)
    expect(indexBlock).toMatch(/add_header\s+Content-Security-Policy\s+\$csp\s+always\s*;/)
  })

  it('政策從嚴開始：default-src self、禁 object、鎖 base-uri / form-action / frame-ancestors', () => {
    const policy = readPolicy()
    expect(directive(policy, 'default-src')).toBe("default-src 'self'")
    expect(directive(policy, 'object-src')).toBe("object-src 'none'")
    expect(directive(policy, 'base-uri')).toBe("base-uri 'self'")
    expect(directive(policy, 'form-action')).toBe("form-action 'self'")
    expect(directive(policy, 'frame-ancestors')).toBe("frame-ancestors 'self'")
  })

  it('已移除 iframe 嵌入，frame-src 為 none', () => {
    expect(directive(readPolicy(), 'frame-src')).toBe("frame-src 'none'")
  })

  it("script-src 不允許 'unsafe-inline' 與 'unsafe-eval'", () => {
    const scriptSrc = directive(readPolicy(), 'script-src')
    expect(scriptSrc).toBe("script-src 'self'")
    expect(readPolicy()).not.toContain("'unsafe-eval'")
  })

  it("'unsafe-inline' 只開在 style-src-elem / style-src-attr（CodeMirror 與 Shiki/Vue 的 inline style）", () => {
    const withUnsafeInline = readPolicy()
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.includes("'unsafe-inline'"))
      .map((part) => part.split(' ')[0])
    expect(withUnsafeInline.sort()).toEqual(['style-src-attr', 'style-src-elem'])
  })

  it('Google Fonts：樣式表與字型檔來源有放行', () => {
    const policy = readPolicy()
    expect(directive(policy, 'style-src-elem')).toContain('https://fonts.googleapis.com')
    expect(directive(policy, 'font-src')).toContain('https://fonts.gstatic.com')
  })

  it('每個放行的外部來源，nginx.conf 註解都寫了理由', () => {
    const origins = new Set(readPolicy().match(/https:\/\/[a-z0-9.-]+/gi) ?? [])
    expect(origins.size).toBeGreaterThan(0)
    const commentLines = conf.split('\n').filter((line) => line.trim().startsWith('#'))
    for (const origin of origins) {
      expect(
        commentLines.some((line) => line.includes(origin)),
        `${origin} 缺少註解說明放行理由`,
      ).toBe(true)
    }
  })

  it('既有安全標頭仍在（X-Content-Type-Options / X-Frame-Options / Referrer-Policy）', () => {
    expect(activeConf).toMatch(/add_header\s+X-Content-Type-Options\s+"nosniff"\s+always/)
    expect(activeConf).toMatch(/add_header\s+X-Frame-Options\s+"SAMEORIGIN"\s+always/)
    expect(activeConf).toMatch(/add_header\s+Referrer-Policy\s+"strict-origin-when-cross-origin"\s+always/)
  })
})
