import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'

describe('useReveal', () => {
  let observerCallback: IntersectionObserverCallback | null = null
  let observedElements: Element[] = []
  let disconnected = false

  const makeEntry = (el: Element, isIntersecting: boolean): IntersectionObserverEntry =>
    ({
      target: el,
      isIntersecting,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    }) as IntersectionObserverEntry

  beforeEach(() => {
    observerCallback = null
    observedElements = []
    disconnected = false

    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: IntersectionObserverCallback) {
        observerCallback = cb
      }
      observe(el: Element) { observedElements.push(el) }
      unobserve(el: Element) { observedElements = observedElements.filter(e => e !== el) }
      disconnect() { disconnected = true }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mountWithReveal = async (elRef?: ReturnType<typeof ref>) => {
    vi.resetModules()
    const { useReveal } = await import('./useReveal')

    const Wrapper = defineComponent({
      setup() {
        const target = elRef ?? ref<HTMLElement | null>(null)
        useReveal(target)
        return { target }
      },
      template: '<div ref="target" class="reveal"></div>',
    })

    return mount(Wrapper, { attachTo: document.body })
  }

  it('mount 時 observe 被呼叫', async () => {
    await mountWithReveal()
    expect(observedElements.length).toBe(1)
  })

  it('IntersectionObserver 觸發 isIntersecting=true 時加上 .in class', async () => {
    const wrapper = await mountWithReveal()
    const el = wrapper.element

    observerCallback!([makeEntry(el, true)], {} as IntersectionObserver)

    expect(el.classList.contains('in')).toBe(true)
  })

  it('isIntersecting=false 時不加 .in class', async () => {
    const wrapper = await mountWithReveal()
    const el = wrapper.element

    observerCallback!([makeEntry(el, false)], {} as IntersectionObserver)

    expect(el.classList.contains('in')).toBe(false)
  })

  it('元素可見後 unobserve（只觸發一次）', async () => {
    const wrapper = await mountWithReveal()
    const el = wrapper.element

    observerCallback!([makeEntry(el, true)], {} as IntersectionObserver)

    expect(observedElements).not.toContain(el)
  })

  it('unmount 時 disconnect 被呼叫', async () => {
    const wrapper = await mountWithReveal()
    await wrapper.unmount()
    expect(disconnected).toBe(true)
  })
})
