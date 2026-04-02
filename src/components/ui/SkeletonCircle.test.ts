import { mount } from '@vue/test-utils';
import SkeletonCircle from './SkeletonCircle.vue';

describe('SkeletonCircle', () => {
  it('渲染預設尺寸的圓形骨架', () => {
    const wrapper = mount(SkeletonCircle);
    const el = wrapper.element as HTMLElement;
    expect(el.style.width).toBe('2.5rem');
    expect(el.style.height).toBe('2.5rem');
  });

  it('接受自訂尺寸', () => {
    const wrapper = mount(SkeletonCircle, {
      props: { size: '3rem' },
    });
    const el = wrapper.element as HTMLElement;
    expect(el.style.width).toBe('3rem');
    expect(el.style.height).toBe('3rem');
  });

  it('具備圓形形狀', () => {
    const wrapper = mount(SkeletonCircle);
    expect(wrapper.classes()).toContain('rounded-full');
  });
});
