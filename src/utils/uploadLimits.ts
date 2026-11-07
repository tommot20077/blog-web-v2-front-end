import type { FileUsageType } from '../types/editor'

/**
 * 單檔上傳大小上限（A6b）。對齊後端 FileProperties：文章圖片 20MB、頭像 5MB。
 * 上限只定義在這裡；上傳前檢查與友善錯誤訊息都由此衍生。
 */
const MB = 1024 * 1024

export const MAX_ARTICLE_IMAGE_BYTES = 20 * MB
export const MAX_AVATAR_BYTES = 5 * MB

/** 依用途取單檔上限：內文圖與封面共用文章圖片上限 */
export function getMaxUploadBytes(usageType: FileUsageType): number {
  return usageType === 'AVATAR' ? MAX_AVATAR_BYTES : MAX_ARTICLE_IMAGE_BYTES
}

/** 是否超過上限；剛好等於上限可以送出（與後端「大於才拒絕」一致） */
export function exceedsUploadLimit(file: File, usageType: FileUsageType): boolean {
  return file.size > getMaxUploadBytes(usageType)
}

/** 供訊息文案使用：2097152 → "20MB" */
export function formatLimitMb(bytes: number): string {
  return `${bytes / MB}MB`
}
