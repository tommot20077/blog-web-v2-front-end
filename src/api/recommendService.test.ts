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

    it('成功回應時正確解析結果（無 coverImageUrl）', async () => {
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
        },
      ]);
      expect(result[0]).not.toHaveProperty('coverImageUrl');
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
      expect(result[0].tags).toEqual(['Vue', 'JavaScript']);
    });

  });
});
