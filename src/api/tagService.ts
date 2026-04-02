import apiClient from './apiClient';

// 標籤詳情回應型別（對齊後端 TagDetailResponse）
export interface TagDetailResponse {
  uuid: string;
  name: string;
  slug: string;
  articleCount: number;
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
      const data = await apiClient.get<unknown, TagDetailResponse[]>('/api/v1/tags/hot', {
        params: { limit },
      });
      return data;
    } catch (error) {
      console.error('Fetch hot tags failed:', error);
      return [];
    }
  },
};
