import { mount } from '@vue/test-utils';
import PasswordStrengthMeter from './PasswordStrengthMeter.vue';

describe('PasswordStrengthMeter', () => {
  it('strength 為 null 時不渲染', () => {
    const wrapper = mount(PasswordStrengthMeter, {
      props: { strength: null },
    });
    expect(wrapper.find('[data-testid="password-strength"]').exists()).toBe(false);
  });

  it('strength 為 weak 時顯示紅色條與「弱」文字', () => {
    const wrapper = mount(PasswordStrengthMeter, {
      props: { strength: 'weak' },
    });
    const container = wrapper.find('[data-testid="password-strength"]');
    expect(container.exists()).toBe(true);

    const bar = wrapper.find('[data-testid="strength-bar"]');
    expect(bar.classes()).toContain('bg-red-500');
    expect(bar.attributes('style')).toContain('width: 33%');

    expect(wrapper.find('[data-testid="strength-label"]').text()).toBe('弱');
  });

  it('strength 為 medium 時顯示橘色條與「中等」文字', () => {
    const wrapper = mount(PasswordStrengthMeter, {
      props: { strength: 'medium' },
    });
    const bar = wrapper.find('[data-testid="strength-bar"]');
    expect(bar.classes()).toContain('bg-orange-400');
    expect(bar.attributes('style')).toContain('width: 66%');

    expect(wrapper.find('[data-testid="strength-label"]').text()).toBe('中等');
  });

  it('strength 為 strong 時顯示綠色條與「強」文字', () => {
    const wrapper = mount(PasswordStrengthMeter, {
      props: { strength: 'strong' },
    });
    const bar = wrapper.find('[data-testid="strength-bar"]');
    expect(bar.classes()).toContain('bg-green-500');
    expect(bar.attributes('style')).toContain('width: 100%');

    expect(wrapper.find('[data-testid="strength-label"]').text()).toBe('強');
  });
});
