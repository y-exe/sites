<script setup lang="ts">
const brand = ref<HTMLElement | null>(null)
const word = useElasticWord(brand)
const { panel } = usePlayState()
const hold = useHoldAction(() => { word.reset(); panel.value = 'letters' })
const { copy } = useSiteToast()
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined
const copySite = async () => {
  copied.value = await copy('https://yexe.net/', 'サイトのURLをコピーしました')
  if (copied.value) word.wave()
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => { copied.value = false }, 1800)
}
onUnmounted(() => { clearTimeout(resetTimer) })
</script>

<template>
  <footer class="footer site-footer">
    <div class="footer-brand" v-reveal><button ref="brand" class="footer-logo" type="button" aria-label="yexe.netの文字を弾ませる" @pointerenter="word.wave" @pointerdown="hold.start($event); word.start($event)" @pointermove="hold.move($event); word.move($event)" @pointerup="hold.cancel(); word.end($event)" @pointercancel="hold.cancel(); word.reset()" @lostpointercapture="word.end" @click="hold.activate($event); if (!$event.defaultPrevented) word.click($event)" @contextmenu.prevent @keydown.down.prevent="panel = 'letters'" aria-description="長押し、または下矢印で文字のからくりを開く"><span v-for="(letter, i) in 'yexe.net'" :key="i" class="footer-letter" aria-hidden="true">{{ letter }}</span></button><button class="icon-button" type="button" :aria-label="copied ? 'コピーしました' : 'サイトのURLをコピー'" :data-tooltip="copied ? 'コピーしました' : 'サイトのURLをコピー'" @click="copySite"><SiteIcon :name="copied ? 'check' : 'copy'" :size="17"/></button></div>
    <div class="footer-copyright-line" v-reveal><p class="footer-copyright">Copyright © <VaultEntry/> yexe</p></div>
  </footer>
</template>
