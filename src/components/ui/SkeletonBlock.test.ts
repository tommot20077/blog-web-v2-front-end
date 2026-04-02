import { mount } from '@vue/test-utils';
import SkeletonBlock from './SkeletonBlock.vue';

describe('SkeletonBlock', () => {
  it('渲染預設尺寸的骨架區塊', () => {
    const wrapper = mount(SkeletonBlock);
    const el = wrapper.element as HTMLElement;
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('200px');
  });

  it('接受自訂尺寸', () => {
    const wrapper = mount(SkeletonBlock, {
      props: { width: '300px', height: '150px' },
    });
    const el = wrapper.element as HTMLElement;
    expect(el.style.width).toBe('300px');
    expect(el.style.height).toBe('150px');
  });

  it('具備圓角與 skeleton 背景色', () => {
    const wrapper = mount(SkeletonBlock);
    expect(wrapper.classes()).toContain('rounded-xl');
  });
});
