import { recommendService } from './recommendService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('recommendService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'true');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('getTrending 委派給 mock module 並回傳正確結果', async () => {
      const result = await recommendService.getTrending('7d', 5);

      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('uuid');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('slug');
    });
  });

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'false');
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    it('成功回應時正確解析結果（backend 無 coverImageUrl，mapper 補 null）', async () => {
      const backendRaw = [
        {
          uuid: 'r-1',
          title: '熱門文章',
          slug: 'hot',
          summary: '摘要',
          authorNickname: 'Author',
          tagNames: ['Vue'],
          viewCount: 100,
          likeCount: 10,
          publishedAt: '2026-03-01',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(backendRaw);

      const result = await recommendService.getTrending('7d', 5);
      expect(result).toEqual([
        {
          uuid: 'r-1',
          title: '熱門文章',
          slug: 'hot',
          summary: '摘要',
          authorNickname: 'Author',
          viewCount: 100,
          likeCount: 10,
          publishedAt: '2026-03-01',
          tags: ['Vue'],
          coverImageUrl: null,
        },
      ]);
      expect(result[0]?.coverImageUrl).toBeNull();
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/recommend/trending', {
        params: { period: '7d', limit: 5 },
      });
    });

    it('網路錯誤時回傳空陣列並呼叫 console.error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network failure'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await recommendService.getTrending();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Fetch trending articles failed:', expect.any(Error));
    });

    it('API 模式：tagNames 正確映射為 tags', async () => {
      const backendRaw = [
        {
          uuid: 'r-2',
          title: 'Vue 3 深入解析',
          slug: 'vue-3-deep-dive',
          summary: '探索 Vue 3 的核心概念',
          authorNickname: '作者名稱',
          tagNames: ['Vue', 'JavaScript'],
          viewCount: 1500,
          likeCount: 89,
          publishedAt: '2024-01-15T10:00:00',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(backendRaw);

      const result = await recommendService.getTrending('7d', 1);
      expect(result[0]?.tags).toEqual(['Vue', 'JavaScript']);
    });

  });
});

describe('recommendService — getRelatedArticles', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'true');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('getRelatedArticles 回傳陣列', async () => {
      const result = await recommendService.getRelatedArticles('article-1');

      expect(Array.isArray(result)).toBe(true);
    });

    it('getRelatedArticles 預設依後端 limit=5 回傳最多 5 筆推薦文章', async () => {
      const result = await recommendService.getRelatedArticles('article-1');

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('getRelatedArticles 結果包含必要欄位', async () => {
      const result = await recommendService.getRelatedArticles('article-1');

      for (const item of result) {
        expect(item).toHaveProperty('uuid');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('slug');
        expect(item).toHaveProperty('summary');
        expect(item).toHaveProperty('authorNickname');
        expect(item).toHaveProperty('viewCount');
        expect(item).toHaveProperty('likeCount');
        expect(item).toHaveProperty('publishedAt');
        expect(item).toHaveProperty('tags');
      }
    });
  });

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'false');
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    it('getRelatedArticles 成功時回傳映射後的陣列', async () => {
      const backendRaw = [
        {
          uuid: 'rel-1',
          title: '相關文章',
          slug: 'related-article',
          summary: '摘要',
          authorNickname: 'Author',
          tagNames: ['Vue'],
          viewCount: 50,
          likeCount: 5,
          publishedAt: '2026-03-01',
        },
      ];
      vi.mocked(apiClient.get).mockResolvedValue(backendRaw);

      const result = await recommendService.getRelatedArticles('article-uuid-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.uuid).toBe('rel-1');
      expect(result[0]?.tags).toEqual(['Vue']);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/recommend/related/article-uuid-1', {
        params: { limit: 5 },
      });
    });

    it('getRelatedArticles 帶 limit query 對齊後端參數', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      await recommendService.getRelatedArticles('article-uuid-1', 7);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/recommend/related/article-uuid-1', {
        params: { limit: 7 },
      });
    });

    it('getRelatedArticles 網路錯誤時回傳空陣列', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network failure'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await recommendService.getRelatedArticles('article-uuid-1');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Fetch related articles failed:', expect.any(Error));
    });
  });
});
