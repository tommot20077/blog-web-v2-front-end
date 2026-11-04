/**
 * 公開作者頁的社群連結／網站工具。
 *
 * socialLinks 是「帳號名稱（handle）」不是網址（Yuan 2026-11-01 決定）：
 * 前端只用固定前綴 + encodeURIComponent(handle) 組網址，不接受任何使用者提供的網址。
 */

/** 已知平台與固定網址前綴；未知 key 不產生連結 */
export const SOCIAL_PLATFORMS = {
  github: 'https://github.com/',
  twitter: 'https://x.com/',
  linkedin: 'https://www.linkedin.com/in/',
} as const

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS

/** 對應後端 SafeSocialLinksValidator.MAX_VALUE_LENGTH */
export const MAX_HANDLE_LENGTH = 100

/** 控制字元、空白（含 Unicode 空白）、FORMAT 字元；對應後端 containsInvisibleOrControl */
const INVISIBLE_OR_CONTROL = /[\p{Cc}\p{Cf}\p{Zs}\p{Zl}\p{Zp}\s]/u
/** 對應後端 FORBIDDEN_VALUE_CHARS：/ : \ < > " */
const FORBIDDEN_CHARS = /[/:\\<>"]/

/**
 * 與後端 `SafeSocialLinksValidator.isSafeHandle` 同一份規則。
 * 空字串＝未填，視為合格。
 */
export function isSafeHandle(handle: string): boolean {
  if (handle === '') return true
  if (handle.length > MAX_HANDLE_LENGTH || INVISIBLE_OR_CONTROL.test(handle)) return false
  // 原字串與 NFKC 正規化後都要檢查，擋全形「：／」
  if (FORBIDDEN_CHARS.test(handle) || FORBIDDEN_CHARS.test(handle.normalize('NFKC'))) return false
  const body = handle.startsWith('@') ? handle.slice(1) : handle
  return body !== '' && !body.includes('@')
}

/**
 * 以固定前綴組社群網址。
 * 未知平台、空值、不合格 handle、或只剩 `.`／`..`（會被瀏覽器當路徑區段）→ null。
 */
export function buildSocialUrl(platform: string, handle: string | null | undefined): string | null {
  if (!Object.prototype.hasOwnProperty.call(SOCIAL_PLATFORMS, platform)) return null
  if (!handle || !isSafeHandle(handle)) return null
  const body = handle.startsWith('@') ? handle.slice(1) : handle
  if (body === '.' || body === '..') return null
  return SOCIAL_PLATFORMS[platform as SocialPlatform] + encodeURIComponent(body)
}

/** 只允許 http／https 的絕對網址（不含帳密、空白、控制字元） */
export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value || INVISIBLE_OR_CONTROL.test(value)) return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '' && url.username === '' && url.password === ''
}
