import { articleService } from './articleService';
import type { PageResult, ArticleItem } from './articleService';

describe('articleService', () => {
  // ============================================================
  // Mock 模式測試
  // ============================================================
  describe('Mock 模式 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'true');
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllEnvs();
    });

    // --- getArticles ---
    describe('getArticles', () => {
      it('取第 1 頁 6 筆 → records.length === 6, current === 1', async () => {
        const promise = articleService.getArticles(1, 6, '全部', '');
        await vi.advanceTimersByTimeAsync(600);
        const result = await promise;

        expect(result.records).toHaveLength(6);
        expect(result.current).toBe(1);
        expect(result.total).toBe(50);
        expect(result.size).toBe(6);
        expect(result.pages).toBe(Math.ceil(50 / 6));
      });

      it('取最後一頁（第 9 頁，50/6=8.33→ceil=9）→ records.length === 2', async () => {
        const promise = articleService.getArticles(9, 6, '全部', '');
        await vi.advanceTimersByTimeAsync(600);
        const result = await promise;

        expect(result.records).toHaveLength(2);
        expect(result.current).toBe(9);
        expect(result.pages).toBe(9);
      });

      it('超出頁數（第 100 頁）→ records.length === 0', async () => {
        const promise = articleService.getArticles(100, 6, '全部', '');
        await vi.advanceTimersByTimeAsync(600);
        const result = await promise;

        expect(result.records).toHaveLength(0);
        expect(result.current).toBe(100);
      });

      it("keyword 過濾 'Vue' → 只含 Vue 相關文章", async () => {
        const promise = articleService.getArticles(1, 100, '全部', 'Vue');
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
        const promise = articleService.getArticles(1, 100, 'Frontend', '');
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
        const promise = articleService.getArticles(1, 100, '全部', '');
        await vi.advanceTimersByTimeAsync(600);
        const result = await promise;

        expect(result.total).toBe(50);
        expect(result.records).toHaveLength(50);
      });
    });

    // --- getArticleByUuid ---
    describe('getArticleByUuid', () => {
      it('存在的文章 → 回傳含 content 的 ArticleDetailItem', async () => {
        const promise = articleService.getArticleByUuid('article-1');
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
        const promise = articleService.getArticleByUuid('non-existent-uuid');
        await vi.advanceTimersByTimeAsync(500);
        const result = await promise;

        expect(result).toBeNull();
      });
    });
  });

  // ============================================================
  // API 模式測試
  // ============================================================
  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'false');
      vi.stubEnv('VITE_API_BASE_URL', 'http://test-api');
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    describe('getArticles', () => {
      it('成功回應 { code: 200, data: {...} } → 正確解析 PageResult', async () => {
        const mockData: PageResult<ArticleItem> = {
          records: [
            {
              uuid: 'api-1',
              title: '測試文章',
              summary: '摘要',
              viewCount: 100,
              publishedAt: '2026-03-01',
              tags: ['Vue'],
            },
          ],
          total: 1,
          size: 6,
          current: 1,
          pages: 1,
        };

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: true,
          json: async () => ({ code: 200, data: mockData }),
        } as Response);

        const { articleService: freshService } = await import(
          './articleService'
        );
        const result = await freshService.getArticles(1, 6, '全部', '');

        expect(result).toEqual(mockData);
      });

      it('網路錯誤 → 回傳空 PageResult 並呼叫 console.error', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(
          new Error('Network failure'),
        );
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const { articleService: freshService } = await import(
          './articleService'
        );
        const result = await freshService.getArticles(1, 6, '全部', '');

        expect(result.records).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.size).toBe(6);
        expect(result.current).toBe(1);
        expect(result.pages).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Fetch articles failed:',
          expect.any(Error),
        );
      });

      it('URL 參數組裝正確（含 category + keyword）', async () => {
        const fetchSpy = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue({
            ok: true,
            json: async () => ({
              code: 200,
              data: { records: [], total: 0, size: 6, current: 1, pages: 0 },
            }),
          } as Response);

        const { articleService: freshService } = await import(
          './articleService'
        );
        await freshService.getArticles(2, 10, 'Backend', '微服務');

        expect(fetchSpy).toHaveBeenCalledOnce();
        const calledUrl = fetchSpy.mock.calls[0][0] as string;

        expect(calledUrl).toContain('http://test-api/api/v1/articles?');
        expect(calledUrl).toContain('pageNum=2');
        expect(calledUrl).toContain('pageSize=10');
        expect(calledUrl).toContain('categorySlug=Backend');
        expect(calledUrl).toContain(
          `keyword=${encodeURIComponent('微服務')}`,
        );
      });
    });
  });
});
