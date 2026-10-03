<script setup lang="ts">
import { getDecodedGalleryImage, rememberDecodedGalleryImage } from '~/utils/gallery-image-cache'

const props = defineProps<{ src: string; alt: string }>()
const emit = defineEmits<{ busy: [value: boolean] }>()
const displayed = ref<{ src: string; alt: string } | null>(null)
const loading = ref(false)
const failed = ref(false)
const retry = ref(0)

onMounted(() => {
  watch(() => [props.src, retry.value], async (_, __, onCleanup) => {
    const src = props.src
    const alt = props.alt
    if (getDecodedGalleryImage(src)) {
      displayed.value = { src, alt }
      failed.value = false
      loading.value = false
      emit('busy', false)
      return
    }
    let cancelled = false
    const image = new Image()
    let deadline: ReturnType<typeof setTimeout> | undefined
    const timer = setTimeout(() => { loading.value = true }, 180)
    onCleanup(() => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(deadline)
      image.onload = null
      image.onerror = null
    })
    failed.value = false
    loading.value = false
    emit('busy', true)
    try {
      await new Promise<void>((resolve, reject) => {
        deadline = setTimeout(() => reject(new Error('Image timed out')), 15000)
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Image unavailable'))
        image.src = src
      })
      await image.decode()
      if (!cancelled) {
        rememberDecodedGalleryImage(src, image)
        displayed.value = { src, alt }
      }
    } catch {
      if (!cancelled) failed.value = true
    } finally {
      clearTimeout(timer)
      clearTimeout(deadline)
      if (!cancelled) {
        loading.value = false
        emit('busy', failed.value)
      }
    }
  }, { immediate: true })
})
</script>

<template>
  <div class="gallery-image-stage" :aria-busy="loading">
    <Transition name="gallery-image">
      <img v-if="displayed" :key="displayed.src" :src="displayed.src" :alt="displayed.alt" class="gallery-image-content" />
    </Transition>
    <Transition name="gallery-status">
      <span v-if="loading" class="gallery-loading" role="status"><span aria-hidden="true"></span><span class="tw:sr-only">画像を読み込んでいます</span></span>
      <div v-else-if="failed" class="gallery-image-error" role="status"><span>画像を読み込めませんでした</span><button type="button" @click="retry++">再読み込み</button></div>
    </Transition>
  </div>
</template>
