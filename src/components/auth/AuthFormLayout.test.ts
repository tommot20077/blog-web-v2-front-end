import { mount } from '@vue/test-utils';
import AuthFormLayout from './AuthFormLayout.vue';

describe('AuthFormLayout', () => {
  it('渲染標題', () => {
    const wrapper = mount(AuthFormLayout, {
      props: { title: '登入' },
    });
    expect(wrapper.find('h1').text()).toBe('登入');
  });

  it('當 subtitle 有值時渲染副標題', () => {
    const wrapper = mount(AuthFormLayout, {
      props: { title: '登入', subtitle: '歡迎回來' },
    });
    const subtitle = wrapper.find('[data-testid="auth-subtitle"]');
    expect(subtitle.exists()).toBe(true);
    expect(subtitle.text()).toBe('歡迎回來');
  });

  it('當未提供 subtitle 時不渲染副標題元素', () => {
    const wrapper = mount(AuthFormLayout, {
      props: { title: '登入' },
    });
    expect(wrapper.find('[data-testid="auth-subtitle"]').exists()).toBe(false);
  });

  it('渲染 default slot 內容', () => {
    const wrapper = mount(AuthFormLayout, {
      props: { title: '登入' },
      slots: { default: '<form data-testid="test-form">表單內容</form>' },
    });
    expect(wrapper.find('[data-testid="test-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="test-form"]').text()).toBe('表單內容');
  });

  it('渲染 footer slot 內容', () => {
    const wrapper = mount(AuthFormLayout, {
      props: { title: '登入' },
      slots: { footer: '<a data-testid="test-link" href="/register">還沒有帳號？</a>' },
    });
    expect(wrapper.find('[data-testid="test-link"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="test-link"]').text()).toBe('還沒有帳號？');
  });
});
