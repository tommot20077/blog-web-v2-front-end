import { articleService } from './articleService';
import type { PageResult, ArticleItem } from './articleService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

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
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    describe('getArticles', () => {
      it('成功回應 → apiClient 解包後直接回傳 PageResult', async () => {
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

        // apiClient response interceptor 已解包，直接回傳 data
        vi.mocked(apiClient.get).mockResolvedValue(mockData);

        const result = await articleService.getArticles(1, 6, '全部', '');

        expect(result).toEqual(mockData);
      });

      it('網路錯誤 → 回傳空 PageResult 並呼叫 console.error', async () => {
        vi.mocked(apiClient.get).mockRejectedValue(new Error('Network failure'));
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const result = await articleService.getArticles(1, 6, '全部', '');

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

      it('URL 路徑與參數組裝正確（含 category + keyword）', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
          records: [],
          total: 0,
          size: 10,
          current: 2,
          pages: 0,
        });

        await articleService.getArticles(2, 10, 'Backend', '微服務');

        expect(apiClient.get).toHaveBeenCalledOnce();
        expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles', {
          params: {
            page: '2',
            size: '10',
            categorySlug: 'Backend',
            keyword: '微服務',
          },
        });
      });

      it('category 為「全部」時不帶 categorySlug 參數', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
          records: [],
          total: 0,
          size: 6,
          current: 1,
          pages: 0,
        });

        await articleService.getArticles(1, 6, '全部', '');

        expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles', {
          params: {
            page: '1',
            size: '6',
          },
        });
      });
    });

    describe('getArticleByUuid', () => {
      it('成功回應 → 回傳文章詳情', async () => {
        const mockDetail = {
          uuid: 'detail-1',
          title: '詳情文章',
          content: '# Hello',
        };
        vi.mocked(apiClient.get).mockResolvedValue(mockDetail);

        const result = await articleService.getArticleByUuid('detail-1');

        expect(result).toEqual(mockDetail);
        expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/detail-1');
      });

      it('網路錯誤 → 回傳 null 並呼叫 console.error', async () => {
        vi.mocked(apiClient.get).mockRejectedValue(new Error('Network failure'));
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const result = await articleService.getArticleByUuid('nonexistent');

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Fetch article detail failed:',
          expect.any(Error),
        );
      });
    });
  });
});
