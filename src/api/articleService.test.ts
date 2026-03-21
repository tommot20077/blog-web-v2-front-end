import { articleService } from './articleService';
import type { PageResult, ArticleItem } from './articleService';

describe('articleService', () => {
  // ============================================================
  // Mock 路由測試 — 驗證 VITE_USE_MOCK=true 時 delegate 到 mock module
  // ============================================================
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    // 不使用 fake timers — dynamic import + setTimeout 在 fake timers 下會死鎖
    // 延遲行為已在 mock/articleMockService.test.ts 中測試
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'true');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('getArticles 委派給 mock module 並回傳正確結果', async () => {
      const result = await articleService.getArticles(1, 6, '全部', '');

      expect(result.records).toHaveLength(6);
      expect(result.current).toBe(1);
      expect(result.total).toBe(50);
    });

    it('getArticleByUuid 委派給 mock module 並回傳正確結果', async () => {
      const result = await articleService.getArticleByUuid('article-1');

      expect(result).not.toBeNull();
      expect(result!.uuid).toBe('article-1');
      expect(result!.content).toBeDefined();
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
