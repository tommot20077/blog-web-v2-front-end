import { mount } from '@vue/test-utils';
import HeroMarquee from './HeroMarquee.vue';

describe('HeroMarquee', () => {
  it('renders the hero root section with correct testid', () => {
    const wrapper = mount(HeroMarquee);
    expect(wrapper.find('[data-testid="hero-root"]').exists()).toBe(true);
  });

  it('renders the hero title with correct testid', () => {
    const wrapper = mount(HeroMarquee);
    expect(wrapper.find('[data-testid="hero-title"]').exists()).toBe(true);
  });

  it('renders the marquee track with correct testid', () => {
    const wrapper = mount(HeroMarquee);
    expect(wrapper.find('[data-testid="hero-marquee-track"]').exists()).toBe(true);
  });

  it('hero title is an h1 element', () => {
    const wrapper = mount(HeroMarquee);
    expect(wrapper.find('[data-testid="hero-title"]').element.tagName).toBe('H1');
  });

  it('marquee track is excluded from accessibility tree', () => {
    const wrapper = mount(HeroMarquee);
    const marquee = wrapper.find('[data-testid="hero-marquee-track"]');
    expect(marquee.attributes('aria-hidden')).toBe('true');
  });
});
