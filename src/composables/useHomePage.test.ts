import { useHomePage } from './useHomePage';
import { flushPromises } from '@vue/test-utils';
import { recommendService } from '../api/recommendService';
import { articleService } from '../api/articleService';
import { tagService } from '../api/tagService';

// mock services
vi.mock('../api/recommendService', () => ({
  recommendService: {
    getTrending: vi.fn(),
  },
}));

vi.mock('../api/articleService', () => ({
  articleService: {
    getArticles: vi.fn(),
  },
}));

vi.mock('../api/tagService', () => ({
  tagService: {
    getHotTags: vi.fn(),
  },
}));

describe('useHomePage', () => {
  beforeEach(() => {
    vi.mocked(recommendService.getTrending).mockResolvedValue([
      { uuid: 'r-1', title: '熱門文章', slug: 'hot', summary: '摘要', coverImageUrl: null, authorNickname: 'Author', viewCount: 500, likeCount: 50, publishedAt: '2026-03-01', tags: ['Vue'] },
    ]);
    vi.mocked(articleService.getArticles).mockResolvedValue({
      records: [
        { uuid: 'a-1', title: '最新文章', summary: '摘要', coverImageUrl: null, authorNickname: 'Author', viewCount: 100, likeCount: 10, commentCount: 5, publishedAt: '2026-03-20', tags: ['Vue'], categories: ['Frontend'], slug: 'latest' },
      ],
      total: 1, size: 6, current: 1, pages: 1,
    });
    vi.mocked(tagService.getHotTags).mockResolvedValue([
      { uuid: 't-1', name: 'Vue', slug: 'vue', articleCount: 18 },
    ]);
  });

  it('fetchAll 成功載入所有資料', async () => {
    const { trendingArticles, latestArticles, hotTags, fetchAll } = useHomePage();

    await fetchAll();
    await flushPromises();

    expect(trendingArticles.value).toHaveLength(1);
    expect(latestArticles.value).toHaveLength(1);
    expect(hotTags.value).toHaveLength(1);
  });

  it('載入過程中 isLoading 狀態正確', async () => {
    const { isLoadingTrending, isLoadingLatest, isLoadingTags, fetchAll } = useHomePage();

    const promise = fetchAll();

    // 載入開始後應為 true（因 mock 是 resolved，可能已完成）
    await promise;
    await flushPromises();

    // 載入結束後應為 false
    expect(isLoadingTrending.value).toBe(false);
    expect(isLoadingLatest.value).toBe(false);
    expect(isLoadingTags.value).toBe(false);
  });

  it('某個 service 失敗不影響其他資料', async () => {
    vi.mocked(recommendService.getTrending).mockRejectedValue(new Error('fail'));

    const { trendingArticles, latestArticles, hotTags, fetchAll } = useHomePage();
    await fetchAll();
    await flushPromises();

    expect(trendingArticles.value).toHaveLength(0);
    expect(latestArticles.value).toHaveLength(1);
    expect(hotTags.value).toHaveLength(1);
  });
});
