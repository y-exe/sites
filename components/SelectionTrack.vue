<script setup lang="ts">
import { createSpring } from '~/utils/spring'

const props = defineProps<{ active: string }>()
const root = ref<HTMLElement | null>(null)
const marker = ref<HTMLElement | null>(null)
const selections = ref<HTMLElement[]>([])
let spring: ReturnType<typeof createSpring<'x' | 'y' | 'width' | 'height'>> | undefined

const observeSelections = () => {
  const elements = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-selection]') || [])
  if (elements.length !== selections.value.length || elements.some((element, index) => element !== selections.value[index])) selections.value = elements
}

const positionMarker = () => {
  const target = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-selection]') || [])
    .find(el => el.dataset.selection === props.active)
  if (!marker.value) return
  if (!target || !target.offsetWidth || !target.offsetHeight) { marker.value.style.opacity = '0'; return }
  marker.value.style.opacity = '1'
  const bounds = { x: target.offsetLeft, y: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight }
  if (!spring) {
    spring = createSpring(bounds, ({ x, y, width, height }) => {
      if (!marker.value) return
      Object.assign(marker.value.style, { translate: `${x}px ${y}px`, width: `${width}px`, height: `${height}px` })
    }, { stiffness: 310, damping: 24 })
    Object.assign(marker.value.style, { translate: `${bounds.x}px ${bounds.y}px`, width: `${bounds.width}px`, height: `${bounds.height}px` })
    marker.value.style.opacity = '1'
  } else spring.to(bounds)
}

watch(() => props.active, () => nextTick(positionMarker))
useResizeObserver(root, positionMarker)
useResizeObserver(selections, positionMarker)
onMounted(() => { observeSelections(); positionMarker(); document.fonts.ready.then(positionMarker) })
onUpdated(() => { observeSelections(); positionMarker() })
onUnmounted(() => spring?.stop())
</script>

<template>
  <div ref="root" class="selection-track">
    <span ref="marker" class="selection-marker" aria-hidden="true"></span>
    <slot />
  </div>
</template>
