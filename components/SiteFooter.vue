<script setup lang="ts">
import { createSpring } from '~/utils/spring'
const brand = ref<HTMLElement | null>(null)
const visible = useElementVisibility(brand)
const documentVisibility = useDocumentVisibility()
const letters = new Map<HTMLElement, ReturnType<typeof createSpring<'y'>>>()
const waveTimers: ReturnType<typeof setTimeout>[] = []
const resetWave = () => {
  waveTimers.forEach(clearTimeout)
  waveTimers.length = 0
  letters.forEach(spring => spring.jump({ y: 0 }))
}
const wave = () => {
  resetWave()
  if (!visible.value || documentVisibility.value !== 'visible') return
  brand.value?.querySelectorAll<HTMLElement>('.footer-letter').forEach((el, index) => {
    let spring = letters.get(el)
    if (!spring) {
      spring = createSpring({ y: 0 }, value => { el.style.transform = `translateY(${value.y}px)` }, { stiffness: 320, damping: 16 })
      letters.set(el, spring)
    }
    waveTimers.push(setTimeout(() => spring!.kick({ y: -220 }), index * 35))
  })
}
watch([visible, documentVisibility], ([inView, visibility]) => {
  if (inView && visibility === 'visible') wave()
  else resetWave()
})
const { copy } = useSiteToast()
const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined
const copySite = async () => {
  copied.value = await copy('https://yexe.net/', 'サイトのURLをコピーしました')
  if (copied.value) wave()
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => { copied.value = false }, 1800)
}
onUnmounted(() => { clearTimeout(resetTimer); resetWave(); letters.forEach(spring => spring.stop()) })
</script>

<template>
  <footer class="footer site-footer">
    <div ref="brand" class="footer-brand" v-reveal><p class="footer-logo" aria-label="yexe.net" @pointerenter="wave"><span v-for="(letter, i) in 'yexe.net'" :key="i" class="footer-letter" aria-hidden="true">{{ letter }}</span></p><button class="icon-button" type="button" :aria-label="copied ? 'コピーしました' : 'サイトのURLをコピー'" :data-tooltip="copied ? 'コピーしました' : 'サイトのURLをコピー'" @click="copySite"><SiteIcon :name="copied ? 'check' : 'copy'" :size="17"/></button></div>
    <p class="footer-copyright" v-reveal>Copyright © {{ new Date().getFullYear() }} yexe</p>
  </footer>
</template>
