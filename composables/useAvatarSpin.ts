import { createSpring } from '~/utils/spring'

export const useAvatarSpin = (root: Ref<HTMLElement | null>, onTurn: (delta: number, seconds: number) => void = () => {}, onRelease: () => void = () => {}) => {
  const dragging = ref(false), visible = useElementVisibility(root), visibility = useDocumentVisibility()
  const reduced = usePreferredReducedMotion()
  let motion: ReturnType<typeof createSpring<'rotation'>> | undefined
  let rotation = 0, suppressClickUntil = 0
  let pointer: { id: number; x: number; y: number; centerX: number; centerY: number; lastAngle: number; time: number; velocity: number; anchored: boolean; touch: boolean; host: HTMLElement } | null = null
  const angle = (event: PointerEvent, centerX: number, centerY: number) => Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI
  const release = () => {
    onRelease()
    const previous = pointer; pointer = null; dragging.value = false
    if (previous?.host.hasPointerCapture(previous.id)) previous.host.releasePointerCapture(previous.id)
  }
  const reset = () => { release(); rotation = 0; motion?.jump({ rotation: 0 }) }
  const start = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || reduced.value === 'reduce' || !root.value) return
    const bounds = root.value.getBoundingClientRect(), centerX = bounds.left + bounds.width / 2, centerY = bounds.top + bounds.height / 2
    if (Math.hypot(event.clientX - centerX, event.clientY - centerY) < bounds.width * .15) return
    release(); rotation %= 360; motion?.jump({ rotation })
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, centerX, centerY, lastAngle: angle(event, centerX, centerY), time: event.timeStamp, velocity: 0, anchored: true, touch: event.pointerType === 'touch', host: event.currentTarget as HTMLElement }
    if (!pointer.touch) pointer.host.setPointerCapture(pointer.id)
  }
  const move = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y
    if (!dragging.value) {
      if (Math.hypot(dx, dy) < 7) return
      if (pointer.touch && Math.abs(dy) > Math.abs(dx)) { release(); motion?.to({ rotation: Math.round(rotation / 360) * 360 }); return }
      dragging.value = true; pointer.host.setPointerCapture(pointer.id)
    }
    event.preventDefault()
    if (Math.hypot(event.clientX - pointer.centerX, event.clientY - pointer.centerY) < 12) { pointer.anchored = false; pointer.velocity = 0; return }
    const next = angle(event, pointer.centerX, pointer.centerY)
    if (!pointer.anchored) { pointer.anchored = true; pointer.lastAngle = next; pointer.time = event.timeStamp; return }
    const delta = ((next - pointer.lastAngle + 540) % 360) - 180
    const dt = Math.max(.008, (event.timeStamp - pointer.time) / 1000)
    pointer.velocity = dt > .12 ? 0 : Math.max(-1200, Math.min(1200, delta / dt))
    pointer.lastAngle = next; pointer.time = event.timeStamp
    rotation += delta; motion?.jump({ rotation })
    onTurn(delta, dt)
  }
  const end = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return
    const wasDragging = dragging.value
    const velocity = event.timeStamp - pointer.time > 80 ? 0 : pointer.velocity
    release()
    if (!wasDragging) { motion?.to({ rotation: Math.round(rotation / 360) * 360 }); return }
    suppressClickUntil = performance.now() + 500
    const target = Math.round((rotation + velocity * .16) / 360) * 360
    motion?.to({ rotation: target }); motion?.kick({ rotation: velocity })
  }
  const cancel = (event: PointerEvent) => {
    if (pointer?.id !== event.pointerId) return
    if (dragging.value) suppressClickUntil = performance.now() + 500
    reset()
  }
  const click = (event: MouseEvent) => {
    if (performance.now() >= suppressClickUntil) return true
    event.preventDefault(); return false
  }
  const key = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || !['ArrowLeft', 'ArrowRight'].includes(event.key) || reduced.value === 'reduce') return
    event.preventDefault(); release()
    motion?.to({ rotation: Math.round(rotation / 360) * 360 + (event.key === 'ArrowLeft' ? -360 : 360) })
  }
  onMounted(() => {
    motion = createSpring({ rotation: 0 }, value => {
      rotation = value.rotation
      const layer = root.value?.querySelector<HTMLElement>('.avatar-spin-layer')
      if (layer) layer.style.transform = `rotate(${rotation}deg)`
    }, { stiffness: 80, damping: 14 })
  })
  watch([visible, visibility, reduced], ([inView, state, preference]) => { if (!inView || state !== 'visible' || preference === 'reduce') reset() })
  useEventListener('blur', reset)
  onUnmounted(() => { reset(); motion?.stop() })
  return { dragging, start, move, end, cancel, click, key, reset }
}
