// ── 文章相關型別 ───────────────────────────────────────────────────────────────

/**
 * 文章章節導覽（TOC）條目。
 * 對應後端 ArticleResponse.toc（見 docs/superpowers/specs/2026-07-20-article-toc-design.md §3）。
 * id 格式為 `heading-<slug>`，僅收錄 h2/h3。
 */
export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}
