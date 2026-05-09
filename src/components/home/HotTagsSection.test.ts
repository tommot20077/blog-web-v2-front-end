import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import HotTagsSection from './HotTagsSection.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
});

const mockTags = [
  { uuid: '1', name: 'Vue', slug: 'vue', articleCount: 18 },
  { uuid: '2', name: 'React', slug: 'react', articleCount: 12 },
  { uuid: '3', name: 'TypeScript', slug: 'typescript', articleCount: 15 },
];

describe('HotTagsSection', () => {
  it('renders root with data-testid="hot-tags-root"', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="hot-tags-root"]').exists()).toBe(true);
  });

  it('renders heading with data-testid="tags-heading" 且文字為設計師版本', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="tags-heading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tags-heading"]').text()).toBe('依主題瀏覽。');
  });

  it('存在 .tags-cloud 容器', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('.tags-cloud').exists()).toBe(true);
  });

  it('renders each tag with data-testid="tag-pill-{index}" and .tag-pill class', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="tag-pill-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tag-pill-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tag-pill-2"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tag-pill-0"]').classes()).toContain('tag-pill');
    expect(wrapper.find('[data-testid="tag-pill-1"]').classes()).toContain('tag-pill');
  });

  it('each tag pill displays the tag name', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="tag-pill-0"]').text()).toContain('Vue');
    expect(wrapper.find('[data-testid="tag-pill-1"]').text()).toContain('React');
    expect(wrapper.find('[data-testid="tag-pill-2"]').text()).toContain('TypeScript');
  });

  it('each tag pill displays the count', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="tag-pill-0"]').text()).toContain('18');
    expect(wrapper.find('[data-testid="tag-pill-1"]').text()).toContain('12');
  });

  it('isLoading 時顯示 .sk-pulse', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: [], isLoading: true },
      global: { plugins: [router] },
    });
    expect(wrapper.find('.sk-pulse').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tag-pill-0"]').exists()).toBe(false);
  });

  it('顯示 totalTopics 和 totalPosts 統計', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    // 3 topics, 18+12+15=45 posts
    expect(wrapper.text()).toContain('3 topics');
    expect(wrapper.text()).toContain('45 posts');
  });
});
