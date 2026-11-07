/**
 * 後端業務錯誤碼判斷工具。
 *
 * 錯誤碼來源：後端 blog-common 的 *ErrorCode。apiClient 會把業務碼附在 Error.code；
 * mock 模式的失敗物件（mockApiFailureState）則是 axios 風格的 response.data.code，兩種都要認得。
 */

/** A0208 ARTICLE_CONCURRENT_UPDATE：存檔時帶的 version 與目前不一致（HTTP 409，B2 樂觀鎖） */
export const ARTICLE_CONCURRENT_UPDATE_CODE = 'A0208'

/** 取出錯誤上的後端業務碼；沒有時回傳 undefined */
export function getApiErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const { code, response } = error as { code?: unknown; response?: { data?: { code?: unknown } } }
  if (typeof code === 'string') return code
  const nested = response?.data?.code
  return typeof nested === 'string' ? nested : undefined
}

/** 是否為「文章已被其他人修改」（A0208）；全域樂觀鎖衝突（A0008）是另一回事，不算 */
export function isConcurrentUpdateError(error: unknown): boolean {
  return getApiErrorCode(error) === ARTICLE_CONCURRENT_UPDATE_CODE
}
