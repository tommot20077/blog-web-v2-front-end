import { allMockArticles, getMockArticleDetail } from './data';

describe('Mock 種子資料', () => {
  describe('allMockArticles', () => {
    it('應有 50 筆文章', () => {
      expect(allMockArticles).toHaveLength(50);
    });

    it('每筆文章包含必要欄位 uuid, title, summary, viewCount, publishedAt, tags', () => {
      for (const article of allMockArticles) {
        expect(article).toHaveProperty('uuid');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('summary');
        expect(article).toHaveProperty('viewCount');
        expect(article).toHaveProperty('publishedAt');
        expect(article).toHaveProperty('tags');
      }
    });

    it('偶數索引文章為前端主題（含 Vue tag），奇數為後端主題（含 Backend tag）', () => {
      expect(allMockArticles[0].tags).toContain('Vue');
      expect(allMockArticles[0].tags).toContain('Frontend');
      expect(allMockArticles[1].tags).toContain('Backend');
      expect(allMockArticles[1].tags).toContain('Microservices');
    });

    it('uuid 格式為 article-{n}，從 1 開始', () => {
      expect(allMockArticles[0].uuid).toBe('article-1');
      expect(allMockArticles[49].uuid).toBe('article-50');
    });
  });

  describe('getMockArticleDetail', () => {
    it('對存在的 uuid 回傳含 content 的 ArticleDetailItem', () => {
      const detail = getMockArticleDetail('article-1');

      expect(detail).not.toBeNull();
      expect(detail!.uuid).toBe('article-1');
      expect(detail!.content).toBeDefined();
      expect(typeof detail!.content).toBe('string');
      expect(detail!.content.length).toBeGreaterThan(0);
    });

    it('對不存在的 uuid 回傳 null', () => {
      const detail = getMockArticleDetail('non-existent');
      expect(detail).toBeNull();
    });

    it('回傳的 detail 保留原始文章的所有欄位', () => {
      const detail = getMockArticleDetail('article-1');
      const base = allMockArticles[0];

      expect(detail!.uuid).toBe(base.uuid);
      expect(detail!.title).toBe(base.title);
      expect(detail!.summary).toBe(base.summary);
      expect(detail!.tags).toEqual(base.tags);
    });
  });
});
