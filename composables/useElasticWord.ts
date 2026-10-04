import { createSpring } from '~/utils/spring'

export const useElasticWord = (root: Ref<HTMLElement | null>) => {
  const visible = useElementVisibility(root), visibility = useDocumentVisibility()
  const reduced = usePreferredReducedMotion()
  const springs = new Map<HTMLElement, ReturnType<typeof createSpring<'x' | 'y' | 'angle'>>>()
  const timers: ReturnType<typeof setTimeout>[] = []
  let drag: { id: number; x: number; y: number; index: number; moved: boolean; touch: boolean; el: HTMLElement } | null = null
  let suppressClickUntil = 0
  const letters = () => Array.from(root.value?.querySelectorAll<HTMLElement>('.footer-letter') || [])
  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0 }
  const springFor = (el: HTMLElement) => {
    let spring = springs.get(el)
    if (!spring) {
      spring = createSpring({ x: 0, y: 0, angle: 0 }, value => {
        el.style.transform = `translate(${value.x}px, ${value.y}px) rotate(${value.angle}deg)`
      }, { stiffness: 320, damping: 16 })
      springs.set(el, spring)
    }
    return spring
  }
  const release = () => {
    const previous = drag; drag = null
    if (previous?.el.hasPointerCapture(previous.id)) previous.el.releasePointerCapture(previous.id)
  }
  const reset = () => {
    clearTimers(); release()
    springs.forEach(spring => spring.jump({ x: 0, y: 0, angle: 0 }))
  }
  const wave = () => {
    if (drag || !visible.value || visibility.value !== 'visible' || reduced.value === 'reduce') return
    reset()
    letters().forEach((el, index) => { timers.push(setTimeout(() => springFor(el).kick({ y: -220 }), index * 35)) })
  }
  const start = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary || reduced.value === 'reduce') return
    const target = (event.target as Element).closest('.footer-letter')
    if (!target) return
    reset()
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, index: letters().indexOf(target as HTMLElement), moved: false, touch: event.pointerType === 'touch', el: event.currentTarget as HTMLElement }
    if (!drag.touch) drag.el.setPointerCapture(drag.id)
  }
  const move = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 6) return
      if (drag.touch && Math.abs(dy) > Math.abs(dx)) { release(); return }
      drag.moved = true; clearTimers(); drag.el.setPointerCapture(drag.id)
    }
    event.preventDefault()
    const x = Math.tanh(dx / 80) * 32, y = Math.tanh(dy / 80) * 24
    const held = drag.index
    letters().forEach((el, index) => {
      const weight = Math.exp(-Math.abs(index - held) * .6)
      springFor(el).jump({ x: x * weight, y: y * weight, angle: y * (index - held) * weight * .35 })
    })
  }
  const end = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return
    if (drag.moved) suppressClickUntil = performance.now() + 500
    release()
    springs.forEach(spring => spring.to({ x: 0, y: 0, angle: 0 }))
  }
  const click = (event: MouseEvent) => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); return }
    wave()
  }
  watch([visible, visibility, reduced], ([inView, state, preference]) => {
    if (!inView || state !== 'visible' || preference === 'reduce') reset()
    else wave()
  })
  useEventListener('blur', reset)
  onUnmounted(() => { reset(); springs.forEach(spring => spring.stop()) })
  return { wave, start, move, end, reset, click }
}
