import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import HotTagsSection from './HotTagsSection.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
});

const mockTags = [
  { uuid: 't-1', name: 'Vue', slug: 'vue', articleCount: 18 },
  { uuid: 't-2', name: 'React', slug: 'react', articleCount: 12 },
  { uuid: 't-3', name: 'TypeScript', slug: 'typescript', articleCount: 15 },
];

describe('HotTagsSection', () => {
  it('renders root with data-testid="hot-tags-root"', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="hot-tags-root"]').exists()).toBe(true);
  });

  it('renders heading with data-testid="hot-tags-heading"', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="hot-tags-heading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="hot-tags-heading"]').text()).toBe('Hot Tags');
  });

  it('renders each tag with data-testid="hot-tag-{index}"', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="hot-tag-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="hot-tag-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="hot-tag-2"]').exists()).toBe(true);
  });

  it('each tag pill displays the tag name', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="hot-tag-0"]').text()).toContain('Vue');
    expect(wrapper.find('[data-testid="hot-tag-1"]').text()).toContain('React');
    expect(wrapper.find('[data-testid="hot-tag-2"]').text()).toContain('TypeScript');
  });

  it('each tag pill displays the article count', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="hot-tag-0"]').text()).toContain('18');
    expect(wrapper.find('[data-testid="hot-tag-1"]').text()).toContain('12');
  });

  it('each tag pill links to /articles?tag={name}', () => {
    const wrapper = mount(HotTagsSection, {
      props: { tags: mockTags, isLoading: false },
      global: { plugins: [router] },
    });
    const firstLink = wrapper.find('[data-testid="hot-tag-0"]').element.closest('a');
    expect(firstLink?.getAttribute('href')).toContain('Vue');
  });
});
