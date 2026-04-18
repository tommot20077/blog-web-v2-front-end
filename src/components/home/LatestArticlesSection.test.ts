import { mount } from '@vue/test-utils';
import LatestArticlesSection from './LatestArticlesSection.vue';
import { createTestRouter, createMockArticle } from '../../test-utils';

describe('LatestArticlesSection', () => {
  it('renders latest-root and latest-heading', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="latest-root"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-heading"]').exists()).toBe(true);
  });

  it('isLoading 時顯示骨架屏', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: true },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="latest-root"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-card-lead"]').exists()).toBe(false);
  });

  it('renders lead card and secondary cards when articles provided', async () => {
    const router = createTestRouter();
    await router.isReady();
    const articles = [
      createMockArticle({ uuid: 'a-0', title: '首篇文章' }),
      createMockArticle({ uuid: 'a-1', title: '文章一' }),
      createMockArticle({ uuid: 'a-2', title: '文章二' }),
      createMockArticle({ uuid: 'a-3', title: '文章三' }),
      createMockArticle({ uuid: 'a-4', title: '文章四' }),
    ];
    const wrapper = mount(LatestArticlesSection, {
      props: { articles, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="latest-card-lead"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-card-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-card-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-card-2"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-card-3"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('首篇文章');
    expect(wrapper.text()).toContain('文章一');
  });
});
