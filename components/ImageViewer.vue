<script setup lang="ts">
import ProjectGalleryImage from './ProjectGalleryImage.vue'
import { useGallerySwipe } from '~/composables/useGallerySwipe'

const props = withDefaults(defineProps<{ src: string | null; alt: string; returnFocus?: HTMLElement | null; index?: number; count?: number; direction?: number }>(), { index: 0, count: 1, direction: 1 })
const emit = defineEmits<{ close: []; step: [direction: number]; select: [index: number] }>()
const gallerySwipe = useGallerySwipe(() => props.count > 1, direction => emit('step', direction))
const { style: gallerySwipeStyle, dragging: galleryDragging } = gallerySwipe
const viewport = ref<HTMLElement | null>(null), imageBusy = ref(true)
const zoom = useImageZoom(viewport, () => !imageBusy.value, gallerySwipe)
const { style: zoomStyle, scale: zoomScale, dragging: zoomDragging } = zoom
watch(() => props.src, () => { zoom.reset(); imageBusy.value = true })
useDialogFocus(computed(() => Boolean(props.src)), '.image-viewer', () => emit('close'), () => props.returnFocus || null)
const navigate = (event: KeyboardEvent) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (['+', '=', '-', '0'].includes(event.key)) {
    event.preventDefault()
    zoom.change(event.key === '0' ? 1 : zoomScale.value + (event.key === '-' ? -.5 : .5))
    return
  }
  if (props.count < 2) return
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') emit('step', event.key === 'ArrowLeft' ? -1 : 1)
  else emit('select', event.key === 'Home' ? 0 : props.count - 1)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="image-viewer">
      <div v-if="src" class="image-viewer" :class="{ 'is-single-image': count < 2 }" tabindex="-1" role="dialog" aria-modal="true" aria-label="画像を拡大表示" data-lenis-prevent :style="{ '--gallery-direction': direction }" @click.self="emit('close')" @keydown="navigate">
        <button class="project-modal-close image-viewer-close" type="button" aria-label="拡大表示を閉じる" data-tooltip="閉じる（Esc）" @click="emit('close')"><SiteIcon name="close" :size="24"/></button>
        <div class="image-viewer-zoom" role="group" aria-label="画像のズーム">
          <button class="icon-button" type="button" :disabled="imageBusy || zoomScale <= 1" aria-label="画像を縮小" data-tooltip="縮小（−）" @click="zoom.change(zoomScale - .5)"><SiteIcon name="zoom-out" :size="20"/></button>
          <button class="image-zoom-reset" type="button" :disabled="imageBusy" aria-label="表示倍率を100%に戻す" data-tooltip="100%に戻す（0）" @click="zoom.change(1)">{{ Math.round(zoomScale * 100) }}%</button>
          <button class="icon-button" type="button" :disabled="imageBusy || zoomScale >= 4" aria-label="画像を拡大" data-tooltip="拡大（＋）" @click="zoom.change(zoomScale + .5)"><SiteIcon name="zoom-in" :size="20"/></button>
        </div>
        <div ref="viewport" class="image-viewer-viewport" :class="{ 'is-zoomed': zoomScale > 1, 'is-panning': zoomDragging }" @wheel.prevent="zoom.wheel" @dblclick="zoom.doubleClick">
          <ProjectGalleryImage :src="src" :alt="alt" class="image-viewer-stage gallery-swipe-image" :class="{ 'can-swipe': count > 1 && zoomScale <= 1, 'is-dragging': galleryDragging }" :style="[gallerySwipeStyle, zoomStyle]" @busy="imageBusy = $event" @pointerdown="zoom.start" @pointermove="zoom.move" @pointerup="zoom.end" @pointercancel="zoom.cancel" @lostpointercapture="gallerySwipe.cancel" @click.capture="zoom.click" @dragstart.prevent @click.self="emit('close')" />
        </div>
        <div v-if="count > 1" class="image-viewer-navigation" role="group" aria-label="画像の切り替え">
          <button type="button" class="icon-button" aria-label="前の画像" data-tooltip="前の画像（←）" @click="emit('step', -1)"><SiteIcon name="chevron" class="chevron-prev" :size="22"/></button>
          <span class="image-viewer-count" role="status" aria-live="polite" aria-atomic="true">{{ index + 1 }} / {{ count }}</span>
          <button type="button" class="icon-button" aria-label="次の画像" data-tooltip="次の画像（→）" @click="emit('step', 1)"><SiteIcon name="chevron" class="chevron-next" :size="22"/></button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
