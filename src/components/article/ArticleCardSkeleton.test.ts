import { mount } from '@vue/test-utils';
import ArticleCardSkeleton from './ArticleCardSkeleton.vue';

describe('ArticleCardSkeleton', () => {
  it('渲染具備 animate-pulse 的骨架容器', () => {
    const wrapper = mount(ArticleCardSkeleton);
    expect(wrapper.find('.animate-pulse').exists()).toBe(true);
  });

  it('包含圖片區塊骨架', () => {
    const wrapper = mount(ArticleCardSkeleton);
    // 圖片區塊應有 aspect-video 或類似的佔位
    expect(wrapper.find('[data-testid="skeleton-cover"]').exists()).toBe(true);
  });

  it('包含多條文字行骨架', () => {
    const wrapper = mount(ArticleCardSkeleton);
    const lines = wrapper.findAll('[data-testid="skeleton-line"]');
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('包含標籤佔位骨架', () => {
    const wrapper = mount(ArticleCardSkeleton);
    const tags = wrapper.findAll('[data-testid="skeleton-tag"]');
    expect(tags.length).toBeGreaterThanOrEqual(2);
  });

  it('外層使用 glass card 風格', () => {
    const wrapper = mount(ArticleCardSkeleton);
    expect(wrapper.classes()).toContain('rounded-[24px]');
    expect(wrapper.classes()).toContain('border');
  });
});
