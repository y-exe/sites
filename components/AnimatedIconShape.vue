<script setup lang="ts">
import { createSpring } from '~/utils/spring'

const props = defineProps<{ kind: 'copy' | 'playback' | 'chevron'; active: boolean }>()
const progress = ref(props.active ? 1 : 0)
let spring: ReturnType<typeof createSpring<'progress'>> | undefined
onMounted(() => {
  if (props.kind === 'copy') return
  spring = createSpring({ progress: progress.value }, values => { progress.value = values.progress }, { stiffness: 185, damping: 19, mass: 1.1 })
})
watch(() => props.active, active => spring?.to({ progress: active ? 1 : 0 }))
onUnmounted(() => spring?.stop())

const mix = (a: number, b: number) => a + (b - a) * progress.value
const polygon = (from: number[][], to: number[][]) => from.map((point, i) => `${i ? 'L' : 'M'}${mix(point[0]!, to[i]![0]!).toFixed(3)} ${mix(point[1]!, to[i]![1]!).toFixed(3)}`).join(' ') + ' Z'
const leftPlayback = computed(() => polygon([[7,4],[13,8],[13,16],[7,20]], [[7,5],[10,5],[10,19],[7,19]]))
const rightPlayback = computed(() => polygon([[13,8],[20,12],[20,12],[13,16]], [[14,5],[17,5],[17,19],[14,19]]))
</script>

<template>
  <g v-if="kind === 'copy'" stroke-width="2.6">
    <Transition name="icon-swap" mode="out-in">
      <g :key="active ? 'check' : 'copy'" class="icon-swap-shape">
        <path v-if="active" d="m5 12 4 4 10-10" pathLength="1"/>
        <template v-else><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M15 4H6a2 2 0 0 0-2 2v9"/></template>
      </g>
    </Transition>
  </g>
  <g v-else-if="kind === 'playback'" fill="currentColor" stroke-width=".8">
    <path :d="leftPlayback"/><path :d="rightPlayback"/>
  </g>
  <path v-else :d="`M6 ${mix(9, 15)} L12 ${mix(15, 9)} L18 ${mix(9, 15)}`" stroke-width="2.8"/>
</template>
