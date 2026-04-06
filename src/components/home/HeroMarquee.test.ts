import { mount } from '@vue/test-utils';
import HeroMarquee from './HeroMarquee.vue';

describe('HeroMarquee', () => {
  it('跑馬燈區塊不包含語義 h1 標籤', () => {
    const wrapper = mount(HeroMarquee);
    expect(wrapper.find('h1').exists()).toBe(false);
  });

  it('裝飾性跑馬燈文字仍然存在', () => {
    const wrapper = mount(HeroMarquee);
    expect(wrapper.text()).toContain('Animated Text Effects');
  });

  it('跑馬燈容器帶有 aria-hidden 屬性以排除無障礙樹', () => {
    const wrapper = mount(HeroMarquee);
    const decorative = wrapper.find('[aria-hidden="true"]');
    expect(decorative.exists()).toBe(true);
  });
});
