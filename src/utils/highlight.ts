import DOMPurify from 'dompurify'

/**
 * 在純文字中高亮搜尋關鍵字，安全地注入 mark 標籤。
 * 先將輸入剝除所有 HTML 取得純文字，再以 mark 包裹匹配字串。
 */
export function highlight(text: string, q: string): string {
  // 剝除所有 HTML，只保留純文字
  const plainText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })

  if (!q.trim()) return escapeHtml(plainText)

  const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matchRegex = new RegExp(`(${escaped})`, 'gi')
  const testRegex = new RegExp(`^(?:${escaped})$`, 'i')

  // 將純文字分割並跳脫，只有 mark 標籤由程式碼注入
  return plainText
    .split(matchRegex)
    .map((part) => (testRegex.test(part) ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join('')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
