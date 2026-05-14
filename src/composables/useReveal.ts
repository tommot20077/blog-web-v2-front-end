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
  document.querySelectorAll('.reveal:not(.in)').forEach(el => getIO().observe(el))
}

export function useGlobalReveal() {
  onMounted(() => {
    observeAll()

    // Watch for new .reveal elements added by async data
    globalMO = new MutationObserver(() => observeAll())
    globalMO.observe(document.body, { childList: true, subtree: true })
  })

  onUnmounted(() => {
    globalMO?.disconnect()
    globalMO = null
    globalIO?.disconnect()
    globalIO = null
  })

  return { observe: observeAll }
}
