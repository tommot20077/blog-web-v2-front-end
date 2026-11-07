import { describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readNginxCsp } from './nginxCsp'

function confWith(body: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'nginx-csp-'))
  const file = join(dir, 'nginx.conf')
  writeFileSync(file, body)
  return file
}

describe('readNginxCsp', () => {
  it('解析 header 名稱與政策字串', () => {
    const file = confWith(`
      set $csp "default-src 'self'; img-src 'self' blob:";
      add_header Content-Security-Policy $csp always;
    `)
    expect(readNginxCsp(file)).toEqual({
      headerName: 'Content-Security-Policy',
      policy: "default-src 'self'; img-src 'self' blob:",
    })
  })

  it('支援 Report-Only', () => {
    const file = confWith(`
      set $csp_report_only "default-src 'self'";
      add_header Content-Security-Policy-Report-Only $csp_report_only always;
    `)
    expect(readNginxCsp(file).headerName).toBe('Content-Security-Policy-Report-Only')
  })

  it('忽略被註解掉的設定', () => {
    const file = confWith(`
      # set $old "default-src *";
      # add_header Content-Security-Policy $old always;
      set $csp "default-src 'self'";
      add_header Content-Security-Policy-Report-Only $csp always;
    `)
    expect(readNginxCsp(file)).toEqual({
      headerName: 'Content-Security-Policy-Report-Only',
      policy: "default-src 'self'",
    })
  })

  it('找不到 header 時明確報錯', () => {
    expect(() => readNginxCsp(confWith('server {}'))).toThrow(/找不到 add_header/)
  })

  it('找不到變數定義時明確報錯', () => {
    expect(() => readNginxCsp(confWith('add_header Content-Security-Policy $csp always;'))).toThrow(/找不到 set \$csp/)
  })

  it('能解析專案真正的 nginx.conf', () => {
    const { policy } = readNginxCsp()
    expect(policy).toContain("default-src 'self'")
  })
})
