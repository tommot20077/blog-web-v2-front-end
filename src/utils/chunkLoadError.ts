/**
 * 辨識「動態載入 chunk 失敗」：部署新版後，舊分頁引用的舊 hash 檔案已不存在。
 * 各瀏覽器訊息不同：
 * - Chrome／Edge：Failed to fetch dynamically imported module
 * - Safari：Importing a module script failed
 * - Firefox：error loading dynamically imported module
 */
const CHUNK_LOAD_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
]

export function isChunkLoadError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const message = (error as { message?: unknown }).message
  return typeof message === 'string' && CHUNK_LOAD_PATTERNS.some((p) => p.test(message))
}
