import { mount } from '@vue/test-utils';
import AppFooter from './AppFooter.vue';

describe('AppFooter', () => {
  it('渲染 copyright 文字包含年份', () => {
    const wrapper = mount(AppFooter);
    expect(wrapper.text()).toContain('2026');
    expect(wrapper.text()).toContain('MY BLOG WEB');
  });

  it('渲染 GitHub 連結且為新分頁開啟', () => {
    const wrapper = mount(AppFooter);
    const link = wrapper.find('a[href*="github"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toContain('noopener');
  });

  it('使用 footer 語意標籤', () => {
    const wrapper = mount(AppFooter);
    expect(wrapper.element.tagName).toBe('FOOTER');
  });
});
