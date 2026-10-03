<script setup lang="ts">
import { createSpring } from '~/utils/spring'
const props = defineProps<{ sun: boolean }>()
const maskId = `theme-cutout-${useId().replace(/:/g, '')}`
const shape = reactive({ radius: props.sun ? 5 : 8, cutout: props.sun ? 29 : 16, rays: props.sun ? 1 : 0, turn: props.sun ? 0 : -65 })
let spring: ReturnType<typeof createSpring<'radius' | 'cutout' | 'rays' | 'turn'>> | undefined
onMounted(() => {
  spring = createSpring({ ...shape }, values => Object.assign(shape, values), { stiffness: 220, damping: 17 })
})
watch(() => props.sun, sun => spring?.to({ radius: sun ? 5 : 8, cutout: sun ? 29 : 16, rays: sun ? 1 : 0, turn: sun ? 0 : -65 }))
onUnmounted(() => spring?.stop())
</script>
<template>
  <svg class="site-icon theme-glyph" width="23" height="23" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs><mask :id="maskId"><rect width="24" height="24" fill="white"/><circle :cx="shape.cutout" cy="6" r="7" fill="black"/></mask></defs>
    <circle cx="12" cy="12" :r="shape.radius" fill="currentColor" :mask="`url(#${maskId})`"/>
    <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" :style="{ transform: `rotate(${shape.turn}deg) scale(${Math.max(0, shape.rays)})`, opacity: Math.max(0, Math.min(1, shape.rays)) }">
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>
    </g>
  </svg>
</template>
