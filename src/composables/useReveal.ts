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

let globalObserver: IntersectionObserver | null = null

export function useGlobalReveal() {
  const observe = () => {
    if (typeof document === 'undefined') return
    if (!globalObserver) {
      globalObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            globalObserver?.unobserve(entry.target)
          }
        })
      }, { threshold: 0.12 })
    }
    document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      globalObserver!.observe(el)
    })
  }

  onMounted(() => observe())
  onUnmounted(() => {
    globalObserver?.disconnect()
    globalObserver = null
  })

  return { observe }
}
