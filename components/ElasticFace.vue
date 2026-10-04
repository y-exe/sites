<script setup lang="ts">
import { createSpring } from '~/utils/spring'
const { face, react, sleeping } = usePlayState()
const root = ref<HTMLElement | null>(null)
const springs = new Map<HTMLElement, ReturnType<typeof createSpring<'lift' | 'tilt'>>>()
const timers: ReturnType<typeof setTimeout>[] = []
const visible = useElementVisibility(root)
const documentVisibility = useDocumentVisibility()
const springFor = (el: HTMLElement) => {
  let spring = springs.get(el)
  if (!spring) {
    spring = createSpring({ lift: 0, tilt: 0 }, ({ lift, tilt }) => {
      el.style.transform = `translateY(${lift}px) rotate(${tilt}deg)`
    }, { stiffness: 260, damping: 14 })
    springs.set(el, spring)
  }
  return spring
}
const follow = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  root.value?.querySelectorAll<HTMLElement>('.face-letter').forEach(el => {
    const rect = el.parentElement!.getBoundingClientRect()
    const distance = event.clientX - rect.left - rect.width / 2
    const weight = Math.max(0, 1 - Math.abs(distance) / 80)
    springFor(el).to({ lift: -16 * weight, tilt: distance / 8 * weight })
  })
}
const reset = () => springs.forEach(spring => spring.to({ lift: 0, tilt: 0 }))
let waveGeneration = 0
const wave = async () => {
  const generation = ++waveGeneration
  react()
  await nextTick()
  if (generation !== waveGeneration) return
  springs.forEach((spring, el) => { if (!root.value?.contains(el)) { spring.stop(); springs.delete(el) } })
  timers.forEach(clearTimeout); timers.length = 0
  root.value?.querySelectorAll<HTMLElement>('.face-letter').forEach((el, index) => {
    timers.push(setTimeout(() => { springFor(el).to({ lift: 0, tilt: 0 }); springFor(el).kick({ lift: -320, tilt: index % 2 ? 100 : -100 }) }, index * 45))
  })
}
watch([visible, documentVisibility], ([inView, visibility]) => {
  if (!inView || visibility !== 'visible') {
    timers.forEach(clearTimeout); timers.length = 0
    springs.forEach(spring => spring.jump({ lift: 0, tilt: 0 }))
  }
})
onUnmounted(() => { waveGeneration++; timers.forEach(clearTimeout); springs.forEach(spring => spring.stop()) })
</script>
<template>
  <button ref="root" class="elastic-face" :class="{ 'face-asleep': sleeping }" type="button" :aria-label="sleeping ? '顔文字を起こす' : '顔文字の表情を変える'" @pointermove="follow" @pointerleave="reset" @click="wave">
    <Transition name="mood-change"><span :key="face" class="face-expression"><span v-for="(char, i) in face!.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`"><span class="face-letter">{{ char }}</span></span></span></Transition>
  </button>
</template>
