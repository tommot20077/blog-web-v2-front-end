import { ref, onMounted, onUnmounted } from 'vue'

export function useNavScroll() {
  const show = ref(true)

  // Scroll hide/show logic
  let lastY = window.scrollY
  let ticking = false
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (y < 60) { show.value = true }
        else if (y > lastY + 4) { show.value = false }
        else if (y < lastY - 2) { show.value = true }
        lastY = y
        ticking = false
      })
      ticking = true
    }
  }

  // Mouse near top forces show (invisible hover zone at top)
  let hoveredTop = false
  const onMouseMove = (e: MouseEvent) => {
    if (e.clientY < 64) {
      if (!hoveredTop) { hoveredTop = true; show.value = true }
    } else {
      hoveredTop = false
    }
  }

  onMounted(() => {
    lastY = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('mousemove', onMouseMove)
  })

  return { show }
}
