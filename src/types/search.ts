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
}
