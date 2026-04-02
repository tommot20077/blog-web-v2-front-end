import { mount } from '@vue/test-utils';
import HotTagsSection from './HotTagsSection.vue';

const mockTags = [
  { uuid: 't-1', name: 'Vue', slug: 'vue', articleCount: 18 },
  { uuid: 't-2', name: 'React', slug: 'react', articleCount: 12 },
  { uuid: 't-3', name: 'TypeScript', slug: 'typescript', articleCount: 15 },
];

describe('HotTagsSection', () => {
  it('顯示標題「熱門標籤」', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
    });
    expect(wrapper.text()).toContain('熱門標籤');
  });

  it('渲染標籤名稱', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
    });
    expect(wrapper.text()).toContain('Vue');
    expect(wrapper.text()).toContain('React');
    expect(wrapper.text()).toContain('TypeScript');
  });

  it('isLoading 時顯示骨架屏', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: [], isLoading: true },
    });
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
