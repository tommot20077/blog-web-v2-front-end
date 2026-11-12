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

// ── W7F-7：其餘使用者可輸入欄位（同樣以快照為準）──
export const MAX_COMMENT_LENGTH = 2000 // CreateCommentRequest／EditCommentRequest.content
export const MAX_CATEGORY_NAME_LENGTH = 50 // Create／UpdateCategoryRequest.name
export const MAX_CATEGORY_SLUG_LENGTH = 60 // .slug（格式另見 AdminCategoriesView 的 CATEGORY_SLUG_PATTERN）
export const MAX_CATEGORY_DESCRIPTION_LENGTH = 200 // .description
export const MIN_USERNAME_LENGTH = 3 // RegisterRequest.username（快照沒有 pattern，不自創格式限制）
export const MAX_USERNAME_LENGTH = 50
export const MAX_SNAPSHOT_NOTE_LENGTH = 255 // CreateManualSnapshotRequest.note（目前前端尚無建立手動快照的表單）
export const MAX_SERIES_TITLE_LENGTH = 255 // Create／UpdateSeriesRequest.title（目前前端尚無系列建立／編輯表單）
export const MAX_SERIES_SLUG_LENGTH = 255 // .slug
export const MAX_LOCATION_LENGTH = 100 // UpdateProfileRequest.location
export const MAX_BIO_LENGTH = 500 // UpdateProfileRequest.bio（暱稱與註冊共用 MAX_NICKNAME_LENGTH）
export const MAX_WEBSITE_LENGTH = 255 // UpdateProfileRequest.website
export const MAX_HIGHLIGHT_NOTE_LENGTH = 2000 // Create／UpdateHighlightRequest.note
export const MIN_ACCOUNT_PASSWORD_LENGTH = 6 // DeleteAccountRequest.password
export const MAX_ACCOUNT_PASSWORD_LENGTH = 50

/** Create／UpdateSeriesRequest.slug：`^[a-z0-9-]+$` */
export const SERIES_SLUG_PATTERN = /^[a-z0-9-]+$/

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

export function isSeriesSlug(value: string): boolean {
  return SERIES_SLUG_PATTERN.test(value)
}

/** 千分位，供字數提示使用（例如 2,000） */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}
