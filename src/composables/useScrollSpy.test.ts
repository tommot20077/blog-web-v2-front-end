import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { useScrollSpy } from './useScrollSpy'

describe('useScrollSpy', () => {
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

  function stubIntersectionObserver() {
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: IntersectionObserverCallback) {
        observerCallback = cb
      }
      observe(el: Element) { observedElements.push(el) }
      unobserve(el: Element) { observedElements = observedElements.filter(e => e !== el) }
      disconnect() { disconnected = true }
    })
  }

  function makeHeading(id: string): HTMLElement {
    const el = document.createElement('h2')
    el.id = id
    document.body.appendChild(el)
    return el
  }

  function mountSpy(ids: string[]) {
    const idsRef = ref(ids)
    let exposed: ReturnType<typeof useScrollSpy> | undefined
    const Wrapper = defineComponent({
      setup() {
        exposed = useScrollSpy(idsRef)
        return {}
      },
      template: '<div />',
    })
    const wrapper = mount(Wrapper, { attachTo: document.body })
    return { wrapper, idsRef, activeId: () => exposed!.activeId }
  }

  beforeEach(() => {
    observerCallback = null
    observedElements = []
    disconnected = false
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('沒有 IntersectionObserver 時安全降級：不建立 observer、不拋錯', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    makeHeading('heading-a')

    expect(() => mountSpy(['heading-a'])).not.toThrow()
  })

  it('沒有 IntersectionObserver 時 activeId 維持初始值 undefined', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    makeHeading('heading-a')

    const { activeId } = mountSpy(['heading-a'])

    expect(activeId().value).toBeUndefined()
  })

  it('ids 為空陣列時不呼叫 observe，也不拋錯', () => {
    stubIntersectionObserver()

    expect(() => mountSpy([])).not.toThrow()
    expect(observedElements).toHaveLength(0)
  })

  it('mount 後對每個存在的 heading 元素呼叫 observe', () => {
    stubIntersectionObserver()
    const elA = makeHeading('heading-a')
    const elB = makeHeading('heading-b')

    mountSpy(['heading-a', 'heading-b'])

    expect(observedElements).toEqual([elA, elB])
  })

  it('DOM 中不存在的 heading id 會被跳過，不拋錯', () => {
    stubIntersectionObserver()
    makeHeading('heading-a')
    // heading-missing 不存在於 DOM

    expect(() => mountSpy(['heading-a', 'heading-missing'])).not.toThrow()
    expect(observedElements).toHaveLength(1)
  })

  it('單一章節進入偵測線時，activeId 更新為該 id', () => {
    stubIntersectionObserver()
    const elA = makeHeading('heading-a')
    const { activeId } = mountSpy(['heading-a'])

    observerCallback!([makeEntry(elA, true)], {} as IntersectionObserver)

    expect(activeId().value).toBe('heading-a')
  })

  it('多個章節同時在偵測線內時，取 ids 清單中位置最後的一個', () => {
    stubIntersectionObserver()
    const elA = makeHeading('heading-a')
    const elB = makeHeading('heading-b')
    const { activeId } = mountSpy(['heading-a', 'heading-b'])

    observerCallback!([makeEntry(elA, true), makeEntry(elB, true)], {} as IntersectionObserver)

    expect(activeId().value).toBe('heading-b')
  })

  it('章節離開偵測線後，activeId 回退到仍相交的較前一個章節', () => {
    stubIntersectionObserver()
    const elA = makeHeading('heading-a')
    const elB = makeHeading('heading-b')
    const { activeId } = mountSpy(['heading-a', 'heading-b'])

    observerCallback!([makeEntry(elA, true), makeEntry(elB, true)], {} as IntersectionObserver)
    expect(activeId().value).toBe('heading-b')

    observerCallback!([makeEntry(elB, false)], {} as IntersectionObserver)
    expect(activeId().value).toBe('heading-a')
  })

  it('全部離開偵測線時維持前一個 active（sticky，不清空）', () => {
    stubIntersectionObserver()
    const elA = makeHeading('heading-a')
    const { activeId } = mountSpy(['heading-a'])

    observerCallback!([makeEntry(elA, true)], {} as IntersectionObserver)
    expect(activeId().value).toBe('heading-a')

    observerCallback!([makeEntry(elA, false)], {} as IntersectionObserver)
    expect(activeId().value).toBe('heading-a')
  })

  it('ids 清單變動時重新訂閱新加入的元素', async () => {
    stubIntersectionObserver()
    const elA = makeHeading('heading-a')
    const { idsRef } = mountSpy(['heading-a'])
    expect(observedElements).toEqual([elA])

    observedElements = []
    const elB = makeHeading('heading-b')
    idsRef.value = ['heading-a', 'heading-b']
    await nextTick()

    expect(observedElements).toEqual([elA, elB])
  })

  it('unmount 時呼叫 observer.disconnect()', () => {
    stubIntersectionObserver()
    makeHeading('heading-a')
    const { wrapper } = mountSpy(['heading-a'])

    wrapper.unmount()

    expect(disconnected).toBe(true)
  })
})
