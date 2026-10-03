<script setup lang="ts">
import { createSpring } from '~/utils/spring'
const { enabled, pulse, toggle, restore } = useInteractionSound()
const level = ref(enabled.value ? 1 : 0)
const beat = ref(0)
let spring: ReturnType<typeof createSpring<'level' | 'beat'>> | undefined
onMounted(() => {
  spring = createSpring({ level: level.value, beat: 0 }, value => {
    level.value = value.level
    beat.value = value.beat
  }, { stiffness: 300, damping: 18 })
  restore()
})
watch(enabled, value => spring?.to({ level: value ? 1 : 0, beat: 0 }))
watch(pulse, () => { if (enabled.value) spring?.kick({ beat: 9 }) })
onUnmounted(() => spring?.stop())
const visibility = computed(() => Math.max(0, Math.min(1, level.value)))
</script>
<template>
  <button type="button" class="icon-button sound-toggle" data-sound-toggle :aria-pressed="enabled" :aria-label="enabled ? '効果音をオフにする' : '効果音をオンにする'" :data-tooltip="enabled ? '効果音：ON' : '効果音：OFF'" @click="toggle">
    <svg class="site-icon sound-glyph" width="22" height="22" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M160,32.25V223.69a8.29,8.29,0,0,1-3.91,7.18,8,8,0,0,1-9-.56l-65.57-51A4,4,0,0,1,80,176.16V79.84a4,4,0,0,1,1.55-3.15l65.57-51a8,8,0,0,1,10,.16A8.27,8.27,0,0,1,160,32.25ZM60,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H60a4,4,0,0,0,4-4V84A4,4,0,0,0,60,80Z"/>
      <g class="sound-glyph-waves" :style="{ opacity: visibility, transform: `scale(${.6 + level * .4 + beat * .12})` }"><path d="M186.77,100.84a8,8,0,0,0-.72,11.3,24,24,0,0,1,0,31.72,8,8,0,1,0,12,10.58,40,40,0,0,0,0-52.88A8,8,0,0,0,186.74,100.84ZM227.66,74.67a8,8,0,1,0-11.92,10.66,64,64,0,0,1,0,85.34,8,8,0,1,0,11.92,10.66,80,80,0,0,0,0-106.66Z"/></g>
      <path d="M245.66,146.34a8,8,0,0,1-11.32,11.32L216,139.31l-18.34,18.35a8,8,0,0,1-11.32-11.32L204.69,128l-18.35-18.34a8,8,0,0,1,11.32-11.32L216,116.69l18.34-18.35a8,8,0,0,1,11.32,11.32L227.31,128Z" :style="{ opacity: 1 - visibility, transform: `rotate(${level * 75}deg) scale(${1 - visibility * .5})` }" class="sound-glyph-mute"/>
    </svg>
  </button>
</template>
