import apiClient from './apiClient';

// 推薦文章回應型別（對齊後端 RecommendArticleResponse）
export interface RecommendArticleResponse {
  uuid: string;
  title: string;
  slug: string;
  summary: string;
  authorNickname: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  tags: string[];
}

// 後端實際回傳的原始結構
interface BackendRecommend {
  uuid: string;
  title: string;
  slug: string;
  summary: string;
  authorNickname: string;
  tagNames: string[];
  viewCount: number;
  likeCount: number;
  publishedAt: string;
}

function mapBackendRecommend(raw: BackendRecommend): RecommendArticleResponse {
  return {
    uuid: raw.uuid,
    title: raw.title,
    slug: raw.slug,
    summary: raw.summary,
    authorNickname: raw.authorNickname,
    viewCount: raw.viewCount,
    likeCount: raw.likeCount,
    publishedAt: raw.publishedAt,
    tags: raw.tagNames,
  };
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
      const data = await apiClient.get<unknown, BackendRecommend[]>('/api/v1/recommend/trending', {
        params: { period, limit },
      });
      return data.map(mapBackendRecommend);
    } catch (error) {
      console.error('Fetch trending articles failed:', error);
      return [];
    }
  },
};
