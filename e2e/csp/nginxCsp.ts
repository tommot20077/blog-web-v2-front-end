import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 從 nginx.conf 解析正式環境實際送出的 CSP（A2 / XSS-03）。
 *
 * CSP 的單一來源是 nginx.conf；E2E 的預覽伺服器（vite.csp.config.ts）與守衛測試都從這裡取，
 * 不複製第二份字串，政策一改，E2E 立即以新政策驗證。
 */
export type NginxCsp = {
  /** Content-Security-Policy 或 Content-Security-Policy-Report-Only */
  headerName: 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only'
  policy: string
}

// vite / playwright / vitest 都從專案根目錄執行
const DEFAULT_NGINX_CONF = resolve(process.cwd(), 'nginx.conf')

export function readNginxCsp(confPath: string = DEFAULT_NGINX_CONF): NginxCsp {
  const active = readFileSync(confPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')

  const header = active.match(
    /add_header\s+(Content-Security-Policy(?:-Report-Only)?)\s+\$(\w+)\s+always\s*;/,
  )
  if (!header) throw new Error(`${confPath} 找不到 add_header Content-Security-Policy[-Report-Only] $var always;`)

  const [, headerName, variable] = header
  const policy = active.match(new RegExp(`set\\s+\\$${variable}\\s+"([^"]+)"\\s*;`))
  if (!policy) throw new Error(`${confPath} 找不到 set $${variable} "..."; 的政策字串`)

  return { headerName: headerName as NginxCsp['headerName'], policy: policy[1] }
}
