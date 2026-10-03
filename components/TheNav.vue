<script setup lang="ts">
import Lenis from 'lenis'

const props = defineProps<{
  isDarkMode: boolean
  lenis: Lenis | null
}>()
const emit = defineEmits(['toggle-theme'])

const { y: scrollY } = useWindowScroll()
const isScrolledDown = computed(() => scrollY.value > 50)
const activeSection = ref('top')
const observedSections = ref<HTMLElement[]>([])
const updateActiveSection = () => {
  const guide = window.innerHeight * .35
  activeSection.value = ['about', 'projects'].find(id => {
    const section = document.getElementById(id)
    return section && section.getBoundingClientRect().top <= guide
  }) || 'top'
}
watch(scrollY, updateActiveSection)
useEventListener('resize', updateActiveSection)
useResizeObserver(observedSections, updateActiveSection)
onMounted(() => {
  observedSections.value = Array.from(document.querySelectorAll<HTMLElement>('#top, #projects, #about'))
  updateActiveSection()
})

const scrollToAnchor = useSectionNavigation(() => props.lenis)
</script>

<template>
  <nav id="top-nav" aria-label="メインナビゲーション" :inert="!isScrolledDown" class="tw:fixed tw:top-0 tw:left-0 tw:z-[1500] tw:flex tw:w-full tw:items-center tw:justify-center tw:px-6 tw:py-4 tw:shadow-[0_2px_10px_var(--shadow-color)] tw:backdrop-blur-[10px] tw:transition-[opacity,transform] tw:duration-300" :class="[isScrolledDown ? 'tw:pointer-events-auto tw:translate-y-0 tw:opacity-100' : 'tw:pointer-events-none tw:-translate-y-full tw:opacity-0', props.isDarkMode ? 'tw:bg-[rgba(18,18,18,0.8)]' : 'tw:bg-[rgba(255,255,255,0.8)]']">
    <SelectionTrack class="nav-links tw:flex tw:gap-12" :active="activeSection">
      <a class="tw:bg-none tw:text-[1.1rem] tw:font-bold tw:text-[var(--active-text)] tw:no-underline tw:transition-colors tw:duration-[400ms] tw:[font-family:var(--font-display)]" data-selection="top" :aria-current="activeSection === 'top' ? 'location' : undefined" href="#top" @click="scrollToAnchor($event, '#top')">Home</a>
      <a class="tw:bg-none tw:text-[1.1rem] tw:font-bold tw:text-[var(--active-text)] tw:no-underline tw:transition-colors tw:duration-[400ms] tw:[font-family:var(--font-display)]" data-selection="projects" :aria-current="activeSection === 'projects' ? 'location' : undefined" href="#projects" @click="scrollToAnchor($event, '#projects')">Projects</a>
      <a class="tw:bg-none tw:text-[1.1rem] tw:font-bold tw:text-[var(--active-text)] tw:no-underline tw:transition-colors tw:duration-[400ms] tw:[font-family:var(--font-display)]" data-selection="about" :aria-current="activeSection === 'about' ? 'location' : undefined" href="#about" @click="scrollToAnchor($event, '#about')">About</a>
    </SelectionTrack>
    <div class="nav-theme-controls"><SoundControls /><ThemeControls :is-dark-mode="isDarkMode" @toggle-theme="emit('toggle-theme')" /></div>
  </nav>
</template>
