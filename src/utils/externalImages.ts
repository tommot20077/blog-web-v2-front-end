/**
 * 偵測 markdown 內文中的「外部圖片」。
 *
 * 正式環境 CSP 的 img-src 只放行 'self' blob:（見 nginx.conf；外部圖片刻意不放行，Yuan 2026-11-07 決定），
 * 外部圖片在讀者端會無聲破圖，所以編輯器要先警告作者改用上傳插圖。
 *
 * 外部 = http(s):// 或 protocol-relative（//host）且不屬於指定 origin。
 * 相對路徑（含 /api/v1/files/{id}/content）、blob:、data: 都不算外部。
 */

const FENCED_CODE = /^ {0,3}(```|~~~)[^\n]*\n[\s\S]*?(?:^ {0,3}\1[ \t]*$|(?![\s\S]))/gm
const INLINE_CODE = /`+[^`\n]*`+/g
const MD_INLINE_IMAGE = /!\[[^\]]*\]\(\s*(?:<([^>\n]*)>|([^\s)]+))/g
const MD_REF_IMAGE = /!\[[^\]]*\]\[([^\]]*)\]/g
const MD_REF_DEFINITION = /^ {0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm
const HTML_IMG = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi

function isExternal(url: string, origin?: string): boolean {
  const trimmed = url.trim()
  if (!/^(?:https?:)?\/\//i.test(trimmed)) return false
  if (origin) {
    const normalized = origin.replace(/\/+$/, '').toLowerCase()
    const lower = trimmed.toLowerCase()
    if (lower === normalized || lower.startsWith(normalized + '/')) return false
  }
  return true
}

export function findExternalImages(markdown: string, origin?: string): string[] {
  if (!markdown) return []
  const text = markdown.replace(FENCED_CODE, '').replace(INLINE_CODE, '')

  const found: Array<{ index: number; url: string }> = []

  for (const m of text.matchAll(MD_INLINE_IMAGE)) {
    found.push({ index: m.index, url: m[1] ?? m[2] })
  }
  for (const m of text.matchAll(HTML_IMG)) {
    found.push({ index: m.index, url: m[1] ?? m[2] ?? m[3] })
  }

  const definitions = new Map<string, string>()
  for (const m of text.matchAll(MD_REF_DEFINITION)) {
    definitions.set(m[1].toLowerCase(), m[2])
  }
  for (const m of text.matchAll(MD_REF_IMAGE)) {
    const label = (m[1] || '').toLowerCase()
    const url = definitions.get(label)
    if (url) found.push({ index: m.index, url })
  }

  return found
    .sort((a, b) => a.index - b.index)
    .map((f) => f.url.trim())
    .filter((url) => isExternal(url, origin))
}
