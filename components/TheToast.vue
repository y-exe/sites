<script setup lang="ts">
const props = defineProps<{ data: { show: boolean; message: string; kind?: 'success' | 'error' } }>()
const { toast } = useSiteToast()
const hovered = ref(false)
const focused = ref(false)
const paused = computed(() => hovered.value || focused.value)
const dismissButton = ref<HTMLButtonElement | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let remaining = 3000
let started = 0
let previousFocus: HTMLElement | null = null
const stopTimer = () => {
  if (timer !== undefined) remaining = Math.max(0, remaining - (Date.now() - started))
  clearTimeout(timer)
  timer = undefined
}
const dismiss = () => {
  stopTimer()
  if (document.activeElement === dismissButton.value && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
  toast.value = { ...toast.value, show: false }
}
const startTimer = () => {
  if (!props.data.show || paused.value) return
  started = Date.now()
  timer = setTimeout(dismiss, remaining)
}
const focusOut = (event: FocusEvent) => { focused.value = (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node) }
watch(() => props.data, data => {
  stopTimer()
  if (!data.show) { hovered.value = false; focused.value = false; return }
  if (!focused.value) previousFocus = document.activeElement as HTMLElement | null
  remaining = data.kind === 'error' ? 6000 : 3000
  startTimer()
}, { immediate: true })
watch(paused, value => { stopTimer(); if (!value) startTimer() })
onUnmounted(stopTimer)
</script>

<template>
  <Transition name="toast">
    <div v-if="data.show" id="toast-notification" class="is-shown" @pointerenter="hovered = true" @pointerleave="hovered = false" @focusin="focused = true" @focusout="focusOut">
      <SiteIcon v-if="data.kind === 'error'" name="alert" :size="18"/>
      <span class="toast-message" role="status" aria-live="polite" aria-atomic="true">{{ data.message }}</span>
      <button ref="dismissButton" class="icon-button toast-dismiss" type="button" aria-label="通知を閉じる" @click="dismiss" @keydown.esc.stop.prevent="dismiss"><SiteIcon name="close" :size="16"/></button>
    </div>
  </Transition>
</template>
