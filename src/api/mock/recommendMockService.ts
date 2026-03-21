import type { RecommendArticleResponse } from '../recommendService';
import { allMockArticles } from './data';

// 模擬推薦服務：依照 viewCount 排序取前 N 篇
export function getTrendingMock(limit: number): Promise<RecommendArticleResponse[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sorted = [...allMockArticles].sort((a, b) => b.viewCount - a.viewCount);
      const trending: RecommendArticleResponse[] = sorted.slice(0, limit).map(a => ({
        uuid: a.uuid,
        title: a.title,
        slug: a.slug,
        summary: a.summary,
        coverImageUrl: a.coverImageUrl,
        authorNickname: a.authorNickname,
        viewCount: a.viewCount,
        likeCount: a.likeCount,
        publishedAt: a.publishedAt,
        tags: a.tags,
      }));
      resolve(trending);
    }, 400);
  });
}
