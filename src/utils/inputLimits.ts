/**
 * 輸入長度／格式上限（W7F-6）。對齊 api-reference/openapi.json 快照的 maxLength／pattern。
 * 上限只定義在這裡；各表單的 maxlength、送出前預檢與提示文案都由此衍生。
 *
 * 長度以 JS `String.length`（UTF-16 code unit）計，與後端 Bean Validation `@Size` 的計算方式一致。
 */
export const MAX_ARTICLE_CONTENT_LENGTH = 200000 // CreateArticleRequest／UpdateArticleRequest.content
export const MAX_ARTICLE_TITLE_LENGTH = 120 // .title
export const MAX_ARTICLE_SUMMARY_LENGTH = 500 // .summary
export const MAX_NICKNAME_LENGTH = 50 // RegisterRequest.nickname
export const MAX_REJECT_REASON_LENGTH = 500 // RejectArticleRequest.reason
export const MAX_TAG_ICON_LENGTH = 100 // UpdateTagRequest.icon
export const MAX_TAG_DESCRIPTION_LENGTH = 200 // UpdateTagRequest.description

/** UpdateTagRequest.color：`#RRGGBB` */
export const TAG_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

/** 內文字數達上限的這個比例起顯示提示 */
export const CONTENT_WARN_RATIO = 0.9

/** 超過上限才算超過；剛好等於上限可以送出（與後端「大於才拒絕」一致） */
export function exceedsLength(value: string, max: number): boolean {
  return value.length > max
}

export function isNearLimit(length: number, max: number): boolean {
  return length >= max * CONTENT_WARN_RATIO
}

export function isTagColor(value: string): boolean {
  return TAG_COLOR_PATTERN.test(value)
}
