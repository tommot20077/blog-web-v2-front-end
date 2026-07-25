// 小型可測試工具：包裝 Clipboard API，統一處理「不支援」與「寫入失敗」，
// 呼叫端（shareArticle / MarkdownViewModal）不需各自處理例外。
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
