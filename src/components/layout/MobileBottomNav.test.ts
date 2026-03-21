import { mount } from '@vue/test-utils';
import { createTestRouter } from '../../test-utils';
import MobileBottomNav from './MobileBottomNav.vue';

describe('MobileBottomNav', () => {
  it('渲染 4 個 tab', async () => {
    const router = createTestRouter();
    await router.push('/');
    await router.isReady();

    const wrapper = mount(MobileBottomNav, {
      global: { plugins: [router] },
    });

    const tabs = wrapper.findAll('[data-testid="nav-tab"]');
    expect(tabs).toHaveLength(4);
  });

  it('顯示首頁、文章、搜尋、我的標籤文字', async () => {
    const router = createTestRouter();
    await router.push('/');
    await router.isReady();

    const wrapper = mount(MobileBottomNav, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain('首頁');
    expect(wrapper.text()).toContain('文章');
    expect(wrapper.text()).toContain('搜尋');
    expect(wrapper.text()).toContain('我的');
  });

  it('首頁路由時首頁 tab 為 active 狀態', async () => {
    const router = createTestRouter();
    await router.push('/');
    await router.isReady();

    const wrapper = mount(MobileBottomNav, {
      global: { plugins: [router] },
    });

    const tabs = wrapper.findAll('[data-testid="nav-tab"]');
    expect(tabs[0].classes()).toContain('text-[var(--accent-color)]');
  });

  it('文章列表路由時文章 tab 為 active 狀態', async () => {
    const router = createTestRouter();
    await router.push('/articles');
    await router.isReady();

    const wrapper = mount(MobileBottomNav, {
      global: { plugins: [router] },
    });

    const tabs = wrapper.findAll('[data-testid="nav-tab"]');
    expect(tabs[1].classes()).toContain('text-[var(--accent-color)]');
  });

  it('具備 fixed bottom-0 定位與 md:hidden', async () => {
    const router = createTestRouter();
    await router.push('/');
    await router.isReady();

    const wrapper = mount(MobileBottomNav, {
      global: { plugins: [router] },
    });

    expect(wrapper.classes()).toContain('fixed');
    expect(wrapper.classes()).toContain('bottom-0');
    expect(wrapper.classes()).toContain('md:hidden');
  });
});
