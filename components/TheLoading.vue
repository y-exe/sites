<script setup lang="ts">
const props = defineProps<{ isLoading: boolean; isFadeOut: boolean; progress: number }>()
</script>

<template>
  <div id="loading" class="tw:fixed tw:inset-0 tw:z-[10001] tw:flex tw:flex-col tw:items-center tw:justify-center tw:bg-black tw:text-white tw:transition-opacity tw:duration-1000 tw:ease-in-out" :class="isFadeOut ? 'tw:pointer-events-none tw:opacity-0' : 'tw:opacity-100'" v-if="isLoading">
    <span id="loading-percentage" class="tw:text-[3em] tw:[font-family:var(--font-mono)]">{{ progress }}%</span>
    <div id="loading-text" class="tw:mt-[0.5em] tw:text-[1.2em] tw:[font-family:var(--font-sans)]">ま、こんなサイトなんもないんですけどね()</div>
  </div>
</template>
