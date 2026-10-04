import { avatarGestureMode } from '~/utils/avatar-gesture'

export const useAvatarGesture = (root: Ref<HTMLElement | null>, spin: ReturnType<typeof useAvatarSpin>, ball: ReturnType<typeof useAvatarBall>, prepare: () => void) => {
  let pointer: { down: PointerEvent; host: HTMLElement; x: number; y: number; radius: number; mode: 'scratch' | 'ball' | null } | null = null
  let suppressUntil = 0
  const release = () => {
    const old = pointer; pointer = null
    if (old?.host.hasPointerCapture(old.down.pointerId)) old.host.releasePointerCapture(old.down.pointerId)
  }
  const start = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || !root.value) return
    release(); spin.reset(); ball.pause()
    const bounds = root.value.getBoundingClientRect()
    const down = { pointerId: event.pointerId, isPrimary: true, button: 0, pointerType: event.pointerType, clientX: event.clientX, clientY: event.clientY, timeStamp: event.timeStamp, currentTarget: event.currentTarget } as PointerEvent
    pointer = { down, host: event.currentTarget as HTMLElement, x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top - bounds.height / 2, radius: bounds.width / 2, mode: null }
    if (event.pointerType !== 'touch') pointer.host.setPointerCapture(event.pointerId)
  }
  const move = (event: PointerEvent) => {
    if (!pointer || pointer.down.pointerId !== event.pointerId) return false
    if (!pointer.mode) {
      const dx = event.clientX - pointer.down.clientX, dy = event.clientY - pointer.down.clientY
      if (Math.hypot(dx, dy) < 9) return true
      if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) { release(); return true }
      pointer.mode = avatarGestureMode(pointer.x, pointer.y, dx, dy, pointer.radius)
      if (pointer.mode === 'scratch') { prepare(); spin.start(pointer.down) }
      else ball.start(pointer.down)
    }
    if (pointer.mode === 'scratch') spin.move(event)
    else ball.move(event)
    return true
  }
  const end = (event: PointerEvent) => {
    if (!pointer || pointer.down.pointerId !== event.pointerId) return
    const mode = pointer.mode
    if (mode) suppressUntil = performance.now() + 500
    release()
    if (mode === 'scratch') spin.end(event)
    else if (mode === 'ball') ball.end(event)
  }
  const cancel = (event: PointerEvent) => {
    if (!pointer || pointer.down.pointerId !== event.pointerId) return
    suppressUntil = performance.now() + 500
    release(); spin.cancel(event); ball.cancel(event)
  }
  const click = (event: MouseEvent) => {
    if (performance.now() >= suppressUntil) return true
    event.preventDefault(); return false
  }
  const visible = useElementVisibility(root), visibility = useDocumentVisibility()
  watch([visible, visibility], ([inView, state]) => { if (!inView || state !== 'visible') release() })
  useEventListener('blur', release)
  onUnmounted(release)
  return { start, move, end, cancel, click }
}
