import apiClient from './apiClient';
import type { TagDetail } from '../types/editor';
import { useAuthStore } from '../stores/auth';

// 標籤詳情回應型別（對齊後端 TagDetailResponse）
export interface TagDetailResponse {
  uuid: string;
  name: string;
  slug: string;
  articleCount: number;
}

// 後端原始 Tag entity 結構
interface BackendTag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  parentId?: string | null;
  createdAt?: string;
}

// 後端 TagDetailResponse（單一標籤詳情）
interface BackendTagDetail {
  id: string;
  name: string;
  slug: string;
  color: string | null | undefined;
  icon: string | null | undefined;
  description: string | null | undefined;
  usageCount: number;
}

function mapBackendTag(raw: BackendTag): TagDetailResponse {
  return { uuid: raw.id, name: raw.name, slug: raw.slug, articleCount: raw.usageCount };
}

function mapBackendTagDetail(raw: BackendTagDetail): TagDetail {
  return {
    uuid: raw.id,
    name: raw.name,
    slug: raw.slug,
    color: raw.color ?? '',
    icon: raw.icon ?? '',
    description: raw.description ?? '',
    usageCount: raw.usageCount,
  };
}

export const tagService = {
  /**
   * 取得熱門標籤（根據 env 決定要打 API 還是委派給 Mock）
   */
  async getHotTags(limit: number = 20): Promise<TagDetailResponse[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getHotTagsMock } = await import('./mock/tagMockService');
      return getHotTagsMock(limit);
    }

    try {
      const data = await apiClient.get<unknown, BackendTag[]>('/api/v1/tags/hot', {
        params: { limit },
      });
      return data.map(mapBackendTag);
    } catch (error) {
      console.error('Fetch hot tags failed:', error);
      return [];
    }
  },

  /**
   * 根據 slug 取得標籤詳情
   */
  async getTagBySlug(slug: string): Promise<TagDetail | null> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getTagBySlugMock } = await import('./mock/tagMockService');
      return getTagBySlugMock(slug);
    }

    try {
      const data = await apiClient.get<unknown, BackendTagDetail>(`/api/v1/tags/${slug}`);
      return mapBackendTagDetail(data);
    } catch (error) {
      console.error('Fetch tag by slug failed:', error);
      return null;
    }
  },

  /**
   * 追蹤標籤（需要登入）
   */
  async followTag(id: string): Promise<void> {
    // Auth guard intentionally runs before mock check — write operations require auth in all environments
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      throw new Error('未登入');
    }

    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { followTagMock } = await import('./mock/tagMockService');
      return followTagMock(id);
    }

    await apiClient.post<unknown, void>(`/api/v1/tags/${id}/follow`);
  },

  /**
   * 取消追蹤標籤（需要登入）
   */
  async unfollowTag(id: string): Promise<void> {
    // Auth guard intentionally runs before mock check — write operations require auth in all environments
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      throw new Error('未登入');
    }

    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { unfollowTagMock } = await import('./mock/tagMockService');
      return unfollowTagMock(id);
    }

    await apiClient.delete<unknown, void>(`/api/v1/tags/${id}/follow`);
  },
};
