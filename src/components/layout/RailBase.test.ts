import { mount } from '@vue/test-utils'
import { createTestRouter } from '../../test-utils'
import RailBase from './RailBase.vue'

const ITEMS = [
  { key: 'alpha', label: 'Alpha', to: '/alpha' },
  { key: 'beta', label: 'Beta', to: '/beta' },
  {
    key: 'tree',
    label: 'Tree',
    to: '/tree',
    children: [
      { id: 'child-a', label: 'Child A' },
      { id: 'child-b', label: 'Child B', danger: true },
    ],
  },
]

function mountRailBase(props: Record<string, unknown> = {}, initialRoute = '/alpha') {
  const router = createTestRouter(initialRoute)
  const wrapper = mount(RailBase, {
    props: { items: ITEMS, testIdPrefix: 'rail', ...props },
    global: { plugins: [router] },
  })
  return { wrapper, router }
}

describe('RailBase — presentational rail 基座', () => {
  it('渲染沒有子項的項目為連結，label 與 href 正確', () => {
    const { wrapper } = mountRailBase({ active: 'alpha' })
    const link = wrapper.get('[data-testid="rail-link-alpha"]')
    expect(link.text()).toBe('Alpha')
    expect(link.attributes('href')).toBe('/alpha')
  })

  it('active 項目帶 active class，其餘項目沒有', () => {
    const { wrapper } = mountRailBase({ active: 'alpha' })
    expect(wrapper.get('[data-testid="rail-link-alpha"]').classes()).toContain('active')
    expect(wrapper.get('[data-testid="rail-link-beta"]').classes()).not.toContain('active')
  })

  it('有子項的項目渲染為 toggle 按鈕，不出現一般連結', () => {
    const { wrapper } = mountRailBase({ active: 'alpha' })
    expect(wrapper.find('[data-testid="rail-toggle-tree"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="rail-link-tree"]').exists()).toBe(false)
  })

  it('active 對應到有子項的項目時，該分支預設展開', () => {
    const { wrapper } = mountRailBase({ active: 'tree' }, '/tree')
    const toggle = wrapper.get('[data-testid="rail-toggle-tree"]')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    const kids = wrapper.get('[data-testid="rail-tree-kids"]')
    expect((kids.element as HTMLElement).style.display).not.toBe('none')
  })

  it('active 是別的項目時，樹狀分支預設收合', () => {
    const { wrapper } = mountRailBase({ active: 'alpha' })
    const toggle = wrapper.get('[data-testid="rail-toggle-tree"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    const kids = wrapper.get('[data-testid="rail-tree-kids"]')
    expect((kids.element as HTMLElement).style.display).toBe('none')
  })

  it('點擊 toggle 可收合已展開的分支，再點一次可展開', async () => {
    const { wrapper } = mountRailBase({ active: 'tree' }, '/tree')
    const toggle = wrapper.get('[data-testid="rail-toggle-tree"]')
    expect(toggle.attributes('aria-expanded')).toBe('true')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
  })

  it('收合狀態下子項按鈕 tabindex=-1，避免鍵盤 Tab 到', async () => {
    const { wrapper } = mountRailBase({ active: 'tree' }, '/tree')
    await wrapper.get('[data-testid="rail-toggle-tree"]').trigger('click')
    const kidButtons = wrapper.findAll('[data-testid^="rail-kid-"]')
    for (const btn of kidButtons) {
      expect(btn.attributes('tabindex')).toBe('-1')
    }
  })

  it('點擊子項會 emit select-child 帶上該子項 id', async () => {
    const { wrapper } = mountRailBase({ active: 'tree' }, '/tree')
    await wrapper.get('[data-testid="rail-kid-child-b"]').trigger('click')
    expect(wrapper.emitted('select-child')?.[0]).toEqual(['child-b'])
  })

  it('activeChildId 對應的子項有 on class，其餘沒有', () => {
    const { wrapper } = mountRailBase({ active: 'tree', activeChildId: 'child-a' }, '/tree')
    expect(wrapper.get('[data-testid="rail-kid-child-a"]').classes()).toContain('on')
    expect(wrapper.get('[data-testid="rail-kid-child-b"]').classes()).not.toContain('on')
  })

  it('danger 子項帶 danger class', () => {
    const { wrapper } = mountRailBase({ active: 'tree' }, '/tree')
    expect(wrapper.get('[data-testid="rail-kid-child-b"]').classes()).toContain('danger')
    expect(wrapper.get('[data-testid="rail-kid-child-a"]').classes()).not.toContain('danger')
  })
})
