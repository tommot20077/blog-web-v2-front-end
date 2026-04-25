import { onMounted, onUnmounted } from 'vue'

export function useCursor() {
  let dot:  HTMLElement | null = null
  let ring: HTMLElement | null = null
  let ringX = 0, ringY = 0
  let dotX  = 0, dotY  = 0
  let rafId = 0

  const onMouseMove = (e: MouseEvent) => {
    dotX = e.clientX
    dotY = e.clientY
    if (dot) dot.style.transform = `translate(${dotX}px, ${dotY}px)`
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
    if (ring) ring.style.transform = `translate(${ringX}px, ${ringY}px)`
    rafId = requestAnimationFrame(animateRing)
  }

  onMounted(() => {
    dot  = document.createElement('div')
    ring = document.createElement('div')
    dot.className  = 'cursor-dot'
    ring.className = 'cursor-ring'
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
