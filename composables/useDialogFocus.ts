import type { Ref } from 'vue'
export const useDialogFocus = (open: Ref<boolean>, selector: string, close: () => void) => {
  let previous: HTMLElement | null = null
  const key = (event: KeyboardEvent) => {
    if (!open.value) return
    if (event.key === 'Escape') { event.preventDefault(); close() }
    if (event.key !== 'Tab') return
    const dialog = document.querySelector<HTMLElement>(selector)
    const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]') || []).filter(el => el.getClientRects().length)
    const first = controls[0], last = controls.at(-1)
    if (!first) { event.preventDefault(); dialog?.focus(); return }
    if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
  }
  watch(open, async value => {
    if (!import.meta.client) return
    if (value) { previous = document.activeElement as HTMLElement; await nextTick(); document.querySelector<HTMLElement>(`${selector} button`)?.focus({ preventScroll: true }) }
    else previous?.focus({ preventScroll: true })
  })
  onMounted(() => document.addEventListener('keydown', key))
  onUnmounted(() => document.removeEventListener('keydown', key))
}
