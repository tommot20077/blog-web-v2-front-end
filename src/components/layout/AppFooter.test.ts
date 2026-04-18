import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppFooter from './AppFooter.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/articles', component: { template: '<div />' } },
  ],
});

describe('AppFooter', () => {
  it('renders footer root with correct testid', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } });
    await router.isReady();
    expect(wrapper.find('[data-testid="footer-root"]').exists()).toBe(true);
  });

  it('renders all 4 columns', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } });
    await router.isReady();
    expect(wrapper.find('[data-testid="footer-col-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="footer-col-2"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="footer-col-3"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="footer-col-4"]').exists()).toBe(true);
  });

  it('renders copyright with correct testid', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } });
    await router.isReady();
    const copy = wrapper.find('[data-testid="footer-copyright"]');
    expect(copy.exists()).toBe(true);
    expect(copy.text()).toContain('2025');
    expect(copy.text()).toContain('Vue');
  });

  it('col-1 contains brand name and tagline', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } });
    await router.isReady();
    const col = wrapper.find('[data-testid="footer-col-1"]');
    expect(col.text()).toContain('TomCC');
    expect(col.text()).toContain('ideas');
  });

  it('col-2 Explore links point to / and /articles', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } });
    await router.isReady();
    const col = wrapper.find('[data-testid="footer-col-2"]');
    expect(col.text()).toContain('Explore');
    const links = col.findAll('a');
    const hrefs = links.map(l => l.attributes('href'));
    expect(hrefs.some(h => h === '/')).toBe(true);
    expect(hrefs.some(h => h === '/articles')).toBe(true);
  });

  it('col-3 Connect has external social links with noopener', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } });
    await router.isReady();
    const col = wrapper.find('[data-testid="footer-col-3"]');
    expect(col.text()).toContain('Connect');
    const externalLinks = col.findAll('a[target="_blank"]');
    expect(externalLinks.length).toBeGreaterThan(0);
    externalLinks.forEach(link => {
      expect(link.attributes('rel')).toContain('noopener');
    });
  });

  it('col-4 Legal contains privacy and terms links', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } });
    await router.isReady();
    const col = wrapper.find('[data-testid="footer-col-4"]');
    expect(col.text()).toContain('Legal');
    expect(col.text().toLowerCase()).toMatch(/privacy|terms/i);
  });

  it('uses footer semantic tag', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } });
    await router.isReady();
    expect(wrapper.element.tagName).toBe('FOOTER');
  });
});
