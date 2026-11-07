// ── 搜尋相關型別 ───────────────────────────────────────────────────────────────

/** 後端 GET /api/v1/search 的 sort 白名單（不分大小寫）；其他值（含已移除的 hot）一律回 400 */
export const SEARCH_SORT_VALUES = ['relevance', 'latest'] as const;
export type SearchSort = (typeof SEARCH_SORT_VALUES)[number];

export interface SearchParams {
  q?: string;
  tag?: string;
  /** 省略時後端預設 relevance */
  sort?: SearchSort;
  page?: number;
  size?: number;
}

export interface SearchResult {
  articleUuid: string;
  title: string;
  summary: string;
  slug: string;
  authorNickname: string;
  /** 作者公開 UUID；後端舊資料可能為 null → AuthorName 退回純文字 */
  authorUuid?: string | null;
  tagNames: string[];
  publishedAt: string;
  viewCount: number;
  likeCount: number;
}

// ── 管理員搜尋索引狀態（GET /api/v1/admin/search/status） ────────────────────
export interface SearchIndexStatus {
  documentCount: number | null;
  lastReindexAt: string | null;
  healthy: boolean;
  /** 最近一次全量重建作業；從未重建過或後端讀取 Redis 失敗時為 null（後端 PR 合併前的舊回應則沒有此欄位） */
  reindex?: SearchReindexJob | null;
}

// ── 全量重建背景作業（POST /api/v1/admin/search/reindex → 202；GET status 的 reindex 欄位） ──
export const REINDEX_JOB_STATES = ['RUNNING', 'COMPLETED', 'FAILED'] as const;
export type ReindexJobState = (typeof REINDEX_JOB_STATES)[number];

export interface SearchReindexJob {
  jobId: string;
  state: ReindexJobState;
  /** 已寫入新索引的文章數 */
  processed: number;
  /** 進度分母；背景作業尚未算出時為 null */
  total: number | null;
  startedAt: string;
  /** 執行中為 null */
  finishedAt: string | null;
  /** FAILED 時的錯誤摘要，其餘為 null */
  error: string | null;
}
