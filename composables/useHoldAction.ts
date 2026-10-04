export const useHoldAction = (hold: () => void, click: () => void = () => {}) => {
  let timer: ReturnType<typeof setTimeout> | undefined, held = false, origin: { x: number; y: number } | null = null
  const cancel = () => { clearTimeout(timer); origin = null }
  const start = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return
    cancel(); held = false; origin = { x: event.clientX, y: event.clientY }
    timer = setTimeout(() => { held = true; cancel(); hold() }, 550)
  }
  const move = (event: PointerEvent) => { if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) cancel() }
  const activate = (event: MouseEvent) => { cancel(); if (held && event.detail !== 0) { held = false; event.preventDefault(); event.stopPropagation() } else { held = false; click() } }
  onUnmounted(cancel)
  return { start, move, cancel, activate }
}
