import { mount } from '@vue/test-utils';
import SkeletonPulse from './SkeletonPulse.vue';

describe('SkeletonPulse', () => {
  it('渲染具備 animate-pulse class 的容器', () => {
    const wrapper = mount(SkeletonPulse);
    expect(wrapper.classes()).toContain('animate-pulse');
  });

  it('渲染預設 slot 內容', () => {
    const wrapper = mount(SkeletonPulse, {
      slots: { default: '<div class="child">test</div>' },
    });
    expect(wrapper.find('.child').exists()).toBe(true);
  });
});
