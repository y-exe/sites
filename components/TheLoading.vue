<script setup lang="ts">
const props = defineProps<{ isLoading: boolean; isFadeOut: boolean; progress: number }>()
</script>

<template>
  <div id="loading" :class="{ 'fade-out': isFadeOut }" v-if="isLoading">
    <span id="loading-percentage">{{ progress }}%</span>
    <div id="loading-text">ま、こんなサイトなんもないんですけどね()</div>
  </div>
</template>