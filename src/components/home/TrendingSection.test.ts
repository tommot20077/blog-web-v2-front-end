import { mount } from '@vue/test-utils';
import TrendingSection from './TrendingSection.vue';
import { createTestRouter } from '../../test-utils';

describe('TrendingSection', () => {
  const mockArticles = [
    { uuid: 'r-1', title: '熱門文章 1', slug: 'hot-1', summary: '摘要', coverImageUrl: null, authorNickname: 'Yuan', viewCount: 500, likeCount: 50, publishedAt: '2026-03-01', tags: ['Vue'] },
    { uuid: 'r-2', title: '熱門文章 2', slug: 'hot-2', summary: '摘要', coverImageUrl: 'https://example.com/img.jpg', authorNickname: 'Test', viewCount: 300, likeCount: 30, publishedAt: '2026-03-02', tags: ['React'] },
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
    expect(wrapper.text()).toContain('熱門文章 1');
    expect(wrapper.text()).toContain('熱門文章 2');
  });

  it('顯示區塊標題「熱門文章」', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(TrendingSection, {
      props: { articles: [], isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain('熱門文章');
  });
});
