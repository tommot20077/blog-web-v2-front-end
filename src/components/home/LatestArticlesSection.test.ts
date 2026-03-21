import { mount } from '@vue/test-utils';
import LatestArticlesSection from './LatestArticlesSection.vue';
import { createTestRouter, createMockArticle } from '../../test-utils';

describe('LatestArticlesSection', () => {
  it('顯示標題「最新發布」和「查看全部文章」連結', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain('最新發布');
    expect(wrapper.text()).toContain('查看全部文章');
  });

  it('isLoading 時顯示骨架屏', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: true },
      global: { plugins: [router] },
    });
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('載入完成後渲染文章卡片', async () => {
    const router = createTestRouter();
    await router.isReady();
    const articles = [
      createMockArticle({ uuid: 'a-1', title: '文章一' }),
      createMockArticle({ uuid: 'a-2', title: '文章二' }),
    ];
    const wrapper = mount(LatestArticlesSection, {
      props: { articles, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain('文章一');
    expect(wrapper.text()).toContain('文章二');
  });
});
