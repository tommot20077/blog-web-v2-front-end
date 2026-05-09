import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'

describe('useReadingProgress', () => {
  const mountWithProgress = async (scrollY = 0, bodyHeight = 2000, windowHeight = 900) => {
    vi.resetModules()
    const { useReadingProgress } = await import('./useReadingProgress')

    vi.stubGlobal('scrollY', scrollY)
    vi.stubGlobal('innerHeight', windowHeight)

    const Wrapper = defineComponent({
      setup() {
        const articleRef = ref<HTMLElement | null>(null)
        const { progress } = useReadingProgress(articleRef)
        return { progress, articleRef }
      },
      template: `<div ref="articleRef" :style="{ height: '${bodyHeight}px' }"></div>`,
    })

    const wrapper = mount(Wrapper, { attachTo: document.body })
    return { wrapper }
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('初始 progress 為 0', async () => {
    const { wrapper } = await mountWithProgress(0)
    expect(wrapper.vm.progress).toBe(0)
  })

  it('scroll 到頁面一半時 progress 約為 50', async () => {
    const { wrapper } = await mountWithProgress(0, 2000, 900)

    // JSDOM 不渲染高度，需手動 mock scrollHeight
    Object.defineProperty(wrapper.element, 'scrollHeight', { value: 2000, configurable: true })
    vi.stubGlobal('innerHeight', 900)
    vi.stubGlobal('scrollY', 550)  // total = 2000 - 900 = 1100, progress = 550/1100 ≈ 50
    window.dispatchEvent(new Event('scroll'))

    expect(wrapper.vm.progress).toBeGreaterThanOrEqual(40)
    expect(wrapper.vm.progress).toBeLessThanOrEqual(60)
  })

  it('scroll 到底部時 progress 為 100', async () => {
    const { wrapper } = await mountWithProgress(0, 2000, 900)

    vi.stubGlobal('scrollY', 99999)
    window.dispatchEvent(new Event('scroll'))

    expect(wrapper.vm.progress).toBe(100)
  })

  it('progress 不超過 100', async () => {
    const { wrapper } = await mountWithProgress(0)

    vi.stubGlobal('scrollY', 999999)
    window.dispatchEvent(new Event('scroll'))

    expect(wrapper.vm.progress).toBeLessThanOrEqual(100)
  })

  it('unmount 後移除 scroll listener', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { wrapper } = await mountWithProgress(0)
    await wrapper.unmount()
    const scrollRemoves = removeSpy.mock.calls.filter(([ev]) => ev === 'scroll')
    expect(scrollRemoves.length).toBeGreaterThanOrEqual(1)
  })
})
