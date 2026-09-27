import { getArticlesMock, getArticleByUuidMock, getArchiveMock } from './articleMockService';
import { allMockArticles } from './data';

describe('articleMockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- getArticlesMock ---
  describe('getArticlesMock', () => {
    it('取第 1 頁 6 筆 → records.length === 6, current === 1', async () => {
      const total = allMockArticles.length;
      const promise = getArticlesMock(1, 6, '全部', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records).toHaveLength(6);
      expect(result.current).toBe(1);
      expect(result.total).toBe(total);
      expect(result.size).toBe(6);
      expect(result.pages).toBe(Math.ceil(total / 6));
    });

    it('取最後一頁 → 只剩下不滿一頁的筆數', async () => {
      const total = allMockArticles.length;
      const lastPage = Math.ceil(total / 6);
      const expectedLastPageCount = total - (lastPage - 1) * 6;
      const promise = getArticlesMock(lastPage, 6, '全部', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records).toHaveLength(expectedLastPageCount);
      expect(result.current).toBe(lastPage);
      expect(result.pages).toBe(lastPage);
    });

    it('超出頁數（第 100 頁）→ records.length === 0', async () => {
      const promise = getArticlesMock(100, 6, '全部', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records).toHaveLength(0);
      expect(result.current).toBe(100);
    });

    it("keyword 過濾 'Vue' → 只含 Vue 相關文章", async () => {
      const promise = getArticlesMock(1, 100, '全部', 'Vue');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records.length).toBeGreaterThan(0);
      for (const article of result.records) {
        const kw = 'vue';
        const matchesKeyword =
          article.title.toLowerCase().includes(kw) ||
          article.summary.toLowerCase().includes(kw) ||
          article.tags.some(t => t.toLowerCase().includes(kw));
        expect(matchesKeyword).toBe(true);
      }
    });

    it("category 過濾 'Frontend' → 只含 Frontend 分類文章", async () => {
      const promise = getArticlesMock(1, 100, 'Frontend', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records.length).toBeGreaterThan(0);
      for (const article of result.records) {
        expect((article as typeof allMockArticles[number]).categories).toContain('Frontend');
      }
    });

    it("keyword 搜尋 'vue'（小寫）大小寫不分回傳 Vue 相關文章", async () => {
      const promise = getArticlesMock(1, 100, '全部', 'vue');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records.length).toBeGreaterThan(0);
      for (const article of result.records) {
        const kw = 'vue'
        const matchesKeyword =
          article.title.toLowerCase().includes(kw) ||
          article.summary.toLowerCase().includes(kw) ||
          article.tags.some(t => t.toLowerCase().includes(kw))
        expect(matchesKeyword).toBe(true);
      }
    });

    it("category 過濾 'Life' → 回傳 Life 分類文章", async () => {
      const promise = getArticlesMock(1, 100, 'Life', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records.length).toBeGreaterThan(0);
      for (const article of result.records) {
        expect((article as typeof allMockArticles[number]).categories).toContain('Life');
      }
    });

    it('tags（單一 slug）→ 只回傳帶有該標籤的文章（與後端 tags 參數語意一致）', async () => {
      const slug = allMockArticles[0]!.tagRefs![0]!.slug;
      const expected = allMockArticles.filter(a => a.tagRefs!.some(r => r.slug === slug)).length;

      const promise = getArticlesMock(1, 100, '全部', '', { tags: [slug] });
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.total).toBe(expected);
      for (const article of result.records) {
        expect(article.tagRefs!.map(r => r.slug)).toContain(slug);
      }
    });

    it('tags（多個 slug）→ AND：文章須同時帶有全部標籤', async () => {
      const [first, second] = allMockArticles.find(a => a.tagRefs!.length >= 2)!.tagRefs!;
      const slugs = [first!.slug, second!.slug];
      const expected = allMockArticles.filter(a => slugs.every(s => a.tagRefs!.some(r => r.slug === s))).length;

      const promise = getArticlesMock(1, 100, '全部', '', { tags: slugs });
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.total).toBe(expected);
      expect(result.total).toBeLessThan(allMockArticles.length);
    });

    it('categorySlugs → OR：屬於任一分類即可（slug 對應分類名稱轉小寫）', async () => {
      const expected = allMockArticles.filter(a =>
        a.categories.some(c => ['frontend', 'life'].includes(c.toLowerCase()))).length;

      const promise = getArticlesMock(1, 100, '全部', '', { categorySlugs: ['frontend', 'life'] });
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.total).toBe(expected);
      expect(result.total).toBeGreaterThan(0);
    });

    it("category '全部' → 不過濾，回傳全部文章", async () => {
      const total = allMockArticles.length;
      const promise = getArticlesMock(1, total, '全部', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.total).toBe(total);
      expect(result.records).toHaveLength(total);
    });
  });

  // --- getArticleByUuidMock ---
  describe('getArticleByUuidMock', () => {
    it('存在的文章 → 回傳含 content 的 ArticleDetailItem', async () => {
      const promise = getArticleByUuidMock('a-2023-01');
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result).not.toBeNull();
      expect(result!.uuid).toBe('a-2023-01');
      expect(result!.title.length).toBeGreaterThan(0);
      expect(result!.content).toBeDefined();
      expect(typeof result!.content).toBe('string');
      expect(result!.content.length).toBeGreaterThan(0);
    });

    it('不存在的文章 → 回傳 null', async () => {
      const promise = getArticleByUuidMock('non-existent-uuid');
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result).toBeNull();
    });
  });

  // --- getArchiveMock ---
  describe('getArchiveMock', () => {
    it('回傳全部文章的 archive 精簡投影（uuid/title/slug/publishedAt/tags）', async () => {
      const promise = getArchiveMock();
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result).toHaveLength(allMockArticles.length);
      const first = result[0]!;
      expect(first).toHaveProperty('uuid');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('slug');
      expect(first).toHaveProperty('publishedAt');
      expect(Array.isArray(first.tags)).toBe(true);
    });

    it('依 publishedAt 由新到舊排序且跨多年度', async () => {
      const promise = getArchiveMock();
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]!.publishedAt.localeCompare(result[i]!.publishedAt)).toBeGreaterThanOrEqual(0);
      }
      const years = new Set(result.map((a) => a.publishedAt.slice(0, 4)));
      expect(years.size).toBeGreaterThan(1);
    });
  });
});
