import { getArticlesMock, getArticleByUuidMock } from './articleMockService';

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
      const promise = getArticlesMock(1, 6, '全部', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records).toHaveLength(6);
      expect(result.current).toBe(1);
      expect(result.total).toBe(50);
      expect(result.size).toBe(6);
      expect(result.pages).toBe(Math.ceil(50 / 6));
    });

    it('取最後一頁（第 9 頁，50/6=8.33→ceil=9）→ records.length === 2', async () => {
      const promise = getArticlesMock(9, 6, '全部', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records).toHaveLength(2);
      expect(result.current).toBe(9);
      expect(result.pages).toBe(9);
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
        const matchesKeyword =
          article.title.includes('Vue') || article.summary.includes('Vue');
        expect(matchesKeyword).toBe(true);
      }
    });

    it("category 過濾 'Frontend' → 只含 Frontend tagged 文章", async () => {
      const promise = getArticlesMock(1, 100, 'Frontend', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.records.length).toBeGreaterThan(0);
      for (const article of result.records) {
        expect(
          article.tags.some((t) => t.toLowerCase() === 'frontend'),
        ).toBe(true);
      }
    });

    it("category '全部' → 不過濾，回傳全部 50 筆", async () => {
      const promise = getArticlesMock(1, 100, '全部', '');
      await vi.advanceTimersByTimeAsync(600);
      const result = await promise;

      expect(result.total).toBe(50);
      expect(result.records).toHaveLength(50);
    });
  });

  // --- getArticleByUuidMock ---
  describe('getArticleByUuidMock', () => {
    it('存在的文章 → 回傳含 content 的 ArticleDetailItem', async () => {
      const promise = getArticleByUuidMock('article-1');
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result).not.toBeNull();
      expect(result!.uuid).toBe('article-1');
      expect(result!.title).toContain('Vue');
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
});
