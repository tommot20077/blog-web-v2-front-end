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

describe('useGlobalReveal', () => {
  let moCallback: MutationCallback | null = null
  let rafQueue: Array<{ id: number; cb: FrameRequestCallback }> = []
  let ioObserve: ReturnType<typeof vi.fn>
  let nextRafId = 1

  beforeEach(() => {
    moCallback = null
    rafQueue = []
    nextRafId = 1
    ioObserve = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      observe = ioObserve
      unobserve = vi.fn()
      disconnect = vi.fn()
    })
    vi.stubGlobal('MutationObserver', class {
      constructor(cb: MutationCallback) { moCallback = cb }
      observe = vi.fn()
      disconnect = vi.fn()
    })
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextRafId++
      rafQueue.push({ id, cb })
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue = rafQueue.filter(x => x.id !== id)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  const flushRaf = () => {
    const q = rafQueue
    rafQueue = []
    q.forEach(x => x.cb(0))
  }

  const mountGlobal = async () => {
    vi.resetModules()
    const { useGlobalReveal } = await import('./useReveal')
    const Wrapper = defineComponent({
      setup() { useGlobalReveal(); return {} },
      template: '<div />',
    })
    return mount(Wrapper, { attachTo: document.body })
  }

  const revealScans = (spy: ReturnType<typeof vi.spyOn>) =>
    spy.mock.calls.filter(c => String(c[0]).includes('.reveal')).length

  it('同一幀內連續多次 mutation 只掃描一次文件', async () => {
    await mountGlobal()
    const spy = vi.spyOn(document, 'querySelectorAll')

    for (let i = 0; i < 10; i++) moCallback!([], {} as MutationObserver)
    expect(revealScans(spy)).toBe(0)

    flushRaf()
    expect(revealScans(spy)).toBe(1)
  })

  it('mutation 後新加入的 .reveal 節點仍會被 observe', async () => {
    await mountGlobal()
    const el = document.createElement('div')
    el.className = 'reveal'
    document.body.appendChild(el)

    moCallback!([], {} as MutationObserver)
    flushRaf()

    expect(ioObserve).toHaveBeenCalledWith(el)
  })

  it('已觀察過的元素不會重複 observe', async () => {
    await mountGlobal()
    const el = document.createElement('div')
    el.className = 'reveal'
    document.body.appendChild(el)

    moCallback!([], {} as MutationObserver)
    flushRaf()
    moCallback!([], {} as MutationObserver)
    flushRaf()

    expect(ioObserve.mock.calls.filter(c => c[0] === el)).toHaveLength(1)
  })

  it('unmount 時取消尚未執行的掃描', async () => {
    const wrapper = await mountGlobal()
    const spy = vi.spyOn(document, 'querySelectorAll')
    moCallback!([], {} as MutationObserver)
    wrapper.unmount()
    flushRaf()
    expect(revealScans(spy)).toBe(0)
  })
})
})
