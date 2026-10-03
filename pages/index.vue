<script setup lang="ts">
import Lenis from 'lenis'
import { useIntro } from '~/composables/useIntro'
import { useSharedObserver } from '~/composables/useSharedObserver'
import { otherContactLogoUrls } from '~/utils/preload-assets'
import { provide, watch } from 'vue'

useSeoMeta({
  title: "yexe/(*'▽') Portfolio | yexe.net",
  description: "y_exe (yexe) のポートフォリオ。開発したプロジェクト、使用技術 (Python, TypeScript, Next.js等)、各種SNSへのリンクを掲載しています。",
  author: 'y_exe',
  ogTitle: "y_exe's Portfolio",
  ogDescription: "y_exe (yexe) のポートフォリオサイト。",
  ogType: 'website',
  ogUrl: 'https://yexe.net/',
  ogImage: 'https://yexe.net/icon.webp',
  ogSiteName: 'yexe.net',
  twitterCard: 'summary_large_image',
  twitterSite: '@y__exe',
})

useHead({
  htmlAttrs: { lang: 'ja' },
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
          "@type": "Person",
          "name": "y_exe",
          "image": "https://yexe.net/icon.webp",
          "url": "https://yexe.net"
        }
      })
    }
  ]
})

const isLoading = ref(true)
const isFadeOut = ref(false)
const loadingProgress = ref(0)
const isLoaded = ref(false)
const isWindowLoaded = ref(false)
const { isDarkMode, toggleDarkMode } = useSiteTheme()
const showPgpModal = ref(false)
const { toast: toastData } = useSiteToast()
const { introElements, isHeaderIntroDone } = useIntro()
const { y: scrollY } = useWindowScroll()
const isScrolledEnough = computed(() => scrollY.value > 300)
const lenis = shallowRef<Lenis | null>(null)
let frame = 0
let sectionObserver: IntersectionObserver | undefined
const timers: ReturnType<typeof setTimeout>[] = []
let loadingInterval: ReturnType<typeof setInterval> | undefined
let removeLoadListener: (() => void) | undefined
const schedule = (callback: () => void, delay: number) => { timers.push(setTimeout(callback, delay)) }
onUnmounted(() => { cancelAnimationFrame(frame); lenis.value?.destroy(); sectionObserver?.disconnect(); timers.forEach(clearTimeout); clearInterval(loadingInterval); removeLoadListener?.() })

const preloadImages = (urls: string[], timeoutMs = 5000) => {
  const uniqueUrls = [...new Set(urls)]

  return Promise.allSettled(uniqueUrls.map(url => new Promise<void>((resolve) => {
    const image = new Image()
    const timeout = window.setTimeout(resolve, timeoutMs)
    const finish = () => {
      window.clearTimeout(timeout)
      resolve()
    }

    image.onload = finish
    image.onerror = finish
    image.src = url
  })))
}

const themeTriggerEl = ref<HTMLElement | null>(null)
const registerThemeTrigger = (el: HTMLElement) => {
  themeTriggerEl.value = el
}
provide('registerThemeTrigger', registerThemeTrigger)

const { data: projects, status: projectStatus } = await useFetch('/api/github', {
  query: { resource: 'repos' },
  transform: (repos: any[]) => Array.isArray(repos) ? repos.filter(repo => !repo.fork) : [],
  default: () => [],
  lazy: true,
  server: false
})

const startIntroSequence = () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const { getObservers } = useSharedObserver()
  const { revealObserver, textObserver } = getObservers()
  const sortedElements = [...introElements.value].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1)
  sortedElements.forEach((el, index) => {
    const isHeader = el.classList.contains('header-fixed-item')
    schedule(() => {
      if (isHeader) {
        const headerCount = sortedElements.filter(e => e.classList.contains('header-fixed-item')).length
        const currentHeaderIndex = sortedElements.filter(e => e.classList.contains('header-fixed-item')).indexOf(el)
        if (currentHeaderIndex === headerCount - 1) isHeaderIntroDone.value = true
      } else {
        el.classList.add('is-visible')
        schedule(() => {
          if (el.dataset.splitText !== undefined) textObserver?.observe(el)
          else revealObserver?.observe(el)
        }, 1000)
      }
    }, reduced ? 0 : index * 55)
  })
}

const scrollToAnchor = (e: Event, id: string) => {
  e.preventDefault()
  const target = id === '#top' || id === '#' ? 0 : document.querySelector(id) as HTMLElement
  if (target === null) return
  if (lenis.value) lenis.value.scrollTo(target, { duration: 1.2 })
  else if (target === 0) window.scrollTo({ top: 0, behavior: 'instant' })
  else target.scrollIntoView({ behavior: 'instant' })
}

watch(themeTriggerEl, (newEl) => {
  if (newEl) {
    sectionObserver?.disconnect()
    sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        document.body.classList.toggle('theme-2', entry.boundingClientRect.top < 0)
      })
    }, { threshold: [0, 1] })
    sectionObserver.observe(newEl)
  }
})

watch(showPgpModal, (isOpen) => {
  if (!import.meta.client || !lenis.value) return
  if (isOpen) lenis.value?.stop()
  else lenis.value?.start()
})

onMounted(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduced) lenis.value = new Lenis()
  if (showPgpModal.value) lenis.value?.stop()
  const raf = (time: number) => { lenis.value?.raf(time); frame = requestAnimationFrame(raf) }
  if (lenis.value) frame = requestAnimationFrame(raf)
  let modalIconsLoaded = false
  const loadingStarted = performance.now()

  preloadImages(otherContactLogoUrls).then(() => {
    modalIconsLoaded = true
  })

  const onWindowLoad = () => {
    isWindowLoaded.value = true
  }

  if (document.readyState === 'complete') {
    onWindowLoad()
  } else {
    window.addEventListener('load', onWindowLoad)
  }

  removeLoadListener = () => window.removeEventListener('load', onWindowLoad)
  loadingInterval = setInterval(() => {
    if (performance.now() - loadingStarted < 2500 && (!isWindowLoaded.value || !modalIconsLoaded) && loadingProgress.value >= 85) {
      if (loadingProgress.value < 99 && Math.random() < 0.05) {
        loadingProgress.value += 1
      }
      return
    }

    loadingProgress.value += 2
    if (loadingProgress.value >= 100) {
      loadingProgress.value = 100
      clearInterval(loadingInterval)
      window.removeEventListener('load', onWindowLoad)

      schedule(() => {
        isFadeOut.value = true
        schedule(() => {
          isLoading.value = false
          isLoaded.value = true
          nextTick(() => startIntroSequence())
        }, 1000)
      }, 200)
    }
  }, 20)
})
</script>

<template>
  <div>
    <TheLoading :is-loading="isLoading" :is-fade-out="isFadeOut" :progress="loadingProgress" />

    <div :style="!isLoaded ? { height: '100vh', overflow: 'hidden' } : {}">
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
    <SiteTooltip />

    <a href="#top" id="back-to-top" aria-label="トップに戻る" data-tooltip="トップに戻る" :tabindex="isScrolledEnough ? 0 : -1" :class="{ 'visible': isScrolledEnough }" @click="scrollToAnchor($event, '#top')">
      <SiteIcon name="up" :size="22"/>
    </a>
  </div>
</template>
