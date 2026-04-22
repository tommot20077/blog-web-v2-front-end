import { articleService } from './articleService';
import type { ArticleItem } from './articleService';
import type { PageResult } from '../types/editor';
import apiClient from './apiClient';
import { allMockArticles } from './mock/data';

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
      expect(result.total).toBe(allMockArticles.length);
    });

    it('getArticleByUuid 委派給 mock module 並回傳正確結果', async () => {
      const result = await articleService.getArticleByUuid('article-1');

      expect(result).not.toBeNull();
      expect(result!.uuid).toBe('article-1');
      expect(result!.content).toBeDefined();
    });

    it('getArticleBySlug 委派給 mock module 並回傳正確結果', async () => {
      const result = await articleService.getArticleBySlug('article-slug-1');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('article-slug-1');
      expect(result!.content).toBeDefined();
    });

    it('getArticleBySlug 找不到 slug 時回傳 null', async () => {
      const result = await articleService.getArticleBySlug('non-existent-slug');
      expect(result).toBeNull();
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
      it('成功回應 → tags 由物件陣列映射為字串陣列', async () => {
        const backendData = {
          records: [
            {
              uuid: 'api-1',
              title: '測試文章',
              summary: '摘要',
              viewCount: 100,
              publishedAt: '2026-03-01',
              tags: [{ id: 't-1', name: 'Vue', slug: 'vue' }],
            },
          ],
          total: 1,
          size: 6,
          current: 1,
          pages: 1,
        };

        vi.mocked(apiClient.get).mockResolvedValue(backendData);

        const result = await articleService.getArticles(1, 6, '全部', '');

        expect(result.records[0].tags).toEqual(['Vue']);
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

      it('URL 路徑與參數組裝正確（含 category，keyword 不送往後端）', async () => {
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
      it('成功回應 → tags 由物件陣列映射為字串陣列', async () => {
        const backendDetail = {
          uuid: 'detail-1',
          title: '詳情文章',
          content: '# Hello',
          tags: [{ id: 't-1', name: 'Vue', slug: 'vue' }, { id: 't-2', name: 'TypeScript', slug: 'typescript' }],
        };
        vi.mocked(apiClient.get).mockResolvedValue(backendDetail);

        const result = await articleService.getArticleByUuid('detail-1');

        expect(result).not.toBeNull();
        expect(result!.tags).toEqual(['Vue', 'TypeScript']);
        expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/detail-1');
      });

      it('ArticleItem 不含 categories 欄位', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
          uuid: 'detail-2',
          title: '測試',
          content: '',
          tags: [],
        });

        const result = await articleService.getArticleByUuid('detail-2');

        expect(result).not.toBeNull();
        expect(result).not.toHaveProperty('categories');
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

    describe('getArticleBySlug', () => {
      it('成功回應 → tags 由物件陣列映射為字串陣列', async () => {
        const backendDetail = {
          uuid: 'slug-1',
          title: 'Slug 文章',
          slug: 'my-article',
          content: '# Content',
          tags: [{ id: 't-1', name: 'Vue', slug: 'vue' }],
        };
        vi.mocked(apiClient.get).mockResolvedValue(backendDetail);

        const result = await articleService.getArticleBySlug('my-article');

        expect(result).not.toBeNull();
        expect(result!.tags).toEqual(['Vue']);
        expect(apiClient.get).toHaveBeenCalledWith('/api/v1/articles/slug/my-article');
      });

      it('網路錯誤 → 回傳 null 並呼叫 console.error', async () => {
        vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const result = await articleService.getArticleBySlug('bad-slug');

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Fetch article by slug failed:',
          expect.any(Error),
        );
      });
    });
  });
});
