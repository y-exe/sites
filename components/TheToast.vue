<script setup lang="ts">
const props = defineProps<{ data: { show: boolean; message: string } }>()
</script>

<template>
  <div id="toast-notification" :class="{ show: data.show }">
    {{ data.message }}
  </div>
</template>