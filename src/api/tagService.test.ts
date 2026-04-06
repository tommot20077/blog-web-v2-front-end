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
      const backendData = [{ id: 't-1', name: 'Vue', slug: 'vue', usageCount: 18 }];
      const expectedData = [{ uuid: 't-1', name: 'Vue', slug: 'vue', articleCount: 18 }];

      // apiClient response interceptor 已解包，直接回傳 data（後端原始格式）
      vi.mocked(apiClient.get).mockResolvedValue(backendData);

      const result = await tagService.getHotTags(10);
      expect(result).toEqual(expectedData);
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

    it('API 模式：後端 id 正確映射為 uuid', async () => {
      const backendData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Vue',
          slug: 'vue',
          usageCount: 42,
          color: '#42b883',
          icon: null,
          description: 'Vue.js framework',
          parentId: null,
          createdAt: '2024-01-01T00:00:00',
        },
      ];
      vi.mocked(apiClient.get).mockResolvedValue(backendData);

      const result = await tagService.getHotTags(1);

      expect(result[0].uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('API 模式：後端 usageCount 正確映射為 articleCount', async () => {
      const backendData = [
        {
          id: 'abc-123',
          name: 'TypeScript',
          slug: 'typescript',
          usageCount: 99,
          color: '#3178c6',
          icon: null,
          description: null,
          parentId: null,
          createdAt: '2024-01-01T00:00:00',
        },
      ];
      vi.mocked(apiClient.get).mockResolvedValue(backendData);

      const result = await tagService.getHotTags(1);

      expect(result[0].articleCount).toBe(99);
    });

    it('API 模式：color、icon 等額外欄位不出現在結果中', async () => {
      const backendData = [
        {
          id: 'def-456',
          name: 'React',
          slug: 'react',
          usageCount: 77,
          color: '#61dafb',
          icon: 'react-icon',
          description: 'React framework',
          parentId: 'parent-id',
          createdAt: '2024-02-01T00:00:00',
        },
      ];
      vi.mocked(apiClient.get).mockResolvedValue(backendData);

      const result = await tagService.getHotTags(1);
      const item = result[0] as Record<string, unknown>;

      expect(item).not.toHaveProperty('id');
      expect(item).not.toHaveProperty('color');
      expect(item).not.toHaveProperty('icon');
      expect(item).not.toHaveProperty('description');
      expect(item).not.toHaveProperty('parentId');
      expect(item).not.toHaveProperty('createdAt');
    });
  });
});
