import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useReadingProgress(articleRef: Ref<HTMLElement | null>) {
  const progress = ref(0)

  const onScroll = () => {
    const el = articleRef.value
    if (!el) return
    const total = el.scrollHeight - window.innerHeight
    if (total <= 0) { progress.value = 100; return }
    progress.value = Math.min(100, Math.max(0, (window.scrollY / total) * 100))
  }

  onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
  onUnmounted(() => window.removeEventListener('scroll', onScroll))

  return { progress }
}
