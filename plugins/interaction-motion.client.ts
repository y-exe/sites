import { createSpring, springEasing } from '~/utils/spring'

export default defineNuxtPlugin(() => {
  document.documentElement.style.setProperty('--spring-settle', springEasing({ stiffness: 280, damping: 20 }))
  document.documentElement.style.setProperty('--spring-pop', springEasing({ stiffness: 300, damping: 18 }))
  const selector = '.icon-button, .quick-nav-btn, .contact-item, .project-card, .history-trigger, .github-profile-trigger, .modal-close-btn, .project-modal-close, .pgp-copy-btn, .project-gallery-arrow, #back-to-top, .tech-pills > span, .info-pills > span'
  const motions = new Map<HTMLElement, ReturnType<typeof createSpring<'scale' | 'lift' | 'hover'>>>()
  const find = (event: Event) => {
    const el = (event.target as Element)?.closest<HTMLElement>(selector)
    return el?.hasAttribute('data-original-look') ? null : el
  }
  const motion = (el: HTMLElement) => {
    let spring = motions.get(el)
    if (!spring) {
      el.classList.add('spring-control')
      const card = el.matches('.project-card, .contact-item')
      const tag = el.matches('.tech-pills > span, .info-pills > span')
      spring = createSpring({ scale: 1, lift: 0, hover: 0 }, values => {
        if (!el.isConnected) { motions.get(el)?.stop(); motions.delete(el); return }
        el.style.setProperty('--spring-scale', String(values.scale))
        el.style.setProperty('--spring-lift', `${values.lift}px`)
        el.style.setProperty('--spring-hover', String(values.hover))
      }, tag ? { stiffness: 240, damping: 18 } : card ? { stiffness: 230, damping: 23 } : { stiffness: 360, damping: 19 })
      motions.set(el, spring)
    }
    return spring
  }
  const over = (event: PointerEvent | FocusEvent) => {
    const el = find(event)
    if (!el || el.contains(event.relatedTarget as Node) || (event instanceof PointerEvent && event.pointerType !== 'mouse')) return
    const tag = el.matches('.tech-pills > span, .info-pills > span')
    motion(el).to({ hover: 1, lift: 0, scale: tag ? 1.08 : 1 })
  }
  const out = (event: PointerEvent | FocusEvent) => {
    const el = find(event)
    if (!el || el.contains(event.relatedTarget as Node)) return
    motion(el).to({ hover: 0, lift: 0, scale: 1 })
  }
  document.addEventListener('pointerover', over)
  document.addEventListener('pointerout', out)
  document.addEventListener('focusin', over)
  document.addEventListener('focusout', out)
  const removed = new MutationObserver(records => {
    if (!records.some(record => record.removedNodes.length)) return
    motions.forEach((spring, el) => { if (!el.isConnected) { spring.stop(); motions.delete(el) } })
  })
  removed.observe(document.body, { childList: true, subtree: true })
  const cleanup = () => {
    removed.disconnect()
    motions.forEach(spring => spring.stop()); motions.clear()
    document.removeEventListener('pointerover', over); document.removeEventListener('pointerout', out)
    document.removeEventListener('focusin', over); document.removeEventListener('focusout', out)
  }
  if (import.meta.hot) import.meta.hot.dispose(cleanup)
})
