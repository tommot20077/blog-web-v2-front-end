import { mount } from '@vue/test-utils';
import PasswordStrengthMeter from './PasswordStrengthMeter.vue';

// C1「三分段」重寫：舊版靠 Tailwind class（h-1.5/bg-red-500/width）已死，
// 改為 scoped CSS 三段式軌道（.meter-c1__seg x3），依強度點亮 1/2/3 段。
// 斷言改為檢查「點亮的段數」與「顏色」，而非舊的 class 名稱與 width，
// 因為底層渲染結構已從單一連續進度條改為三段獨立軌道。
describe('PasswordStrengthMeter', () => {
  it('strength 為 null 時不渲染', () => {
    const wrapper = mount(PasswordStrengthMeter, {
      props: { strength: null },
    });
    expect(wrapper.find('[data-testid="password-strength"]').exists()).toBe(false);
  });

  it('strength 為 weak 時只點亮第一段（紅色）並顯示「弱」文字', () => {
    const wrapper = mount(PasswordStrengthMeter, {
      props: { strength: 'weak' },
    });
    const container = wrapper.find('[data-testid="password-strength"]');
    expect(container.exists()).toBe(true);

    const segs = wrapper.findAll('.meter-c1__seg');
    expect(segs).toHaveLength(3);
    expect(segs[0].attributes('style')).toContain('#b4453c');
    expect(segs[1].attributes('style')).toContain('var(--border)');
    expect(segs[2].attributes('style')).toContain('var(--border)');

    // strength-bar 為可見指示元素，對應恆亮的第一段
    const bar = wrapper.find('[data-testid="strength-bar"]');
    expect(bar.exists()).toBe(true);
    expect(bar.attributes('style')).toContain('#b4453c');

    expect(wrapper.find('[data-testid="strength-label"]').text()).toBe('弱');
  });

  it('strength 為 medium 時點亮前兩段（橘色）並顯示「中等」文字', () => {
    const wrapper = mount(PasswordStrengthMeter, {
      props: { strength: 'medium' },
    });
    const segs = wrapper.findAll('.meter-c1__seg');
    expect(segs[0].attributes('style')).toContain('#c08a3e');
    expect(segs[1].attributes('style')).toContain('#c08a3e');
    expect(segs[2].attributes('style')).toContain('var(--border)');

    expect(wrapper.find('[data-testid="strength-label"]').text()).toBe('中等');
  });

  it('strength 為 strong 時三段全亮（--ok 綠）並顯示「強」文字', () => {
    const wrapper = mount(PasswordStrengthMeter, {
      props: { strength: 'strong' },
    });
    const segs = wrapper.findAll('.meter-c1__seg');
    segs.forEach(seg => {
      expect(seg.attributes('style')).toContain('var(--ok)');
    });

    expect(wrapper.find('[data-testid="strength-label"]').text()).toBe('強');
  });
});
