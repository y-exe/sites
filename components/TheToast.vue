<script setup lang="ts">
const props = defineProps<{ data: { show: boolean; message: string } }>()
</script>

<template>
  <div id="toast-notification" class="tw:fixed tw:bottom-[-100px] tw:left-1/2 tw:z-[3000] tw:-translate-x-1/2 tw:rounded-full tw:bg-[#222] tw:px-5 tw:py-3 tw:text-[0.95em] tw:text-white tw:shadow-[0_5px_15px_rgba(0,0,0,0.2)] tw:transition-[bottom] tw:duration-500 tw:[transition-timing-function:var(--ease-out-expo)]" :class="{ 'tw:bottom-[30px]': data.show }">
    {{ data.message }}
  </div>
</template>
