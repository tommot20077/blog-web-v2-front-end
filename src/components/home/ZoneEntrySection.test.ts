import { mount } from '@vue/test-utils';
import ZoneEntrySection from './ZoneEntrySection.vue';
import type { ZoneEntry } from '../../api/mock/data';

const mockZones: ZoneEntry[] = [
  { slug: 'tech', name: '技術', description: '技術文章', iconName: 'code', articleCount: 35, coverImageUrl: 'https://example.com/tech.jpg' },
  { slug: 'travel', name: '旅遊', description: '旅行記錄', iconName: 'globe', articleCount: 12, coverImageUrl: 'https://example.com/travel.jpg' },
  { slug: 'photography', name: '攝影', description: '攝影作品', iconName: 'camera', articleCount: 8, coverImageUrl: 'https://example.com/photo.jpg' },
];

describe('ZoneEntrySection', () => {
  it('顯示標題「主題專區」', () => {
    const wrapper = mount(ZoneEntrySection, { props: { zones: mockZones } });
    expect(wrapper.text()).toContain('主題專區');
  });

  it('渲染 3 張專區卡片', () => {
    const wrapper = mount(ZoneEntrySection, { props: { zones: mockZones } });
    expect(wrapper.text()).toContain('技術');
    expect(wrapper.text()).toContain('旅遊');
    expect(wrapper.text()).toContain('攝影');
  });

  it('每張卡片顯示文章數量', () => {
    const wrapper = mount(ZoneEntrySection, { props: { zones: mockZones } });
    expect(wrapper.text()).toContain('35 篇文章');
    expect(wrapper.text()).toContain('12 篇文章');
  });
});
