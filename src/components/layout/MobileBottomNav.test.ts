import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createTestRouter } from '../../test-utils';
import { useAuthStore } from '../../stores/auth';
import MobileBottomNav from './MobileBottomNav.vue';

function mountWithPlugins(initialRoute = '/') {
  const router = createTestRouter(initialRoute);
  const pinia = createPinia();
  const wrapper = mount(MobileBottomNav, {
    global: { plugins: [router, pinia] },
  });
  return { wrapper, router, pinia };
}

describe('MobileBottomNav', () => {
  it('渲染 4 個 tab', () => {
    const { wrapper } = mountWithPlugins();
    const tabs = wrapper.findAll('[data-testid="nav-tab"]');
    expect(tabs).toHaveLength(4);
  });

  it('顯示首頁、文章、搜尋、我的標籤文字', () => {
    const { wrapper } = mountWithPlugins();
    expect(wrapper.text()).toContain('首頁');
    expect(wrapper.text()).toContain('文章');
    expect(wrapper.text()).toContain('搜尋');
    expect(wrapper.text()).toContain('我的');
  });

  it('首頁路由時首頁 tab 為 active 狀態', async () => {
    const { wrapper, router } = mountWithPlugins();
    await router.push('/');
    await router.isReady();
    const tabs = wrapper.findAll('[data-testid="nav-tab"]');
    expect(tabs[0].classes()).toContain('text-[var(--accent-color)]');
  });

  it('文章列表路由時文章 tab 為 active 狀態', async () => {
    const { wrapper, router } = mountWithPlugins();
    await router.push('/articles');
    await router.isReady();
    const tabs = wrapper.findAll('[data-testid="nav-tab"]');
    expect(tabs[1].classes()).toContain('text-[var(--accent-color)]');
  });

  it('具備 fixed bottom-0 定位與 md:hidden', () => {
    const { wrapper } = mountWithPlugins();
    expect(wrapper.classes()).toContain('fixed');
    expect(wrapper.classes()).toContain('bottom-0');
    expect(wrapper.classes()).toContain('md:hidden');
  });

  it('包含主題切換按鈕（ThemeSwitcher）', () => {
    const { wrapper } = mountWithPlugins();
    const themeBtn = wrapper.find('[aria-label="切換深淺色模式"]');
    expect(themeBtn.exists()).toBe(true);
  });

  describe('我的 tab Auth-Aware', () => {
    it('未登入時點擊「我的」導航至 /login', async () => {
      const { wrapper, router } = mountWithPlugins();
      await router.isReady();
      const tabs = wrapper.findAll('[data-testid="nav-tab"]');
      const profileTab = tabs[3]; // 我的 is 4th tab
      await profileTab.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/login');
    });

    it('已登入時點擊「我的」導航至 /my-articles', async () => {
      const { wrapper, router } = mountWithPlugins('/articles');
      await router.isReady();
      const authStore = useAuthStore();
      authStore.accessToken = 'test-token';
      const tabs = wrapper.findAll('[data-testid="nav-tab"]');
      const profileTab = tabs[3];
      await profileTab.trigger('click');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/my-articles');
    });
  });
});
