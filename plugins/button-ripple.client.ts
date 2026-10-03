export default defineNuxtPlugin(() => {
  const selector = 'button:not(.elastic-face):not(.about-avatar-action), .icon-button, .nav-links a, .quick-nav-btn, .contact-item, .project-modal-link-chip, #back-to-top, [role="button"]'
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const running = new Map<Animation, { layer: HTMLElement; pointerId?: number }>()

  const ripple = (event: PointerEvent | KeyboardEvent) => {
    if (event instanceof PointerEvent && (event.button !== 0 || !event.isPrimary)) return
    if (event instanceof KeyboardEvent && (event.repeat || !['Enter', ' '].includes(event.key))) return
    const host = (event.target as Element)?.closest<HTMLElement>(selector)
    if (!host || host.closest('.nuxt-devtools-anchor, [inert]') || host.matches(':disabled, [aria-disabled="true"]')) return
    if (event instanceof KeyboardEvent && event.key === ' ' && host.matches('a[href]:not([role="button"])')) return
    const rect = host.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = event instanceof PointerEvent ? event.clientX - rect.left : rect.width / 2
    const y = event instanceof PointerEvent ? event.clientY - rect.top : rect.height / 2
    const diameter = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))
    if (getComputedStyle(host).position === 'static') host.classList.add('ripple-relative')
    const layer = document.createElement('span')
    layer.className = 'button-ripple-layer'
    layer.setAttribute('aria-hidden', 'true')
    const circle = document.createElement('span')
    circle.className = 'button-ripple-circle'
    Object.assign(circle.style, { width: `${diameter}px`, height: `${diameter}px`, left: `${x - diameter / 2}px`, top: `${y - diameter / 2}px` })
    layer.append(circle)
    host.append(layer)
    const animation = circle.animate(reducedMotion.matches ? [
      { opacity: .16 }, { opacity: 0 },
    ] : [
      { transform: 'scale(0)', opacity: .22 },
      { transform: 'scale(1)', opacity: .14, offset: .7 },
      { transform: 'scale(1)', opacity: 0 },
    ], { duration: reducedMotion.matches ? 180 : 600, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards' })
    running.set(animation, { layer, pointerId: event instanceof PointerEvent ? event.pointerId : undefined })
    const remove = () => { layer.remove(); running.delete(animation) }
    animation.onfinish = remove
    animation.oncancel = remove
  }

  const cancel = (event: PointerEvent) => {
    running.forEach(({ layer, pointerId }, animation) => {
      if (pointerId !== event.pointerId) return
      animation.cancel()
      layer.remove()
      running.delete(animation)
    })
  }

  document.addEventListener('pointerdown', ripple)
  document.addEventListener('pointercancel', cancel)
  document.addEventListener('keydown', ripple)
  if (import.meta.hot) import.meta.hot.dispose(() => {
    document.removeEventListener('pointerdown', ripple)
    document.removeEventListener('pointercancel', cancel)
    document.removeEventListener('keydown', ripple)
    running.forEach(({ layer }, animation) => { animation.cancel(); layer.remove() })
    running.clear()
  })
})
