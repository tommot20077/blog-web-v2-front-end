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
