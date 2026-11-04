// ── 搜尋相關型別 ───────────────────────────────────────────────────────────────

export interface SearchParams {
  q?: string;
  tag?: string;
  sort?: 'relevance' | 'date' | 'popularity';
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
