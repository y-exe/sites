import { stepToyBall } from '~/utils/toy-ball'

export const useAvatarBall = (root: Ref<HTMLElement | null>, arena: Ref<HTMLElement | null>, enabled: Ref<boolean>, hit: (note: number) => void) => {
  const offset = reactive({ x: 0, y: 0 }), dragging = ref(false)
  const visible = useElementVisibility(arena), visibility = useDocumentVisibility(), reduced = usePreferredReducedMotion()
  const ball = { x: 0, y: 0, vx: 0, vy: 0 }
  let home = { x: 0, y: 0 }, radius = 66, frame = 0, previous = 0, running = false, suppressUntil = 0
  let pointer: { id: number; x: number; y: number; time: number; host: HTMLElement } | null = null
  const release = () => { const old = pointer; pointer = null; dragging.value = false; if (old?.host.hasPointerCapture(old.id)) old.host.releasePointerCapture(old.id) }
  const reset = () => { release(); running = false; ball.vx = ball.vy = 0; offset.x = offset.y = 0 }
  const locate = () => {
    const bounds = root.value?.getBoundingClientRect(), wall = arena.value?.getBoundingClientRect()
    if (!bounds || !wall) return false
    radius = bounds.width / 2
    home = { x: bounds.left + bounds.width / 2 - wall.left - offset.x - 12, y: bounds.top + bounds.height / 2 - wall.top - offset.y - 12 }
    ball.x = home.x + offset.x; ball.y = home.y + offset.y
    return true
  }
  const paint = () => { offset.x = ball.x - home.x; offset.y = ball.y - home.y }
  const start = (event: PointerEvent) => {
    if (!enabled.value || !event.isPrimary || event.button !== 0 || !locate()) return
    release(); running = false
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, host: event.currentTarget as HTMLElement }
    ball.vx = ball.vy = 0
  }
  const move = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y
    if (!dragging.value) {
      if (Math.hypot(dx, dy) < 7) return
      if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) { release(); return }
      dragging.value = true; pointer.host.setPointerCapture(pointer.id)
    }
    event.preventDefault()
    const dt = Math.max(.008, (event.timeStamp - pointer.time) / 1000)
    const wall = arena.value!.getBoundingClientRect()
    ball.x = Math.max(radius, Math.min(wall.width - 24 - radius, ball.x + dx))
    ball.y = Math.max(radius, Math.min(wall.height - 24 - radius, ball.y + dy))
    ball.vx = Math.max(-1400, Math.min(1400, dx / dt)); ball.vy = Math.max(-1400, Math.min(1400, dy / dt))
    pointer.x = event.clientX; pointer.y = event.clientY; pointer.time = event.timeStamp
    paint()
  }
  const end = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return
    const thrown = dragging.value
    if (event.timeStamp - pointer.time > 100) ball.vx = ball.vy = 0
    release()
    if (thrown) { suppressUntil = performance.now() + 500; running = true }
  }
  const toss = (event: Event) => {
    if (performance.now() < suppressUntil) { event.preventDefault(); return }
    if (!locate() || reduced.value === 'reduce') return
    ball.vx = 420; ball.vy = -280; running = true
  }
  const cancel = (event: PointerEvent) => { if (pointer?.id === event.pointerId) { if (dragging.value) suppressUntil = performance.now() + 500; reset() } }
  const tick = (time: number) => {
    const dt = Math.min(.032, (time - (previous || time)) / 1000); previous = time
    if (running && enabled.value && !pointer && arena.value) {
      stepToyBall(ball, dt, arena.value.clientWidth - 24, arena.value.clientHeight - 24, 500, .82, radius).forEach(hit)
      paint()
      if (Math.abs(ball.vx) < 1 && ball.vy === 0) running = false
    }
    frame = requestAnimationFrame(tick)
  }
  watch([enabled, visible, visibility, reduced], () => { if (!enabled.value || !visible.value || visibility.value !== 'visible' || reduced.value === 'reduce') reset() })
  useResizeObserver(arena, reset)
  useEventListener('blur', reset)
  onMounted(() => { frame = requestAnimationFrame(tick) })
  onUnmounted(() => { reset(); cancelAnimationFrame(frame) })
  const pause = () => { running = false; ball.vx = ball.vy = 0 }
  return { offset, dragging, start, move, end, cancel, toss, reset, pause }
}
