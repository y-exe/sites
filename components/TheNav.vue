<script setup lang="ts">
import Lenis from 'lenis'

const props = defineProps<{
  isDarkMode: boolean
  lenis: Lenis | null
}>()
const emit = defineEmits(['toggle-theme'])

const { y: scrollY } = useWindowScroll()
const isScrolledDown = computed(() => scrollY.value > 50)

const scrollToAnchor = (e: Event, id: string) => {
  e.preventDefault()
  if (!props.lenis) return
  const target = id === '#top' || id === '#' ? 0 : document.querySelector(id) as HTMLElement
  if (target !== null) props.lenis.scrollTo(target, { duration: 1.5, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) })
}
</script>

<template>
  <nav id="top-nav" :class="{ visible: isScrolledDown }">
    <div class="nav-links">
      <a href="#top" @click="scrollToAnchor($event, '#top')">Home</a>
      <a href="#projects" @click="scrollToAnchor($event, '#projects')">Projects</a>
      <a href="#about" @click="scrollToAnchor($event, '#about')">About</a>
    </div>
    <button id="dark-mode-toggle" @click="emit('toggle-theme', $event)">
      <i class="fa-solid" :class="props.isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
    </button>
  </nav>
</template>