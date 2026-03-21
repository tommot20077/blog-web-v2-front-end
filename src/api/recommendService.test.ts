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

    it('成功回應時正確解析結果', async () => {
      const mockData = [{ uuid: 'r-1', title: '熱門文章', slug: 'hot', summary: '摘要', coverImageUrl: null, authorNickname: 'Author', viewCount: 100, likeCount: 10, publishedAt: '2026-03-01', tags: ['Vue'] }];

      // apiClient response interceptor 已解包，直接回傳 data
      vi.mocked(apiClient.get).mockResolvedValue(mockData);

      const result = await recommendService.getTrending('7d', 5);
      expect(result).toEqual(mockData);
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
  });
});
