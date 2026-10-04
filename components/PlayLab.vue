<script setup lang="ts">
const { panel } = usePlayState()
const open = computed(() => panel.value !== null)
const close = () => { panel.value = null }
useDialogFocus(open, '.play-lab', close)
let previousOverflow = ''
watch(open, value => {
  if (!import.meta.client) return
  if (value) { previousOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden' }
  else document.documentElement.style.overflow = previousOverflow
})
onUnmounted(() => { if (open.value) document.documentElement.style.overflow = previousOverflow })
const titles = { letters: '文字のからくり' }
</script>
<template>
  <Teleport to="body"><Transition name="play-pop"><div v-if="panel" class="play-backdrop" data-lenis-prevent @click.self="close"><section class="play-lab" role="dialog" aria-modal="true" aria-labelledby="play-title" tabindex="-1"><header><h2 id="play-title">{{ titles[panel] }}</h2><button class="icon-button play-close" aria-label="遊びを閉じる" data-tooltip="閉じる（Esc）" type="button" @click="close"><SiteIcon name="close" :size="22"/></button></header><LetterToy/></section></div></Transition></Teleport>
</template>
