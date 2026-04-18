import { mount } from '@vue/test-utils';
import TrendingSection from './TrendingSection.vue';
import { createTestRouter } from '../../test-utils';

describe('TrendingSection', () => {
  const mockArticles = [
    { uuid: 'r-1', title: '熱門文章 1', slug: 'hot-1', summary: '摘要', coverImageUrl: null, authorNickname: 'Yuan', viewCount: 500, likeCount: 50, publishedAt: '2026-03-01', tags: ['Vue'] },
    { uuid: 'r-2', title: '熱門文章 2', slug: 'hot-2', summary: '摘要', coverImageUrl: 'https://example.com/img.jpg', authorNickname: 'Test', viewCount: 300, likeCount: 30, publishedAt: '2026-03-02', tags: ['React'] },
    { uuid: 'r-3', title: '熱門文章 3', slug: 'hot-3', summary: '摘要', coverImageUrl: null, authorNickname: 'Admin', viewCount: 200, likeCount: 20, publishedAt: '2026-03-03', tags: ['TypeScript'] },
  ];

  it('isLoading 時顯示骨架屏', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(TrendingSection, {
      props: { articles: [], isLoading: true },
      global: { plugins: [router] },
    });
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('載入完成後顯示文章卡片', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(TrendingSection, {
      props: { articles: mockArticles, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="trending-card-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="trending-card-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="trending-card-2"]').exists()).toBe(true);
  });

  it('顯示區塊標題', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(TrendingSection, {
      props: { articles: [], isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="trending-heading"]').exists()).toBe(true);
  });

  it('根元素有正確的 data-testid', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(TrendingSection, {
      props: { articles: mockArticles, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="trending-root"]').exists()).toBe(true);
  });
});
