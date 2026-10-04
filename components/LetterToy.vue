<script setup lang="ts">
import { createSpring } from '~/utils/spring'
const mode = ref('machine'), speed = ref(1), stiffness = ref(1), running = ref(true), angle = ref(0), picked = ref(-1), tracing = ref(false)
const root = ref<HTMLElement | null>(null), letters = 'yexe.net', pitches = [60, 62, 64, 67, 69, 72, 74, 76]
const audio = useToyAudio(), { enabled, toggle } = useInteractionSound()
const reduced = usePreferredReducedMotion(), links = ref(Array.from({ length: 7 }, () => true)), parked = ref(Array.from({ length: 8 }, () => 0))
const poses = ref(Array.from({ length: 8 }, () => ({ y: 0, angle: 0 })))
const springOptions = { stiffness: 180, damping: 13 }
const motions: ReturnType<typeof createSpring<'y' | 'angle'>>[] = []
watch(stiffness, value => { springOptions.stiffness = 180 * value })
const loop = useNoteLoop(index => hit(index), speed)
let frame = 0, previous = 0, markerTimer: ReturnType<typeof setTimeout> | undefined, lastHit = -1
let crank: { id: number; x: number; angle: number } | null = null
const connected = (index: number) => links.value.slice(0, index).every(Boolean)
const phaseAt = (index: number) => connected(index) ? angle.value : parked.value[index]!
const disconnect = (index: number) => { parked.value = parked.value.map((_, i) => phaseAt(i)); links.value[index] = !links.value[index] }
const crankStart = (event: PointerEvent) => { if (event.button === 0 && event.isPrimary) { crank = { id: event.pointerId, x: event.clientX, angle: angle.value }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId) } }
const crankMove = (event: PointerEvent) => { if (crank?.id === event.pointerId) { running.value = false; angle.value = crank.angle + (event.clientX - crank.x) * 2 } }
const hit = (index: number) => { picked.value = index; clearTimeout(markerTimer); markerTimer = setTimeout(() => { picked.value = -1 }, 180); void audio.note(pitches[index]!, .35, 'sine') }
const touchLetter = (index: number) => { if (!tracing.value || lastHit === index) return; lastHit = index; hit(index); loop.capture(index) }
const begin = (event: PointerEvent) => {
  if (event.button !== 0 || !event.isPrimary) return
  loop.stop(); loop.record(); tracing.value = true; picked.value = -1; lastHit = -1
  const index = Number((event.target as Element).closest('[data-letter]')?.getAttribute('data-letter')); if (Number.isFinite(index)) touchLetter(index)
  root.value?.setPointerCapture(event.pointerId)
}
const move = (event: PointerEvent) => {
  if (!tracing.value) return
  const node = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-letter]')
  if (node && root.value?.contains(node)) touchLetter(Number(node.getAttribute('data-letter')))
  else lastHit = -1
}
const end = () => { if (!tracing.value) return; tracing.value = false; loop.start() }
const tick = (time: number) => {
  if (running.value && mode.value === 'machine' && !document.hidden && reduced.value !== 'reduce') angle.value += Math.min(64, time - (previous || time)) * .09 * speed.value
  if (mode.value === 'machine' && !document.hidden) motions.forEach((motion, index) => { const phase = phaseAt(index) * Math.PI / 180 + index * .65; motion.to({ y: Math.sin(phase) * 15, angle: Math.cos(phase) * 12 }) })
  previous = time; frame = requestAnimationFrame(tick)
}
onMounted(() => { for (let i = 0; i < 8; i++) motions.push(createSpring({ y: 0, angle: 0 }, value => { poses.value[i] = value }, springOptions)); frame = requestAnimationFrame(tick) })
watch(mode, () => { loop.stop(); tracing.value = false; audio.stop() })
watch(enabled, value => { if (!value) loop.stop() })
onUnmounted(() => { cancelAnimationFrame(frame); clearTimeout(markerTimer); motions.forEach(motion => motion.stop()) })
const letterStyle = (index: number) => {
  const pose = poses.value[index]!
  return mode.value === 'machine' ? { transform: `translateY(${pose.y}px) rotate(${pose.angle}deg)` } : {}
}
</script>
<template>
  <div class="toy-tabs"><button type="button" :aria-pressed="mode === 'machine'" @click="mode = 'machine'">からくり</button><button type="button" :aria-pressed="mode === 'loop'" @click="mode = 'loop'">なぞる音ループ</button></div>
  <div v-if="mode === 'machine'" class="letter-machine" aria-hidden="true" @pointerdown.prevent="crankStart" @pointermove.prevent="crankMove" @pointerup="crank = null" @pointercancel="crank = null" @lostpointercapture="crank = null"><svg viewBox="0 0 320 110"><g v-for="i in 8" :key="i" :transform="`translate(${22 + (i-1)*39},76) rotate(${phaseAt(i-1) * (i % 2 ? 1 : -1)})`"><path d="M-16-5l4-3-1-5 5-1 3-4 5 2 5-2 3 4 5 1-1 5 4 3-2 5 2 5-4 3 1 5-5 1-3 4-5-2-5 2-3-4-5-1 1-5-4-3 2-5Z"/><circle r="6"/></g></svg><div class="machine-letters"><span v-for="(letter,i) in letters" :key="i" :style="letterStyle(i)">{{ letter }}</span></div></div>
  <div v-if="mode === 'machine'" class="machine-links"><button v-for="(link,i) in links" :key="i" type="button" :aria-pressed="link" :aria-label="`${i+1}番目の連結を${link ? '外す' : 'つなぐ'}`" :data-tooltip="link ? '連結を外す' : '連結する'" @click="disconnect(i)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 8H7a4 4 0 0 0 0 8h3m4-8h3a4 4 0 0 1 0 8h-3"/><path v-if="link" d="M8 12h8"/><path v-else d="m10 10 4 4m0-4-4 4"/></svg></button></div>
  <div v-else ref="root" class="letter-trace" @pointerdown.prevent="begin" @pointermove.prevent="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end"><button v-for="(letter,i) in letters" :key="i" :data-letter="i" type="button" data-sound-toggle :class="{ 'is-active': picked === i }" :aria-label="`${letter}の音を鳴らす`" @click="if ($event.detail === 0) { hit(i); loop.capture(i) }">{{ letter }}</button></div>
  <p class="toy-hint">{{ mode === 'machine' ? '歯車を横になぞって回せます。連結を外すと、その先が止まります。' : '押したまま文字をなぞって離すと、順番と間隔を覚えて繰り返します。' }}</p>
  <p v-if="mode === 'loop' && !enabled" class="toy-muted">効果音がOFFです。<button type="button" @click="toggle">音をONにする</button></p>
  <div class="toy-controls"><label>速さ {{ speed.toFixed(2) }}×<input v-model.number="speed" type="range" min="0.4" max="2" step="0.05"/></label><label v-if="mode === 'machine'">ばねの硬さ<input v-model.number="stiffness" type="range" min="0.6" max="2" step="0.05"/></label></div>
  <div class="toy-actions"><button v-if="mode === 'machine'" type="button" @click="running = !running">{{ running ? '止める' : '動かす' }}</button><template v-else><button type="button" :aria-pressed="loop.recording.value" @click="loop.record">{{ loop.recording.value ? '録音を終える' : '鍵盤で録音' }}</button><button type="button" :disabled="!loop.events.value.length" @click="loop.playing.value ? loop.stop() : loop.start()">{{ loop.playing.value ? 'ループを止める' : 'ループ再生' }}</button><span>{{ loop.events.value.length }} 音</span></template></div>
</template>
