<script setup lang="ts">
const text = ref('')
const position = ref({ left: '0px', top: '0px' })
const below = ref(false)
const tooltipElement = ref<HTMLElement | null>(null)
let pointerX: number | null = null
let anchor: HTMLElement | null = null
let description: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let anchorObserver: MutationObserver | undefined
const place = () => {
  if (!anchor) return
  const rect = anchor.getBoundingClientRect()
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight
  const margin = 12
  const width = tooltipElement.value?.offsetWidth || 0
  const height = tooltipElement.value?.offsetHeight || 0
  below.value = rect.top - height - 7 < margin
  const x = pointerX === null ? rect.left + rect.width / 2 : Math.max(rect.left, Math.min(rect.right, pointerX))
  const halfWidth = width / 2
  const top = below.value
    ? Math.max(margin, Math.min(viewportHeight - height - margin, rect.bottom + 7))
    : Math.max(height + margin, Math.min(viewportHeight - margin, rect.top - 7))
  position.value = { left: `${Math.max(halfWidth + margin, Math.min(viewportWidth - halfWidth - margin, x))}px`, top: `${top}px` }
}
const move = (event: PointerEvent) => {
  if (text.value || event.pointerType !== 'mouse' || !anchor?.contains(event.target as Node)) return
  pointerX = event.clientX
}
const hide = () => {
  clearTimeout(timer)
  anchorObserver?.disconnect()
  if (anchor) {
    if (description) anchor.setAttribute('aria-describedby', description)
    else anchor.removeAttribute('aria-describedby')
  }
  anchor = null
  pointerX = null
  text.value = ''
}
const show = (event: Event) => {
  if (event instanceof PointerEvent && event.pointerType !== 'mouse') return
  const target = (event.target as HTMLElement)?.closest<HTMLElement>('[data-tooltip]')
  if (!target) return
  if (anchor === target) {
    if (!text.value && event instanceof PointerEvent) pointerX = event.clientX
    return
  }
  hide()
  anchor = target
  pointerX = event instanceof PointerEvent ? event.clientX : null
  description = target.getAttribute('aria-describedby')
  timer = setTimeout(() => {
    if (!target.isConnected) return hide()
    text.value = target.dataset.tooltip || ''
    place()
    nextTick(place)
    anchorObserver = new MutationObserver(() => { text.value = target.dataset.tooltip || ''; nextTick(place) })
    anchorObserver.observe(target, { attributes: true, attributeFilter: ['data-tooltip'] })
    target.setAttribute('aria-describedby', [description, 'site-tooltip'].filter(Boolean).join(' '))
  }, event.type === 'focusin' ? 0 : 300)
}
const leave = (event: Event) => { if (!anchor?.contains((event as FocusEvent).relatedTarget as Node)) hide() }
const key = (event: KeyboardEvent) => { if (event.key === 'Escape') hide() }
onMounted(() => {
  document.addEventListener('pointerover', show); document.addEventListener('focusin', show)
  document.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerout', leave); document.addEventListener('focusout', leave)
  document.addEventListener('pointerdown', hide); document.addEventListener('keydown', key)
  window.addEventListener('scroll', hide, { passive: true }); window.addEventListener('resize', hide)
})
onUnmounted(() => {
  hide()
  document.removeEventListener('pointerover', show); document.removeEventListener('focusin', show)
  document.removeEventListener('pointermove', move)
  document.removeEventListener('pointerout', leave); document.removeEventListener('focusout', leave)
  document.removeEventListener('pointerdown', hide); document.removeEventListener('keydown', key)
  window.removeEventListener('scroll', hide); window.removeEventListener('resize', hide)
})
</script>
<template><Teleport to="body"><Transition name="tooltip"><div v-if="text" ref="tooltipElement" id="site-tooltip" role="tooltip" class="site-tooltip" :class="{ 'is-below': below }" :style="position">{{ text }}</div></Transition></Teleport></template>
