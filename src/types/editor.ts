// ── 文章狀態（使用 as const + union type，禁止 enum） ────────────────────────
export const ARTICLE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ArticleStatus = (typeof ARTICLE_STATUS)[keyof typeof ARTICLE_STATUS];

// 我的文章篩選（額外包含 ALL 全選項）
export const ARTICLE_STATUS_FILTER = {
  ALL: 'ALL',
  ...ARTICLE_STATUS,
} as const;

export type ArticleStatusFilter = (typeof ARTICLE_STATUS_FILTER)[keyof typeof ARTICLE_STATUS_FILTER];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatusFilter, string> = {
  ALL: '全部',
  DRAFT: '草稿',
  PENDING_REVIEW: '待審',
  PUBLISHED: '已發布',
  REJECTED: '被退回',
  ARCHIVED: '已封存',
} as const;

export const ARTICLE_STATUS_COLORS: Record<ArticleStatus, string> = {
  DRAFT: 'gray',
  PENDING_REVIEW: 'yellow',
  PUBLISHED: 'green',
  REJECTED: 'red',
  ARCHIVED: 'blue',
} as const;

// ── 編輯器文章完整型別（含 content + status） ──────────────────────────────
export interface EditorArticle {
  uuid: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl: string | null;
  status: ArticleStatus;
  categories: CategoryOption[];
  tags: string[];
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// 我的文章列表用（含 rejectReason）
export interface MyArticle {
  uuid: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  status: ArticleStatus;
  tags: string[];
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

// 管理員待審文章（含作者名稱）
export interface PendingArticle extends MyArticle {
  authorNickname: string;
}

// ── 編輯器表單資料（送 API 用） ─────────────────────────────────────────────
export interface ArticleFormData {
  title: string;
  summary: string;
  content: string;
  coverImageUrl: string | null;
  categoryIds: string[];
  tagNames: string[];
}

// ── 檔案上傳 ────────────────────────────────────────────────────────────────
export type FileUsageType = 'ARTICLE_CONTENT' | 'ARTICLE_COVER' | 'AVATAR';

export interface FileUploadResponse {
  id: string;
  url: string;
  width: number;
  height: number;
  size: number;
  usageType: FileUsageType;
}

// ── 配額 ─────────────────────────────────────────────────────────────────────
export interface QuotaInfo {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
}

// ── 分類 / 標籤 ───────────────────────────────────────────────────────────────
export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface TagSuggestion {
  name: string;
  articleCount: number;
}

// ── 分頁結果（複用於 My Articles） ──────────────────────────────────────────
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// ── 標籤詳情 ──────────────────────────────────────────────────────────────────
export interface TagDetail {
  uuid: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
  usageCount: number;
  /** 當前使用者是否已追蹤此標籤；未認證時 false */
  followed: boolean;
}

// ── 管理員操作 requests ────────────────────────────────────────────────────────
export interface UpdateTagRequest {
  color?: string;
  icon?: string;
  description?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
}

export interface CategoryResponse {
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}
