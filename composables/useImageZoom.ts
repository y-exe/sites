import { createImageZoom } from '~/utils/image-zoom'
import { createSpring } from '~/utils/spring'

export const useImageZoom = (stage: Ref<HTMLElement | null>, available: () => boolean, swipe: ReturnType<typeof useGallerySwipe>) => {
  const model = createImageZoom(), scale = ref(1), dragging = ref(false)
  const rendered = ref({ scale: 1, x: 0, y: 0 })
  let motion: ReturnType<typeof createSpring<'scale' | 'x' | 'y'>> | null = null
  onMounted(() => { motion = createSpring({ scale: 1, x: 0, y: 0 }, values => { rendered.value = values }, { stiffness: 420, damping: 30 }) })
  const points = new Map<number, { x: number; y: number }>()
  let origin: { x: number; y: number; panX: number; panY: number } | null = null
  let pinch: { distance: number; scale: number; x: number; y: number; panX: number; panY: number } | null = null
  let suppressClickUntil = 0
  const measure = () => {
    const el = stage.value, image = el?.querySelector<HTMLImageElement>('.gallery-image-content')
    if (!el || !image) return false
    model.measure(el.clientWidth, el.clientHeight, image.offsetWidth, image.offsetHeight)
    return true
  }
  const render = (immediate = false) => {
    scale.value = model.state.scale
    if (immediate) motion?.jump({ ...model.state }); else motion?.to({ ...model.state })
  }
  const focal = (x: number, y: number) => {
    const box = stage.value!.getBoundingClientRect()
    return { x: x - box.left - box.width / 2, y: y - box.top - box.height / 2 }
  }
  const change = (value: number, x?: number, y?: number) => {
    if (!available() || !measure()) return
    const point = x === undefined || y === undefined ? { x: 0, y: 0 } : focal(x, y)
    model.zoom(value, point.x, point.y); render()
  }
  const reset = () => {
    points.clear(); origin = null; pinch = null; dragging.value = false
    model.reset(); render(true); swipe.cancel()
  }
  const wheel = (event: WheelEvent) => {
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.value?.clientHeight || 500 : 1)
    change(model.state.scale * Math.exp(-Math.max(-150, Math.min(150, delta)) * .0025), event.clientX, event.clientY)
  }
  const doubleClick = (event: MouseEvent) => {
    if (!(event.target as Element).closest('.gallery-image-content')) return
    change(scale.value > 1 ? 1 : 2, event.clientX, event.clientY)
  }
  const start = (event: PointerEvent) => {
    if (!available() || event.button !== 0 || !(event.target as Element).closest('.gallery-image-content')) { swipe.start(event); return }
    points.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (points.size >= 2) {
      swipe.cancel(); measure()
      const [a, b] = Array.from(points.values()), center = focal((a!.x + b!.x) / 2, (a!.y + b!.y) / 2)
      pinch = { distance: Math.max(1, Math.hypot(a!.x - b!.x, a!.y - b!.y)), scale: model.state.scale, x: center.x, y: center.y, panX: model.state.x, panY: model.state.y }
      origin = null; dragging.value = true
      event.preventDefault()
      for (const pointerId of points.keys()) (event.currentTarget as HTMLElement).setPointerCapture(pointerId)
    } else if (scale.value > 1) {
      swipe.cancel(); measure()
      origin = { x: event.clientX, y: event.clientY, panX: model.state.x, panY: model.state.y }
      dragging.value = true
      event.preventDefault(); (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    } else swipe.start(event)
  }
  const move = (event: PointerEvent) => {
    if (points.has(event.pointerId)) points.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pinch && points.size >= 2) {
      const [a, b] = Array.from(points.values()), center = focal((a!.x + b!.x) / 2, (a!.y + b!.y) / 2)
      const next = Math.max(1, Math.min(4, pinch.scale * Math.hypot(a!.x - b!.x, a!.y - b!.y) / pinch.distance)), ratio = next / pinch.scale
      model.zoom(next)
      model.pan(center.x - (pinch.x - pinch.panX) * ratio, center.y - (pinch.y - pinch.panY) * ratio)
      render(true); suppressClickUntil = performance.now() + 500; event.preventDefault()
    } else if (origin) {
      const dx = event.clientX - origin.x, dy = event.clientY - origin.y
      model.pan(origin.panX + dx, origin.panY + dy); render(true)
      if (Math.hypot(dx, dy) > 4) suppressClickUntil = performance.now() + 500
      event.preventDefault()
    } else swipe.move(event)
  }
  const end = (event: PointerEvent) => {
    points.delete(event.pointerId)
    if (origin || pinch) {
      origin = null; pinch = null; dragging.value = false
      if (points.size === 1 && scale.value > 1) {
        const remaining = Array.from(points.values())[0]!
        origin = { x: remaining.x, y: remaining.y, panX: model.state.x, panY: model.state.y }; dragging.value = true
      }
      const el = event.currentTarget as HTMLElement
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
    } else swipe.end(event)
  }
  const cancel = (event: PointerEvent) => { points.delete(event.pointerId); origin = null; pinch = null; dragging.value = false; swipe.cancel() }
  const click = (event: MouseEvent) => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); return }
    swipe.click(event)
  }
  useResizeObserver(stage, () => { if (measure()) render() })
  onUnmounted(() => { points.clear(); motion?.stop() })
  return { scale, dragging, change, reset, wheel, doubleClick, start, move, end, cancel, click, style: computed(() => ({ '--image-zoom': rendered.value.scale, '--image-pan-x': `${rendered.value.x}px`, '--image-pan-y': `${rendered.value.y}px` })) }
}
