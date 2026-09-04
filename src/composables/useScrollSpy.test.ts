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
    return {
      wrapper,
      idsRef,
      activeId: () => exposed!.activeId,
      resubscribe: () => exposed!.resubscribe(),
    }
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

  // ── BUG-001：resubscribe（給呼叫端在 DOM 更新後手動觸發重新訂閱）────────────
  //
  // 根因：ids（tocIds）在文章 API 回應時就 settle，通常早於 markdown 客端渲染
  // 完成、heading id 才被指派進 DOM 的時間點，導致 mount 當下 setup() 找不到任何
  // 元素可 observe。加上 Shiki 高亮就緒後 v-html 會整份換新 DOM 節點，即使第一輪
  // 訂到了，observer 也抓著已被替換掉（detached）的舊節點。
  //
  // 解法：回傳 resubscribe()（即內部 setup 本身）讓呼叫端能在「確定 DOM 已更新」
  // 的時間點主動重新訂閱；因為 setup() 內部一律先 teardown() 再重新查找、
  // observe，天然同時涵蓋「元素從無到有」與「舊節點被整批替換」兩種情境。
  describe('resubscribe（DOM 更新後手動重新訂閱）', () => {
    it('(a) ids settle 時對應元素尚不存在，之後元素才出現，呼叫 resubscribe() 後才開始訂閱', () => {
      stubIntersectionObserver()
      const { resubscribe } = mountSpy(['heading-a'])

      // mount 當下 DOM 還沒有這個 heading（模擬 markdown 尚未渲染完成、id 尚未指派）
      expect(observedElements).toHaveLength(0)

      const elA = makeHeading('heading-a')
      resubscribe()

      expect(observedElements).toEqual([elA])
    })

    it('(a) resubscribe() 訂閱到新出現的節點後，其 intersection 事件仍能正確更新 activeId', () => {
      stubIntersectionObserver()
      const { activeId, resubscribe } = mountSpy(['heading-a'])

      const elA = makeHeading('heading-a')
      resubscribe()
      observerCallback!([makeEntry(elA, true)], {} as IntersectionObserver)

      expect(activeId().value).toBe('heading-a')
    })

    it('(b) DOM 節點被整批替換（同 id、不同物件）後呼叫 resubscribe()：舊 observer disconnect、訂閱新節點而非舊節點', () => {
      stubIntersectionObserver()
      const elA1 = makeHeading('heading-a')
      const { resubscribe } = mountSpy(['heading-a'])
      expect(observedElements).toEqual([elA1])
      expect(disconnected).toBe(false)

      // 模擬 v-html 整份重繪：舊節點從文件移除，換上同 id 的新節點
      elA1.remove()
      const elA2 = makeHeading('heading-a')
      observedElements = []
      resubscribe()

      expect(disconnected).toBe(true)
      expect(observedElements).toEqual([elA2])
      expect(observedElements).not.toContain(elA1)
    })
  })

  // (c) 舊用法（不呼叫 resubscribe，只解構 activeId）行為不變 —— 由本檔其餘既有
  // 測試（mount 後自動 observe、intersection 事件更新 activeId、ids 變動時重新
  // 訂閱、unmount 時 disconnect 等）全數持續通過即為證據，此處不重複斷言。
})
