// 推薦文章回應型別（對齊後端 RecommendArticleResponse）
export interface RecommendArticleResponse {
  uuid: string;
  title: string;
  slug: string;
  summary: string;
  coverImageUrl: string | null;
  authorNickname: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  tags: string[];
}

export const recommendService = {
  /**
   * 取得熱門文章（根據 env 決定要打 API 還是委派給 Mock）
   */
  async getTrending(period: string = '7d', limit: number = 10): Promise<RecommendArticleResponse[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const { getTrendingMock } = await import('./mock/recommendMockService');
      return getTrendingMock(limit);
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const params = new URLSearchParams({ period, limit: limit.toString() });
      const response = await fetch(`${baseUrl}/api/v1/recommend/trending?${params.toString()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const resData = await response.json();

      if (resData.code === '0' && resData.data) {
        return resData.data as RecommendArticleResponse[];
      }
      throw new Error(resData.message || 'API Error');
    } catch (error) {
      console.error('Fetch trending articles failed:', error);
      return [];
    }
  },
};
