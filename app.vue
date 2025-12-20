<script setup lang="ts">
import Lenis from 'lenis'
import { useIntro } from '~/composables/useIntro'
import { useSharedObserver } from '~/composables/useSharedObserver'

useSeoMeta({
  title: "yexe/(*'▽') Portfolio | yexe.net",
  description: "y_exe (yexe) のポートフォリオ。",
  author: 'y_exe',
  ogTitle: "y_exe's Portfolio",
  ogType: 'website',
  ogUrl: 'https://yexe.net/',
  ogImage: 'https://yexe.net/icon.webp',
  ogSiteName: 'yexe.net',
  twitterCard: 'summary_large_image',
  twitterSite: '@y__exe',
})

const isLoading = ref(true)
const isFadeOut = ref(false)
const loadingProgress = ref(0)
const isLoaded = ref(false)
const isDarkMode = ref(false)
const showPgpModal = ref(false)
const toastData = ref({ show: false, message: '' })

const { introElements, isHeaderIntroDone } = useIntro()
const { y: scrollY } = useWindowScroll()
const isScrolledEnough = computed(() => scrollY.value > 300)

let lenis: Lenis | null = null

const { data: projects, status: projectStatus } = await useFetch('https://api.github.com/users/y-exe/repos', {
  query: { sort: 'updated', per_page: 9 },
  transform: (repos: any[]) => repos.filter(repo => !repo.fork),
  lazy: true,
  server: false
})

const nuxtApp = useNuxtApp()

const startIntroSequence = () => {
  const { getObservers } = useSharedObserver()
  const { revealObserver, textObserver } = getObservers()

  const sortedElements = introElements.value.sort((a, b) => {
    return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
  })

  sortedElements.forEach((el, index) => {
    const isHeader = el.classList.contains('header-fixed-item')
    
    setTimeout(() => {
      if (isHeader) {
        const headerCount = sortedElements.filter(e => e.classList.contains('header-fixed-item')).length
        const currentHeaderIndex = sortedElements.filter(e => e.classList.contains('header-fixed-item')).indexOf(el)
        if (currentHeaderIndex === headerCount - 1) {
          isHeaderIntroDone.value = true 
        }
      } else {
        el.classList.add('is-visible')
        
        setTimeout(() => {
          if (el.dataset.splitText !== undefined) textObserver?.observe(el)
          else revealObserver?.observe(el)
        }, 1000)
      }
    }, index * 60) 
  })
}

const toggleDarkMode = (event: MouseEvent | null, forceDark?: boolean) => {
  const nextState = forceDark !== undefined ? forceDark : !isDarkMode.value
  const update = () => {
    isDarkMode.value = nextState
    if(import.meta.client) {
      document.body.classList.toggle('dark-mode', nextState)
      localStorage.setItem('theme', nextState ? 'dark' : 'light')
    }
  }
  if (event && document.startViewTransition) {
    document.documentElement.style.setProperty('--clip-x', event.clientX + 'px')
    document.documentElement.style.setProperty('--clip-y', event.clientY + 'px')
    document.startViewTransition(update)
  } else { update() }
}

const scrollToAnchor = (e: Event, id: string) => {
  e.preventDefault()
  if (!lenis) return
  const target = id === '#top' || id === '#' ? 0 : document.querySelector(id) as HTMLElement
  if (target !== null) lenis.scrollTo(target, { duration: 1.5, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) })
}

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark') toggleDarkMode(null, true)

  lenis = new Lenis()
  const raf = (time: number) => { lenis?.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf)

  const interval = setInterval(() => {
    loadingProgress.value += 2
    if (loadingProgress.value >= 100) {
      loadingProgress.value = 100
      clearInterval(interval)
      setTimeout(() => {
        isFadeOut.value = true
        setTimeout(() => {
          isLoading.value = false
          isLoaded.value = true
          
          nextTick(() => startIntroSequence())
        }, 800)
      }, 200)
    }
  }, 20)
})
</script>

<template>
  <div>
    <MouseStalker />
    <TheLoading :is-loading="isLoading" :is-fade-out="isFadeOut" :progress="loadingProgress" />

    <div v-if="isLoaded">
      <FixedHeader />
      <TheNav :is-dark-mode="isDarkMode" :lenis="lenis" @toggle-theme="toggleDarkMode" />

      <main>
        <HeroSection :on-scroll-to="scrollToAnchor" @open-pgp="showPgpModal = true" />
        <ProjectsSection :projects="projects" :status="projectStatus" />
        <AboutSection />
      </main>
    </div>

    <PgpModal v-model="showPgpModal" />
    <TheToast :data="toastData" />
    
    <a href="#top" id="back-to-top" :class="{ 'visible': isScrolledEnough }" @click="scrollToAnchor($event, '#top')">
      <i class="fa-solid fa-arrow-up"></i>
    </a>
    <div id="scroll-trigger" style="position: absolute; top: 100vh; height: 1px; width: 100%; pointer-events: none;"></div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.intro-sequence {
  opacity: 0;
  transform: translateY(60px);
  transition: opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1), transform 1.5s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

.intro-sequence[data-reveal="down"] {
  transform: translateY(-60px);
}

.intro-sequence.is-visible {
  opacity: 1;
  transform: translateY(0);
}

[data-split-text]:not(.is-visible) .char {
  opacity: 0;
  transform: translateY(100%);
}
</style>