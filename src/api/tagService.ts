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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const params = new URLSearchParams({ limit: limit.toString() });
      const response = await fetch(`${baseUrl}/api/v1/tags/hot?${params.toString()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const resData = await response.json();

      if (resData.code === '0' && resData.data) {
        return resData.data as TagDetailResponse[];
      }
      throw new Error(resData.message || 'API Error');
    } catch (error) {
      console.error('Fetch hot tags failed:', error);
      return [];
    }
  },
};
