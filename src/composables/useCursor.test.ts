import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

describe('useCursor', () => {
  const mountWithCursor = async () => {
    vi.resetModules()
    const { useCursor } = await import('./useCursor')
    const Wrapper = defineComponent({
      setup() { useCursor(); return {} },
      template: '<div></div>',
    })
    return mount(Wrapper, { attachTo: document.body })
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('mount 時在 body 插入 .cursor-dot 和 .cursor-ring 元素', async () => {
    await mountWithCursor()
    expect(document.querySelector('.cursor-dot')).not.toBeNull()
    expect(document.querySelector('.cursor-ring')).not.toBeNull()
  })

  it('mousemove 時 cursor-dot 的 transform 更新為滑鼠座標', async () => {
    await mountWithCursor()
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }))
    const dot = document.querySelector<HTMLElement>('.cursor-dot')
    expect(dot?.style.transform).toContain('100')
    expect(dot?.style.transform).toContain('200')
  })

  it('滑鼠移到 [data-hover] 元素上時 cursor-ring 加上 .hover class', async () => {
    await mountWithCursor()
    const link = document.createElement('a')
    link.setAttribute('data-hover', 'true')
    document.body.appendChild(link)

    link.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

    const ring = document.querySelector<HTMLElement>('.cursor-ring')
    expect(ring?.classList.contains('hover')).toBe(true)
  })

  it('滑鼠離開 [data-hover] 後 .hover class 被移除', async () => {
    await mountWithCursor()
    const link = document.createElement('a')
    link.setAttribute('data-hover', 'true')
    document.body.appendChild(link)

    link.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    link.dispatchEvent(new MouseEvent('mouseout',  { bubbles: true }))

    const ring = document.querySelector<HTMLElement>('.cursor-ring')
    expect(ring?.classList.contains('hover')).toBe(false)
  })

  it('unmount 時移除 mousemove 監聽器', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = await mountWithCursor()
    await wrapper.unmount()
    const calls = removeSpy.mock.calls.filter(([ev]) => ev === 'mousemove')
    expect(calls.length).toBeGreaterThanOrEqual(1)
  })

  it('data-cursor="off" 時不插入游標 DOM 節點', async () => {
    document.documentElement.dataset.cursor = 'off'
    await mountWithCursor()
    expect(document.querySelector('.cursor-dot')).toBeNull()
    expect(document.querySelector('.cursor-ring')).toBeNull()
    delete document.documentElement.dataset.cursor
  })

  it('觸控裝置（hover:none）時不插入游標 DOM 節點', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(hover: none)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))
    await mountWithCursor()
    expect(document.querySelector('.cursor-dot')).toBeNull()
    expect(document.querySelector('.cursor-ring')).toBeNull()
  })
})
