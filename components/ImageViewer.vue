<script setup lang="ts">
import ProjectGalleryImage from './ProjectGalleryImage.vue'
import { useGallerySwipe } from '~/composables/useGallerySwipe'

const props = withDefaults(defineProps<{ src: string | null; alt: string; returnFocus?: HTMLElement | null; index?: number; count?: number; direction?: number }>(), { index: 0, count: 1, direction: 1 })
const emit = defineEmits<{ close: []; step: [direction: number]; select: [index: number] }>()
const gallerySwipe = useGallerySwipe(() => props.count > 1, direction => emit('step', direction))
const { style: gallerySwipeStyle, dragging: galleryDragging } = gallerySwipe
useDialogFocus(computed(() => Boolean(props.src)), '.image-viewer', () => emit('close'), () => props.returnFocus || null)
const navigate = (event: KeyboardEvent) => {
  if (props.count < 2 || event.altKey || event.ctrlKey || event.metaKey) return
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') emit('step', event.key === 'ArrowLeft' ? -1 : 1)
  else emit('select', event.key === 'Home' ? 0 : props.count - 1)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="image-viewer">
      <div v-if="src" class="image-viewer" :class="{ 'is-single-image': count < 2 }" role="dialog" aria-modal="true" aria-label="画像を拡大表示" data-lenis-prevent :style="{ '--gallery-direction': direction }" @click.self="emit('close')" @keydown="navigate">
        <button class="project-modal-close image-viewer-close" type="button" aria-label="拡大表示を閉じる" data-tooltip="閉じる（Esc）" @click="emit('close')"><SiteIcon name="close" :size="24"/></button>
        <ProjectGalleryImage :src="src" :alt="alt" class="image-viewer-stage gallery-swipe-image" :class="{ 'can-swipe': count > 1, 'is-dragging': galleryDragging }" :style="gallerySwipeStyle" @pointerdown="gallerySwipe.start" @pointermove="gallerySwipe.move" @pointerup="gallerySwipe.end" @pointercancel="gallerySwipe.cancel" @lostpointercapture="gallerySwipe.cancel" @click.capture="gallerySwipe.click" @dragstart.prevent @click.self="emit('close')" />
        <div v-if="count > 1" class="image-viewer-navigation" role="group" aria-label="画像の切り替え">
          <button type="button" class="icon-button" aria-label="前の画像" data-tooltip="前の画像（←）" @click="emit('step', -1)"><SiteIcon name="chevron" class="chevron-prev" :size="22"/></button>
          <span class="image-viewer-count" role="status" aria-live="polite" aria-atomic="true">{{ index + 1 }} / {{ count }}</span>
          <button type="button" class="icon-button" aria-label="次の画像" data-tooltip="次の画像（→）" @click="emit('step', 1)"><SiteIcon name="chevron" class="chevron-next" :size="22"/></button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
