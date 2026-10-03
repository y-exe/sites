import { computed, onUnmounted, ref } from 'vue'

export const useGallerySwipe = (enabled: () => boolean, step: (direction: number) => void) => {
  const dragging = ref(false)
  const offset = ref(0)
  const style = computed(() => ({ '--gallery-drag-x': `${offset.value}px` }))
  let gesture: { id: number; x: number; y: number; width: number; horizontal: boolean } | null = null
  let suppressClick = false
  let clickTimer: ReturnType<typeof setTimeout> | undefined
  const reset = () => { gesture = null; dragging.value = false; offset.value = 0 }
  const start = (event: PointerEvent) => {
    if (!event.isPrimary) { reset(); return }
    if (!enabled() || event.button !== 0 || (event.target as Element).closest('button, a, input, [role="button"]')) return
    const element = event.currentTarget as HTMLElement
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, width: element.clientWidth, horizontal: false }
    clearTimeout(clickTimer)
    suppressClick = false
  }
  const move = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.id) return
    const x = event.clientX - gesture.x
    const y = event.clientY - gesture.y
    if (!gesture.horizontal) {
      if (Math.abs(y) > 8 && Math.abs(y) > Math.abs(x)) { reset(); return }
      if (Math.abs(x) < 8 || Math.abs(x) < Math.abs(y) * 1.2) return
      gesture.horizontal = true
      dragging.value = true
      const element = event.currentTarget as HTMLElement
      element.setPointerCapture(event.pointerId)
    }
    event.preventDefault()
    offset.value = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.max(-56, Math.min(56, x * .28))
  }
  const end = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.id) return
    const { x, width, horizontal } = gesture
    const distance = event.clientX - x
    reset()
    if (!horizontal) return
    suppressClick = true
    clickTimer = setTimeout(() => { suppressClick = false }, 0)
    if (enabled() && Math.abs(distance) >= Math.max(40, Math.min(90, width * .12))) step(distance < 0 ? 1 : -1)
  }
  const cancel = () => { reset() }
  const click = (event: MouseEvent) => {
    if (!suppressClick || event.detail === 0) return
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
  }
  onUnmounted(() => { clearTimeout(clickTimer); reset() })
  return { dragging, style, start, move, end, cancel, click }
}
