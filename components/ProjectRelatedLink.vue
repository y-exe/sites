<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ href: string }>()
const failed = ref(false)
const url = computed(() => {
  try { return new URL(props.href) } catch { return null }
})
const label = computed(() => url.value ? `${url.value.host}${url.value.pathname === '/' ? '' : url.value.pathname}` : props.href)
const favicon = computed(() => url.value ? `https://www.google.com/s2/favicons?domain=${url.value.hostname}&sz=32` : '')
watch(favicon, () => { failed.value = false })
</script>

<template>
  <a class="project-modal-link-chip project-modal-link-in tw:my-[0.6rem] tw:flex tw:w-fit tw:max-w-full tw:min-w-0 tw:items-center tw:gap-2 tw:overflow-hidden tw:rounded-full tw:bg-[#cecfd9] tw:px-[0.72rem] tw:py-[0.42rem] tw:text-left tw:text-[0.76rem] tw:font-bold tw:leading-[1.35] tw:text-[#4f4e69] tw:no-underline tw:transition-[color,background] tw:duration-300 tw:hover:bg-[#bfc0cc]" :href="href" :data-tooltip="href" :aria-label="`${label}（新しいタブで開く）`" target="_blank" rel="noopener noreferrer">
    <img v-if="favicon && !failed" class="tw:size-4 tw:shrink-0 tw:rounded-full" :src="favicon" alt="" @error="failed = true" />
    <SiteIcon v-else name="link" :size="16" />
    <span class="tw:min-w-0 tw:flex-1 tw:truncate tw:whitespace-nowrap tw:text-left">{{ label }}</span>
    <SiteIcon class="project-related-external" name="external" :size="13" />
  </a>
</template>
