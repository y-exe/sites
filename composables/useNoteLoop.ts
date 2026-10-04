import { toySequence } from '~/utils/toy-sequence'
export const useNoteLoop = (play: (note: number) => void, rate: Ref<number>) => {
  const events = ref<{ note: number; time: number }[]>([]), recording = ref(false), playing = ref(false)
  let started = 0, timers: ReturnType<typeof setTimeout>[] = []
  const stop = () => { timers.forEach(clearTimeout); timers = []; playing.value = false; recording.value = false }
  const record = () => {
    if (recording.value) { recording.value = false; return }
    stop(); events.value = []; started = performance.now(); recording.value = true
    timers.push(setTimeout(() => { recording.value = false }, 8000))
  }
  const capture = (note: number) => {
    if (!recording.value || events.value.length >= 64) return
    const time = performance.now() - started
    if (time > 8000 || (events.value.at(-1)?.note === note && time - events.value.at(-1)!.time < 35)) return
    events.value.push({ note, time })
  }
  const start = () => {
    stop(); if (!events.value.length) return
    playing.value = true
    const cycle = () => {
      if (!playing.value) return
      timers = []
      const sequence = toySequence(events.value, rate.value)
      sequence.notes.forEach(event => { timers.push(setTimeout(() => { if (playing.value) play(event.note) }, event.time)) })
      timers.push(setTimeout(cycle, sequence.duration))
    }
    cycle()
  }
  watch(rate, () => { if (playing.value) start() })
  useEventListener('visibilitychange', () => { if (document.hidden) stop() })
  onUnmounted(stop)
  return { events, recording, playing, record, capture, start, stop }
}
