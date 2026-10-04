<script setup lang="ts">
import { getTimeDetails } from '~/utils/time-details'
const props = defineProps<{ anchor: HTMLElement | null }>()
const emit = defineEmits<{ close: [] }>()
const root = ref<HTMLElement | null>(null)
const startedAt = Math.floor(Date.now() / 1000), initial = getTimeDetails(new Date(startedAt * 1000))
const now = useNow({ interval: 1000 })
const second = computed(() => Math.floor(now.value.getTime() / 1000))
const details = computed(() => getTimeDetails(new Date(second.value * 1000)))
const hands = computed(() => {
  const elapsed = second.value - startedAt
  return { hour: initial.hands.hour + elapsed / 120, minute: initial.hands.minute + elapsed / 10, second: initial.hands.second + elapsed * 6 }
})
const position = ref<Record<string, string>>({ visibility: 'hidden' })
let dismissed = false
const dismiss = (restore = false) => {
  if (dismissed) return
  dismissed = true
  if (restore) props.anchor?.focus({ preventScroll: true })
  emit('close')
}
const place = () => {
  if (dismissed || !root.value || !props.anchor) return
  const anchor = props.anchor.getBoundingClientRect(), width = document.documentElement.clientWidth, height = window.innerHeight
  if (anchor.bottom < 0 || anchor.top > height || anchor.right < 0 || anchor.left > width) { dismiss(); return }
  const panelWidth = `${Math.max(0, Math.min(304, width - 24))}px`
  root.value.style.width = panelWidth
  const box = { width: root.value.offsetWidth, height: root.value.offsetHeight }, below = height - anchor.bottom - 22, above = anchor.top - 22
  const useBelow = below >= box.height || below >= above
  const left = Math.max(12, Math.min(anchor.left + anchor.width / 2 - box.width / 2, width - box.width - 12))
  const top = Math.max(12, Math.min(useBelow ? anchor.bottom + 10 : anchor.top - box.height - 10, height - box.height - 12))
  position.value = { width: panelWidth, left: `${left}px`, top: `${top}px`, transformOrigin: `${Math.max(0, Math.min(box.width, anchor.left + anchor.width / 2 - left))}px ${useBelow ? 'top' : 'bottom'}` }
}
useResizeObserver(root, place)
useEventListener('resize', place)
useEventListener('scroll', place, { capture: true, passive: true })
onClickOutside(root, () => dismiss(), { ignore: [() => props.anchor] })
const leaveFocus = (event: FocusEvent) => { if (event.relatedTarget && !root.value?.contains(event.relatedTarget as Node) && event.relatedTarget !== props.anchor) dismiss() }
useEventListener('keydown', (event: KeyboardEvent) => { if (!dismissed && event.key === 'Escape') { event.preventDefault(); dismiss(true) } })
onMounted(async () => { place(); await nextTick(); if (!dismissed) root.value?.focus({ preventScroll: true }) })
</script>
<template>
  <div ref="root" id="jst-time-details" class="time-details" :style="position" role="dialog" aria-modal="false" aria-labelledby="time-details-title" tabindex="-1" @focusout="leaveFocus">
    <button type="button" class="icon-button time-details-close" aria-label="時刻パネルを閉じる" data-tooltip="閉じる（Esc）" @click="dismiss(true)"><SiteIcon name="close" :size="18"/></button>
    <h3 id="time-details-title">日本時間 <span>JST</span></h3>
    <div class="time-details-main">
      <svg class="time-details-clock" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="29" class="clock-face"/>
        <g v-for="tick in 12" :key="tick" :transform="`rotate(${tick * 30} 32 32)`"><path d="M32 7v3" class="clock-tick"/></g>
        <path d="M32 32V19" class="clock-hand clock-hour" :style="{ transform: `rotate(${hands.hour}deg)` }"/>
        <path d="M32 32V12" class="clock-hand clock-minute" :style="{ transform: `rotate(${hands.minute}deg)` }"/>
        <path d="M32 36V9" class="clock-hand clock-second" :style="{ transform: `rotate(${hands.second}deg)` }"/>
        <circle cx="32" cy="32" r="2.4" fill="currentColor"/>
      </svg>
      <div><p class="time-details-date">{{ details.japanDate }}</p><time class="time-details-digital">{{ details.japanTime }}</time></div>
    </div>
    <div v-if="details.differenceMinutes" class="time-details-local"><p>あなたの端末 <span>{{ details.deviceZone }}</span></p><time>{{ details.localTime }}</time><span class="time-details-date">{{ details.localDate }}</span></div>
    <p class="time-details-difference">{{ details.differenceLabel }}</p>
  </div>
</template>
