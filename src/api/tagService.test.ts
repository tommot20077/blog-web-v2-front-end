import { tagService } from './tagService';
import apiClient from './apiClient';
import { useAuthStore } from '../stores/auth';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(),
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

describe('tagService — getTagBySlug / followTag / unfollowTag', () => {
  describe('Mock 路由 (VITE_USE_MOCK=true)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'true');
      vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof useAuthStore>);
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
    });

    it('getTagBySlug 找到已存在的 slug → 回傳 TagDetail 物件', async () => {
      const result = await tagService.getTagBySlug('vue-3');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('vue-3');
      expect(result).toHaveProperty('uuid');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('usageCount');
    });

    it('getTagBySlug 找不到 slug → 回傳 null', async () => {
      const result = await tagService.getTagBySlug('non-existent-slug');

      expect(result).toBeNull();
    });

    it('followTag 在 mock 模式下解析成功不拋錯', async () => {
      await expect(tagService.followTag('tag-1')).resolves.toBeUndefined();
    });

    it('unfollowTag 在 mock 模式下解析成功不拋錯', async () => {
      await expect(tagService.unfollowTag('tag-1')).resolves.toBeUndefined();
    });

    it('followTag 未登入時拋出「未登入」錯誤', async () => {
      vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false } as ReturnType<typeof useAuthStore>);

      await expect(tagService.followTag('tag-1')).rejects.toThrow('未登入');
    });

    it('unfollowTag 未登入時拋出「未登入」錯誤', async () => {
      vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: false } as ReturnType<typeof useAuthStore>);

      await expect(tagService.unfollowTag('tag-1')).rejects.toThrow('未登入');
    });
  });

  describe('API 模式 (VITE_USE_MOCK=false)', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_USE_MOCK', 'false');
      vi.mocked(useAuthStore).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof useAuthStore>);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    it('getTagBySlug 成功時正確映射後端 id → uuid', async () => {
      const backendData = {
        id: 'tag-uuid-1',
        name: 'Vue',
        slug: 'vue',
        color: '#42b883',
        icon: 'vue-icon',
        description: 'Vue.js framework',
        usageCount: 18,
      };
      vi.mocked(apiClient.get).mockResolvedValue(backendData);

      const result = await tagService.getTagBySlug('vue');

      expect(result?.uuid).toBe('tag-uuid-1');
      expect(result?.usageCount).toBe(18);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/tags/vue');
    });

    it('getTagBySlug 網路錯誤時回傳 null', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network failure'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await tagService.getTagBySlug('vue');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Fetch tag by slug failed:', expect.any(Error));
    });

    it('followTag 呼叫正確 API 端點', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await tagService.followTag('tag-uuid-1');

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/tags/tag-uuid-1/follow');
    });

    it('unfollowTag 呼叫正確 API 端點', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await tagService.unfollowTag('tag-uuid-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/tags/tag-uuid-1/follow');
    });
  });
});
