import { tagService } from './tagService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('tagService', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'true');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('getHotTags 委派給 mock module 並回傳正確結果', async () => {
      const result = await tagService.getHotTags(10);

      expect(result).toHaveLength(10);
      expect(result[0]).toHaveProperty('uuid');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).toHaveProperty('articleCount');
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
      const mockData = [{ uuid: 't-1', name: 'Vue', slug: 'vue', articleCount: 18 }];

      // apiClient response interceptor 已解包，直接回傳 data
      vi.mocked(apiClient.get).mockResolvedValue(mockData);

      const result = await tagService.getHotTags(10);
      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/tags/hot', {
        params: { limit: 10 },
      });
    });

    it('網路錯誤時回傳空陣列並呼叫 console.error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network failure'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await tagService.getHotTags();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Fetch hot tags failed:', expect.any(Error));
    });
  });
});
