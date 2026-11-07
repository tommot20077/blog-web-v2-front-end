import type { FileUsageType } from '../types/editor'
import { MAX_ARTICLE_IMAGE_BYTES, MAX_AVATAR_BYTES, formatLimitMb, getMaxUploadBytes } from './uploadLimits'

/**
 * 後端業務錯誤碼判斷工具。
 *
 * 錯誤碼來源：後端 blog-common 的 *ErrorCode。apiClient 會把業務碼附在 Error.code；
 * mock 模式的失敗物件（mockApiFailureState）則是 axios 風格的 response.data.code，兩種都要認得。
 */

/** A0208 ARTICLE_CONCURRENT_UPDATE：存檔時帶的 version 與目前不一致（HTTP 409，B2 樂觀鎖） */
export const ARTICLE_CONCURRENT_UPDATE_CODE = 'A0208'

/** A0402 FILE_TOO_LARGE：單檔超過上限（文章圖片 20MB、頭像 5MB） */
export const FILE_TOO_LARGE_CODE = 'A0402'

const FRIENDLY_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  [FILE_TOO_LARGE_CODE]:
    `檔案太大（文章圖片上限 ${formatLimitMb(MAX_ARTICLE_IMAGE_BYTES)}，頭像上限 ${formatLimitMb(MAX_AVATAR_BYTES)}）`,
  // A0406 INVALID_IMAGE_DIMENSIONS：總像素超過 100MP（不限單邊）
  A0406: '圖片尺寸過大（總像素需小於 1 億）',
  // A0407 INVALID_AVATAR_FILE：設定頭像時，指定的站內檔案不是本人上傳的頭像
  A0407: '頭像檔案無效，請重新上傳',
}

/**
 * 前端預檢用：呼叫端知道上傳情境，所以只顯示對應的上限（文章圖片／封面 20MB、頭像 5MB）。
 * 後端回來的 A0402 在 apiClient 統一轉換時拿不到情境，保留上面的通用文案（兩種上限都列）。
 */
export function getFileTooLargeMessage(usageType: FileUsageType): string {
  const label = usageType === 'AVATAR' ? '頭像' : '文章圖片'
  return `檔案太大（${label}上限 ${formatLimitMb(getMaxUploadBytes(usageType))}）`
}

/** 通用限流（後端 CommonErrorCode.TOO_MANY_REQUESTS）的 HTTP 狀態；超限時帶 Retry-After（秒） */
export const TOO_MANY_REQUESTS_STATUS = 429

/**
 * 讀取 Retry-After（秒）。只認正整數秒；缺少、空字串、0、負數、小數或 HTTP-date 一律視為沒有。
 * 同時支援 AxiosHeaders（get）與 plain object（key 大小寫皆可）。
 */
export function parseRetryAfterSeconds(headers: unknown): number | undefined {
  if (typeof headers !== 'object' || headers === null) return undefined
  const source = headers as { get?: (name: string) => unknown } & Record<string, unknown>
  const raw = typeof source.get === 'function'
    ? source.get('retry-after')
    : (source['retry-after'] ?? source['Retry-After'])
  const text = typeof raw === 'number' ? String(raw) : raw
  if (typeof text !== 'string' || !/^\d+$/.test(text.trim())) return undefined
  const seconds = Number(text.trim())
  return seconds > 0 ? seconds : undefined
}

/** 429 的使用者訊息：有秒數時告知等待時間，否則通用提示 */
export function getRateLimitMessage(retryAfterSeconds: number | undefined): string {
  return retryAfterSeconds === undefined
    ? '操作太頻繁，請稍後再試'
    : `操作太頻繁，請 ${retryAfterSeconds} 秒後再試`
}

/** 錯誤碼對應的使用者友善訊息；沒有對應時回傳 undefined，呼叫端沿用後端 message */
export function getFriendlyErrorMessage(code: string | undefined): string | undefined {
  return code === undefined ? undefined : FRIENDLY_ERROR_MESSAGES[code]
}

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
