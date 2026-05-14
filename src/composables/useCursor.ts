import { onMounted, onUnmounted } from 'vue'

const CURSOR_LAYER_Z_INDEX = '11000'

export function useCursor() {
  let dot:  HTMLElement | null = null
  let ring: HTMLElement | null = null
  let ringX = 0, ringY = 0
  let dotX  = 0, dotY  = 0
  let rafId = 0
  let hasMoved = false

  const center = (x: number, y: number) =>
    `translate(calc(${x}px - 50%), calc(${y}px - 50%))`

  const onMouseMove = (e: MouseEvent) => {
    dotX = e.clientX
    dotY = e.clientY
    if (dot) dot.style.transform = center(dotX, dotY)
    if (!hasMoved) {
      hasMoved = true
      ringX = dotX
      ringY = dotY
      dot?.classList.add('visible')
      ring?.classList.add('visible')
    }
  }

  const onMouseOver = (e: MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('a, button, [data-hover]')) ring?.classList.add('hover')
  }

  const onMouseOut = (e: MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('a, button, [data-hover]')) ring?.classList.remove('hover')
  }

  const animateRing = () => {
    const ease = 0.18
    ringX += (dotX - ringX) * ease
    ringY += (dotY - ringY) * ease
    if (ring) ring.style.transform = center(ringX, ringY)
    rafId = requestAnimationFrame(animateRing)
  }

  onMounted(() => {
    if (document.documentElement.dataset.cursor === 'off') return
    if (window.matchMedia('(hover: none)').matches) return

    dot  = document.createElement('div')
    ring = document.createElement('div')
    dot.className  = 'cursor-dot'
    ring.className = 'cursor-ring'
    dot.style.zIndex = CURSOR_LAYER_Z_INDEX
    ring.style.zIndex = CURSOR_LAYER_Z_INDEX
    // .visible is added on first mousemove to prevent stale ring at 0,0
    document.body.appendChild(dot)
    document.body.appendChild(ring)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseover', onMouseOver)
    window.addEventListener('mouseout',  onMouseOut)
    rafId = requestAnimationFrame(animateRing)
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseover', onMouseOver)
    window.removeEventListener('mouseout',  onMouseOut)
    dot?.remove()
    ring?.remove()
  })
}
