import { mount } from '@vue/test-utils';
import SkeletonLine from './SkeletonLine.vue';

describe('SkeletonLine', () => {
  it('渲染預設尺寸的骨架行', () => {
    const wrapper = mount(SkeletonLine);
    const el = wrapper.element as HTMLElement;
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('1rem');
  });

  it('接受自訂 width 和 height', () => {
    const wrapper = mount(SkeletonLine, {
      props: { width: '60%', height: '0.75rem' },
    });
    const el = wrapper.element as HTMLElement;
    expect(el.style.width).toBe('60%');
    expect(el.style.height).toBe('0.75rem');
  });

  it('具備圓角與 skeleton 背景色', () => {
    const wrapper = mount(SkeletonLine);
    expect(wrapper.classes()).toContain('rounded-md');
  });
});
