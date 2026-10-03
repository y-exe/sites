<script setup lang="ts">
import ThemeGlyph from '~/components/ThemeGlyph.vue'
defineProps<{ isDarkMode: boolean }>()
const emit = defineEmits(['toggle-theme'])
</script>
<template>
  <div class="theme-controls">
    <button class="icon-button theme-toggle" type="button" :aria-pressed="isDarkMode" :aria-label="isDarkMode ? 'ライトモードに切り替える' : 'ダークモードに切り替える'" :data-tooltip="isDarkMode ? 'ライトモードに切り替える' : 'ダークモードに切り替える'" @click="emit('toggle-theme')"><ThemeGlyph :sun="isDarkMode" /></button>
  </div>
</template>
