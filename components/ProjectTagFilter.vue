<script setup lang="ts">
const props = defineProps<{ active: string; tags: { name: string; count: number }[]; total: number }>()
const emit = defineEmits<{ select: [tag: string] }>()
const viewport = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const canScrollBack = ref(false)
const canScrollForward = ref(false)
const reducedMotion = usePreferredReducedMotion()

const updateScroll = () => {
  const element = viewport.value
  if (!element) return
  canScrollBack.value = element.scrollLeft > 1
  canScrollForward.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
}
const scrollTags = (direction: number) => {
  const element = viewport.value
  if (!element) return
  element.scrollBy({ left: direction * Math.max(160, element.clientWidth * .7), behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
}
const revealSelection = async () => {
  await nextTick()
  const element = viewport.value
  const active = track.value?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!element || !active) return
  const bounds = element.getBoundingClientRect()
  const selected = active.getBoundingClientRect()
  const offset = selected.left < bounds.left + 4 ? selected.left - bounds.left - 4
    : selected.right > bounds.right - 4 ? selected.right - bounds.right + 4 : 0
  if (offset) element.scrollBy({ left: offset, behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
  updateScroll()
}
watch(() => props.active, revealSelection)
watch(() => props.tags, revealSelection, { flush: 'post' })
useResizeObserver(viewport, updateScroll)
useResizeObserver(track, updateScroll)
onMounted(updateScroll)
</script>

<template>
  <div class="project-tag-carousel">
    <button class="project-tag-arrow" type="button" aria-label="前のタグを表示" aria-controls="project-tag-list" :disabled="!canScrollBack" @click="scrollTags(-1)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg></button>
    <div id="project-tag-list" ref="viewport" class="project-tag-viewport" :class="{ 'can-scroll-back': canScrollBack, 'can-scroll-forward': canScrollForward }" @scroll.passive="updateScroll">
      <div ref="track" class="project-filters" role="group" aria-label="タグで絞り込む">
        <button type="button" :aria-pressed="active === 'all'" @click="emit('select', 'all')">すべて<span class="filter-count">{{ total }}</span></button>
        <button v-for="tag in tags" :key="tag.name" type="button" :aria-pressed="active === tag.name" @click="emit('select', tag.name)">#{{ tag.name }}<span class="filter-count">{{ tag.count }}</span></button>
      </div>
    </div>
    <button class="project-tag-arrow" type="button" aria-label="次のタグを表示" aria-controls="project-tag-list" :disabled="!canScrollForward" @click="scrollTags(1)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></button>
  </div>
</template>
