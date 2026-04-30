import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

describe('useNavScroll', () => {
  let rafCallback: FrameRequestCallback | null = null

  // Capture rAF callbacks so we can flush them manually
  const flushRaf = () => {
    if (rafCallback) {
      const cb = rafCallback
      rafCallback = null
      cb(0)
    }
  }

  // Mount a wrapper component so onMounted/onUnmounted lifecycle hooks fire
  const mountWithNavScroll = async () => {
    vi.resetModules()
    const { useNavScroll } = await import('./useNavScroll')
    let result: ReturnType<typeof useNavScroll>

    const Wrapper = defineComponent({
      setup() {
        result = useNavScroll()
        return {}
      },
      template: '<div></div>',
    })

    const wrapper = mount(Wrapper)
    return { result: result!, wrapper }
  }

  beforeEach(() => {
    rafCallback = null
    vi.stubGlobal('scrollY', 0)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb
      return 0
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('show 初始值為 true', async () => {
    const { result } = await mountWithNavScroll()
    expect(result.show.value).toBe(true)
  })

  it('向下捲動 > 64px 時隱藏 (scrollY 100, lastY 0)', async () => {
    const { result } = await mountWithNavScroll()

    // onMounted set lastY = 0 (scrollY was 0)
    vi.stubGlobal('scrollY', 100)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()

    expect(result.show.value).toBe(false)
  })

  it('向上捲動 > 2px 後再次顯示', async () => {
    const { result } = await mountWithNavScroll()

    // Scroll down to hide
    vi.stubGlobal('scrollY', 100)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()
    expect(result.show.value).toBe(false)

    // Scroll back up — ticking is now false again after flushRaf
    vi.stubGlobal('scrollY', 80)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()
    expect(result.show.value).toBe(true)
  })

  it('scrollY < 60 時無論方向都顯示', async () => {
    const { result } = await mountWithNavScroll()

    // Scroll down to 100 first to hide
    vi.stubGlobal('scrollY', 100)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()
    expect(result.show.value).toBe(false)

    // Scroll to a value < 60 — should always show
    vi.stubGlobal('scrollY', 50)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()
    expect(result.show.value).toBe(true)
  })

  it('mousemove clientY < 64 時顯示 navbar', async () => {
    const { result } = await mountWithNavScroll()

    // Hide it first
    vi.stubGlobal('scrollY', 200)
    window.dispatchEvent(new Event('scroll'))
    flushRaf()
    expect(result.show.value).toBe(false)

    // Mouse near the top — mousemove doesn't use rAF
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 30 }))
    expect(result.show.value).toBe(true)
  })

  it('unmount 後移除 scroll 和 mousemove 監聽器', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { wrapper } = await mountWithNavScroll()

    // Listeners should have been added on mount
    const scrollAdds = addSpy.mock.calls.filter(([ev]) => ev === 'scroll')
    const mousemoveAdds = addSpy.mock.calls.filter(([ev]) => ev === 'mousemove')
    expect(scrollAdds.length).toBeGreaterThanOrEqual(1)
    expect(mousemoveAdds.length).toBeGreaterThanOrEqual(1)

    await wrapper.unmount()

    // Listeners should have been removed on unmount
    const scrollRemoves = removeSpy.mock.calls.filter(([ev]) => ev === 'scroll')
    const mousemoveRemoves = removeSpy.mock.calls.filter(([ev]) => ev === 'mousemove')
    expect(scrollRemoves.length).toBeGreaterThanOrEqual(1)
    expect(mousemoveRemoves.length).toBeGreaterThanOrEqual(1)
  })
})
