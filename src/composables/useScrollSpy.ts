import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export interface UseScrollSpyOptions {
  /**
   * IntersectionObserver 的 rootMargin。預設只把「視窗上方一小段」視為判定目前
   * 所在章節的偵測線，並保留一段偏移量對應站內固定導覽列的高度
   * （呼應 router/index.ts scrollBehavior 的 top:90 偏移量）。
   */
  rootMargin?: string
}

/**
 * Scroll-spy：依傳入的 heading id 清單（依文件順序排列），用 IntersectionObserver
 * 追蹤目前捲動到哪個章節，回傳目前 active 的 heading id（供 TOC 側欄高亮使用）。
 *
 * - 測試環境（或任何不支援 IntersectionObserver 的環境）安全降級：不建立 observer、
 *   不拋錯，activeId 維持初始值 undefined。
 * - ids 清單變動時（例如文章內容非同步載入完成、TOC 才確定）會重新訂閱。
 * - 同時有多個章節落在偵測線內時，取「ids 清單中位置最後」的一個（即最下面／
 *   最近捲過的章節）；全部離開偵測線時維持前一個 active（sticky），避免捲動到
 *   章節之間的空白處時 TOC 高亮閃爍消失。
 */
export function useScrollSpy(ids: Ref<string[]>, options: UseScrollSpyOptions = {}) {
  const activeId = ref<string | undefined>(undefined)
  const intersecting = new Set<string>()
  let observer: IntersectionObserver | null = null

  function updateActiveId() {
    for (let i = ids.value.length - 1; i >= 0; i -= 1) {
      const id = ids.value[i]
      if (id !== undefined && intersecting.has(id)) {
        activeId.value = id
        return
      }
    }
  }

  function teardown() {
    observer?.disconnect()
    observer = null
    intersecting.clear()
  }

  function setup() {
    teardown()
    if (typeof IntersectionObserver === 'undefined') return

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).id
        if (entry.isIntersecting) {
          intersecting.add(id)
        } else {
          intersecting.delete(id)
        }
      }
      updateActiveId()
    }, {
      rootMargin: options.rootMargin ?? '-96px 0px -70% 0px',
      threshold: 0,
    })

    for (const id of ids.value) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  }

  onMounted(setup)
  watch(ids, setup, { flush: 'post' })
  onUnmounted(teardown)

  return { activeId }
}
