import { onMounted, onUnmounted, type Ref } from 'vue'

export function useReveal(target: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) return
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          observer?.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })
    observer.observe(target.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
}

let globalIO: IntersectionObserver | null = null
let globalMO: MutationObserver | null = null
let rafId: number | null = null
// 已交給 IO 的元素；避免每次掃描重複 observe 還沒進入視窗的元素
let observed = new WeakSet<Element>()

function getIO(): IntersectionObserver {
  if (!globalIO) {
    globalIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          globalIO?.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
  }
  return globalIO
}

function observeAll() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('.reveal:not(.in)').forEach(el => {
    if (observed.has(el)) return
    observed.add(el)
    getIO().observe(el)
  })
}

// 以 requestAnimationFrame 合併同一幀內的多次 mutation，只掃一次
// （不改成只處理 addedNodes：節點可能被 Vue 以 class 切換而非新增，整體掃描語意較穩）
function scheduleObserveAll() {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    observeAll()
  })
}

export function useGlobalReveal() {
  onMounted(() => {
    observeAll()

    // Watch for new .reveal elements added by async data
    globalMO = new MutationObserver(() => scheduleObserveAll())
    globalMO.observe(document.body, { childList: true, subtree: true })
  })

  onUnmounted(() => {
    globalMO?.disconnect()
    globalMO = null
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
    observed = new WeakSet<Element>()
    globalIO?.disconnect()
    globalIO = null
  })

  return { observe: observeAll }
}
