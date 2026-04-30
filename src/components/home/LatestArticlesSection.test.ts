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

  it('latest-heading 文字為設計師版本', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="latest-heading"]').text()).toBe('最近在寫的東西。');
  });

  it('isLoading 時顯示 .sk-pulse 骨架屏', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: true },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="latest-root"]').exists()).toBe(true);
    expect(wrapper.find('.sk-pulse').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-card-0"]').exists()).toBe(false);
  });

  it('isLoading 時不顯示 .animate-pulse（舊骨架屏）', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: true },
      global: { plugins: [router] },
    });
    expect(wrapper.find('.animate-pulse').exists()).toBe(false);
  });

  it('存在 .latest-grid 容器', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('.latest-grid').exists()).toBe(true);
  });

  it('renders articles as .l-card with correct data-testid', async () => {
    const router = createTestRouter();
    await router.isReady();
    const articles = [
      createMockArticle({ uuid: 'a-0', title: '文章零' }),
      createMockArticle({ uuid: 'a-1', title: '文章一' }),
      createMockArticle({ uuid: 'a-2', title: '文章二' }),
    ];
    const wrapper = mount(LatestArticlesSection, {
      props: { articles, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="latest-card-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-card-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="latest-card-2"]').exists()).toBe(true);
    // 每張卡片都有 .l-card class
    expect(wrapper.find('[data-testid="latest-card-0"]').classes()).toContain('l-card');
    expect(wrapper.find('[data-testid="latest-card-1"]').classes()).toContain('l-card');
  });

  it('卡片顯示文章標題與摘要', async () => {
    const router = createTestRouter();
    await router.isReady();
    const articles = [
      createMockArticle({ uuid: 'a-0', title: '首篇文章', summary: '這是摘要' }),
      createMockArticle({ uuid: 'a-1', title: '第二篇' }),
    ];
    const wrapper = mount(LatestArticlesSection, {
      props: { articles, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.text()).toContain('首篇文章');
    expect(wrapper.text()).toContain('這是摘要');
    expect(wrapper.text()).toContain('第二篇');
  });

  // 保留舊測試（lead card 已移除，改用 index 模式）
  it('isLoading 時不顯示 latest-card-lead', async () => {
    const router = createTestRouter();
    await router.isReady();
    const wrapper = mount(LatestArticlesSection, {
      props: { articles: [], isLoading: true },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="latest-card-lead"]').exists()).toBe(false);
  });
});
