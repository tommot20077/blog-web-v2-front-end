import { getTrendingMock } from './recommendMockService';
import { allMockArticles } from './data';

describe('recommendMockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('回傳指定數量的熱門文章', async () => {
    const promise = getTrendingMock(5);
    vi.advanceTimersByTime(400);
    const result = await promise;

    expect(result).toHaveLength(5);
  });

  it('回傳結果按 viewCount 降序排列', async () => {
    const promise = getTrendingMock(10);
    vi.advanceTimersByTime(400);
    const result = await promise;

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].viewCount).toBeGreaterThanOrEqual(result[i].viewCount);
    }
  });

  it('每筆結果包含 RecommendArticleResponse 所有欄位', async () => {
    const promise = getTrendingMock(3);
    vi.advanceTimersByTime(400);
    const result = await promise;

    for (const item of result) {
      expect(item).toHaveProperty('uuid');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('slug');
      expect(item).toHaveProperty('summary');
      expect(item).toHaveProperty('authorNickname');
      expect(item).toHaveProperty('viewCount');
      expect(item).toHaveProperty('likeCount');
      expect(item).toHaveProperty('publishedAt');
      expect(item).toHaveProperty('tags');
    }
  });

  it('limit 超過資料總量時回傳全部', async () => {
    const promise = getTrendingMock(100);
    vi.advanceTimersByTime(400);
    const result = await promise;

    expect(result).toHaveLength(allMockArticles.length);
  });
});
