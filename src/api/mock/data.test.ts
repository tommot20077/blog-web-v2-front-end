import { allMockArticles, getMockArticleDetail, allMockTags, mockZoneEntries } from './data';

describe('Mock 種子資料', () => {
  describe('allMockArticles', () => {
    it('應有 50 筆文章', () => {
      expect(allMockArticles).toHaveLength(50);
    });

    it('每筆文章包含所有必要欄位', () => {
      for (const article of allMockArticles) {
        expect(article).toHaveProperty('uuid');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('summary');
        expect(article).toHaveProperty('coverImageUrl');
        expect(article).toHaveProperty('authorNickname');
        expect(article).toHaveProperty('viewCount');
        expect(article).toHaveProperty('likeCount');
        expect(article).toHaveProperty('commentCount');
        expect(article).toHaveProperty('publishedAt');
        expect(article).toHaveProperty('tags');
        expect(article).toHaveProperty('categories');
        expect(article).toHaveProperty('slug');
      }
    });

    it('coverImageUrl 為非空字串', () => {
      for (const article of allMockArticles) {
        expect(typeof article.coverImageUrl).toBe('string');
        expect((article.coverImageUrl as string).length).toBeGreaterThan(0);
      }
    });

    it('authorNickname 為非空字串', () => {
      for (const article of allMockArticles) {
        expect(typeof article.authorNickname).toBe('string');
        expect(article.authorNickname.length).toBeGreaterThan(0);
      }
    });

    it('likeCount 和 commentCount 為非負數字', () => {
      for (const article of allMockArticles) {
        expect(article.likeCount).toBeGreaterThanOrEqual(0);
        expect(article.commentCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('categories 為非空陣列', () => {
      for (const article of allMockArticles) {
        expect(Array.isArray(article.categories)).toBe(true);
        expect(article.categories.length).toBeGreaterThan(0);
      }
    });

    it('slug 為非空字串', () => {
      for (const article of allMockArticles) {
        expect(typeof article.slug).toBe('string');
        expect(article.slug.length).toBeGreaterThan(0);
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
      expect(detail!.coverImageUrl).toBe(base.coverImageUrl);
      expect(detail!.authorNickname).toBe(base.authorNickname);
    });
  });

  describe('allMockTags', () => {
    it('應有 20 個標籤', () => {
      expect(allMockTags).toHaveLength(20);
    });

    it('每個標籤包含必要欄位', () => {
      for (const tag of allMockTags) {
        expect(tag).toHaveProperty('uuid');
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('slug');
        expect(tag).toHaveProperty('articleCount');
        expect(tag.articleCount).toBeGreaterThan(0);
      }
    });
  });

  describe('mockZoneEntries', () => {
    it('應有 3 個主題專區', () => {
      expect(mockZoneEntries).toHaveLength(3);
    });

    it('包含技術、旅遊、攝影三個專區', () => {
      const slugs = mockZoneEntries.map(z => z.slug);
      expect(slugs).toContain('tech');
      expect(slugs).toContain('travel');
      expect(slugs).toContain('photography');
    });

    it('每個專區包含必要欄位', () => {
      for (const zone of mockZoneEntries) {
        expect(zone).toHaveProperty('slug');
        expect(zone).toHaveProperty('name');
        expect(zone).toHaveProperty('description');
        expect(zone).toHaveProperty('iconName');
        expect(zone).toHaveProperty('articleCount');
        expect(zone).toHaveProperty('coverImageUrl');
      }
    });
  });
});
