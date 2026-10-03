<script setup lang="ts">
import { languageIcons } from '~/utils/language-icons'
import ProjectGalleryImage from './ProjectGalleryImage.vue'
import { useGallerySwipe } from '~/composables/useGallerySwipe'
import { computed, inject, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{ projects: any[] | null; status: string; requestedProject?: string | null }>()
const emit = defineEmits<{ retry: []; 'close-link': [] }>()
const { copy } = useSiteToast()
const projectLinkCopied = ref(false)
let projectLinkTimer: ReturnType<typeof setTimeout> | undefined
let linkedProjectName: string | null = null
const selectedLanguage = ref('all')
const projectGrid = ref<HTMLElement | null>(null)
const projectGridHeight = ref<string>()
const isFiltering = ref(false)
let filterMotionTimer: ReturnType<typeof setTimeout> | undefined
watch(selectedLanguage, () => {
  isFiltering.value = true
  clearTimeout(filterMotionTimer)
  filterMotionTimer = setTimeout(() => { isFiltering.value = false }, 750)
}, { flush: 'sync' })
useResizeObserver(projectGrid, entries => {
  const height = entries[0]?.borderBoxSize[0]?.blockSize
  if (height !== undefined) projectGridHeight.value = `${height}px`
})
const lockProjectResult = (element: Element) => {
  const el = element as HTMLElement
  const rect = el.getBoundingClientRect()
  const parent = el.parentElement?.getBoundingClientRect()
  if (!parent) return
  Object.assign(el.style, { width: `${rect.width}px`, height: `${rect.height}px`, left: `${rect.left - parent.left}px`, top: `${rect.top - parent.top}px` })
  el.inert = true
}
const releaseProjectResult = (element: Element) => {
  const el = element as HTMLElement
  Object.assign(el.style, { width: '', height: '', left: '', top: '' })
  el.inert = false
}
const projectLanguages = computed(() => {
  const counts = new Map<string, number>()
  props.projects?.forEach(repo => { if (repo.language) counts.set(repo.language, (counts.get(repo.language) || 0) + 1) })
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})
const filteredProjects = computed(() => {
  return (props.projects || []).filter(repo =>
    selectedLanguage.value === 'all' || repo.language === selectedLanguage.value
  )
})
watch(projectLanguages, languages => {
  if (selectedLanguage.value !== 'all' && !languages.some(language => language.name === selectedLanguage.value)) selectedLanguage.value = 'all'
})
const resetProjectFilters = () => { selectedLanguage.value = 'all' }

const themeTriggerRef = ref<HTMLElement | null>(null)
const registerThemeTrigger = inject<(el: HTMLElement) => void>('registerThemeTrigger')
type ProjectDetails = { description: string; images: string[]; shields: string[]; commitTrend: string }
const projectDetails = ref<Record<string | number, ProjectDetails>>({})
const selectedProject = ref<any | null>(null)
const projectReturnFocus = ref<HTMLElement | null>(null)
useDialogFocus(computed(() => Boolean(selectedProject.value)), '.project-modal-overlay', () => closeProject(), () => projectReturnFocus.value)
const currentProjectImageIndex = ref(0)
const imageDirection = ref(1)
const isImageViewerOpen = ref(false)
const galleryExpand = ref<HTMLButtonElement | null>(null)
const galleryThumbnails = ref<HTMLElement | null>(null)
const galleryImageBusy = ref(true)
const carouselPlaying = ref(true)
const reducedMotion = usePreferredReducedMotion()
const revealSelectedThumbnail = () => {
  const strip = galleryThumbnails.value
  const active = strip?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!strip || !active) return
  const left = active.offsetLeft - 4
  const right = active.offsetLeft + active.offsetWidth + 4
  const target = left < strip.scrollLeft ? left : right > strip.scrollLeft + strip.clientWidth ? right - strip.clientWidth : strip.scrollLeft
  strip.scrollTo({ left: Math.max(0, Math.min(target, strip.scrollWidth - strip.clientWidth)), behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
}
watch(currentProjectImageIndex, revealSelectedThumbnail, { flush: 'post' })
useResizeObserver(galleryThumbnails, revealSelectedThumbnail)
watch(reducedMotion, value => { if (value === 'reduce') { carouselPlaying.value = false; stopProjectCarousel() } })
const carouselHovered = ref(false)
const carouselFocused = ref(false)
const carouselInteracting = computed(() => carouselHovered.value || carouselFocused.value || gallerySwipe.dragging.value)
const carouselCycle = ref(0)
const projectHeroParallax = ref({ x: 0, y: 0 })
let projectCarouselTimer: ReturnType<typeof setInterval> | undefined

const githubRequest = async (resource: string, repo?: string) => {
  const query = new URLSearchParams({ resource })
  if (repo) query.set('repo', repo)
  const response = await fetch(`/api/github?${query}`)
  if (!response.ok) throw new Error('GitHub request failed')
  return response.json()
}

const relativeUpdate = (date: string) => {
  const elapsed = Math.max(0, Date.now() - new Date(date).getTime())
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}日前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}か月前`
  return `${Math.floor(months / 12)}年前`
}

const openProject = (repo: any, fromLink = false) => {
  projectReturnFocus.value = fromLink ? document.getElementById('projects') : document.activeElement as HTMLElement
  if (!fromLink && props.requestedProject) { linkedProjectName = null; emit('close-link') }
  selectedProject.value = repo
}

const closeProject = () => {
  selectedProject.value = null
  linkedProjectName = null
  if (props.requestedProject) emit('close-link')
}

const copyProjectLink = async () => {
  if (!selectedProject.value) return
  const url = new URL('/', window.location.origin)
  url.searchParams.set('project', selectedProject.value.name)
  url.hash = 'projects'
  projectLinkCopied.value = await copy(url.href, 'プロジェクトのURLをコピーしました')
  clearTimeout(projectLinkTimer)
  projectLinkTimer = setTimeout(() => { projectLinkCopied.value = false }, 2200)
}

const projectHeroParallaxStyle = computed(() => ({
  transform: `translate3d(${projectHeroParallax.value.x}px, ${projectHeroParallax.value.y}px, 0)`
}))

const updateProjectHeroParallax = (event: PointerEvent) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || event.pointerType !== 'mouse' || !selectedProject.value) return
  const x = event.clientX / window.innerWidth - 0.5
  const y = event.clientY / window.innerHeight - 0.5
  projectHeroParallax.value = { x: x * 10, y: y * 8 }
}

const resetProjectHeroParallax = () => {
  projectHeroParallax.value = { x: 0, y: 0 }
}

const projectAssetBase = (repo: any) => `/project/${encodeURIComponent(repo.name)}`
const projectImageCounts: Record<string, number> = {
  DiscordWebAnalytics: 4,
  DiscordWebBotClient: 2,
  'games-bot': 4,
  'image-to-url': 0,
  sites: 4,
  'tokumei-bot': 2,
  votesites: 5,
  'ymkw-mad': 1
}

const projectImages = (repo: any) => Array.from(
  { length: projectImageCounts[repo.name] || 0 },
  (_, index) => `${projectAssetBase(repo)}/${index + 1}.png`
)

const projectThumbnail = (repo: any) => projectImages(repo)[0] || '/notfrond.png'
const fallbackCommitTrend = ''

const decodeReadme = (content: string) => {
  const bytes = Uint8Array.from(atob(content.replace(/\s/g, '')), char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const getReadmeShields = (readme: string, repo: any) => [...readme.matchAll(/<img[^>]+src=["']([^"']+)["']/gi), ...readme.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)]
  .map(match => match[1])
  .filter(url => /img\.shields\.io/i.test(url))
  .slice(0, 4)
  .map((source) => /^https?:\/\//i.test(source)
    ? source.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/')
    : new URL(source.replace(/^\//, ''), `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${repo.default_branch}/`).href)

const selectedProjectImages = computed(() => selectedProject.value ? projectDetails.value[selectedProject.value.id]?.images || projectImages(selectedProject.value) : [])
const currentProjectImage = computed(() => selectedProjectImages.value[currentProjectImageIndex.value] || '/notfrond.png')
const expandedImage = computed(() => isImageViewerOpen.value ? currentProjectImage.value : null)

const changeProjectImage = (direction: number, restartTimer = true) => {
  const images = selectedProjectImages.value
  if (document.hidden && !restartTimer) return
  if (images.length < 2) return
  galleryImageBusy.value = true
  imageDirection.value = direction < 0 ? -1 : 1
  currentProjectImageIndex.value = (currentProjectImageIndex.value + direction + images.length) % images.length
  if (restartTimer) startProjectCarousel()
}

const gallerySwipe = useGallerySwipe(() => selectedProjectImages.value.length > 1, direction => changeProjectImage(direction))
const { style: gallerySwipeStyle, dragging: galleryDragging } = gallerySwipe
watch(galleryDragging, () => startProjectCarousel())

const selectProjectImage = (index: number) => {
  if (currentProjectImageIndex.value === index) return
  galleryImageBusy.value = true
  imageDirection.value = index < currentProjectImageIndex.value ? -1 : 1
  currentProjectImageIndex.value = index
  startProjectCarousel()
}

const startProjectCarousel = () => {
  stopProjectCarousel()
  if (expandedImage.value || galleryImageBusy.value || !carouselPlaying.value || carouselInteracting.value || selectedProjectImages.value.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  carouselCycle.value++
  projectCarouselTimer = setInterval(() => changeProjectImage(1, false), 4_000)
}

const stopProjectCarousel = () => {
  if (projectCarouselTimer) clearInterval(projectCarouselTimer)
  projectCarouselTimer = undefined
}

const toggleCarousel = () => {
  carouselPlaying.value = !carouselPlaying.value
  startProjectCarousel()
}
const interactWithCarousel = (value: boolean) => {
  carouselHovered.value = value
  startProjectCarousel()
}

const focusCarousel = (event: FocusEvent) => {
  const gallery = event.currentTarget as HTMLElement
  carouselFocused.value = event.type === 'focusin' || gallery.contains(event.relatedTarget as Node)
  startProjectCarousel()
}
const galleryKeyboard = (event: KeyboardEvent) => {
  if (event.altKey || event.ctrlKey || event.metaKey || selectedProjectImages.value.length < 2) return
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') changeProjectImage(event.key === 'ArrowLeft' ? -1 : 1)
  else selectProjectImage(event.key === 'Home' ? 0 : selectedProjectImages.value.length - 1)
}
watch(expandedImage, startProjectCarousel)
watch(galleryImageBusy, startProjectCarousel)
watch(selectedProject, () => { isImageViewerOpen.value = false })
const projectHomepage = computed(() => {
  const raw = selectedProject.value?.homepage
  if (!raw) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : ''
  } catch { return '' }
})

const getCommitTrend = async (repo: any, retry = 0): Promise<string> => {
  try {
    const response = await fetch(`/api/github?${new URLSearchParams({ resource: 'commit-activity', repo: repo.name })}`)
    if (response.status === 202 && retry < 2) {
      await new Promise(resolve => setTimeout(resolve, 1_000))
      return getCommitTrend(repo, retry + 1)
    }
    if (!response.ok) return ''
    const activity = await response.json()
    if (!Array.isArray(activity) || !activity.length) return ''
    const weeklyCounts = activity.map((week: any) => week.total || 0)
    const maxCount = Math.max(1, ...weeklyCounts)
    return weeklyCounts.map((count, index) => {
      const x = (index / (weeklyCounts.length - 1)) * 100
      const y = 22 - (count / maxCount) * 19
      return `${x.toFixed(2)},${y.toFixed(2)}`
    }).join(' ')
  } catch {
    return ''
  }
}

const loadProjectDetails = async (repo: any) => {
  const base = projectAssetBase(repo)
  const descriptionResponse = await fetch(`${base}/describe.txt`).catch(() => null)
  const description = descriptionResponse?.ok ? (await descriptionResponse.text()).trim() : ''
  projectDetails.value[repo.id] = { description, images: projectImages(repo), shields: [], commitTrend: fallbackCommitTrend }
  void githubRequest('readme', repo.name).then((readme) => {
    const details = projectDetails.value[repo.id]
    if (details?.shields && readme?.content) details.shields = getReadmeShields(decodeReadme(readme.content), repo)
  }).catch(() => {})
  void getCommitTrend(repo).then((commitTrend) => {
    const details = projectDetails.value[repo.id]
    if (details && commitTrend) projectDetails.value[repo.id] = { ...details, commitTrend }
  })
}

onMounted(() => {
  if (themeTriggerRef.value && registerThemeTrigger) {
    registerThemeTrigger(themeTriggerRef.value)
  }
  watch(() => props.projects, (projects) => {
    if (projects) projects.forEach(loadProjectDetails)
  }, { immediate: true })
  watch([() => props.requestedProject, () => props.projects], ([name, projects]) => {
    if (!name) {
      if (linkedProjectName && selectedProject.value?.name === linkedProjectName) selectedProject.value = null
      linkedProjectName = null
      return
    }
    const project = projects?.find(repo => repo.name === name)
    if (!project || (linkedProjectName === name && selectedProject.value?.id === project.id)) return
    linkedProjectName = name
    openProject(project, true)
  }, { immediate: true })
  window.addEventListener('pointermove', updateProjectHeroParallax)
})

watch(selectedProject, (project) => {
  clearTimeout(projectLinkTimer)
  projectLinkCopied.value = false
  if (import.meta.client) document.body.classList.toggle('project-modal-open', Boolean(project))
  if (project) {
    galleryImageBusy.value = true
    currentProjectImageIndex.value = 0
    carouselPlaying.value = !matchMedia('(prefers-reduced-motion: reduce)').matches
    carouselHovered.value = false
    carouselFocused.value = false
    resetProjectHeroParallax()
    startProjectCarousel()
  } else {
    resetProjectHeroParallax()
    stopProjectCarousel()
  }
})

onUnmounted(() => {
  clearTimeout(projectLinkTimer)
  clearTimeout(filterMotionTimer)
  window.removeEventListener('pointermove', updateProjectHeroParallax)
  stopProjectCarousel()
  if (import.meta.client) document.body.classList.remove('project-modal-open')
})
</script>

<template>
  <section id="projects" tabindex="-1" aria-label="Projects" class="section projects-section tw:relative tw:flex tw:min-h-screen tw:w-full tw:max-w-[1200px] tw:flex-col tw:items-center tw:justify-center tw:bg-transparent tw:px-8 tw:py-24 tw:max-md:px-4 tw:max-md:py-20">
    <div ref="themeTriggerRef" style="position: absolute; top: 0; height: 1px; width: 100%; pointer-events: none;"></div>

    <h2 aria-label="Projects" class="section-title hover-highlight" v-split-text>
      <span v-for="(char, i) in `Projects`.split('')" :key="i" aria-hidden="true" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
    </h2>
    <div class="projects-source-wrap" v-reveal><p class="projects-source"><img class="github-lockup" src="/github-lockup.png" alt="GitHub" /><span>より</span></p></div>
    <div v-if="projects?.length" class="project-toolbar" v-reveal>
      <SelectionTrack class="project-filters" :active="selectedLanguage" role="group" aria-label="主な言語で絞り込む">
        <button type="button" data-selection="all" :aria-pressed="selectedLanguage === 'all'" @click="selectedLanguage = 'all'">すべて<span class="filter-count">{{ projects.length }}</span></button>
        <button v-for="language in projectLanguages" :key="language.name" type="button" :data-selection="language.name" :aria-pressed="selectedLanguage === language.name" @click="selectedLanguage = language.name"><img v-if="languageIcons[language.name]" :src="`/icons/languages/${languageIcons[language.name]}.svg`" alt="" />{{ language.name }}<span class="filter-count">{{ language.count }}</span></button>
      </SelectionTrack>
    </div>
    <div v-if="status === 'error'" class="project-request-error" role="status"><SiteIcon name="alert" :size="20"/><p>{{ projects?.length ? '一覧を更新できませんでした。前回取得した内容を表示しています。' : 'プロジェクトを読み込めませんでした。' }}</p><button type="button" class="filter-reset" @click="emit('retry')"><SiteIcon name="replay" :size="16"/>再読み込み</button></div>
    <div v-if="status !== 'error' || projects?.length" class="project-results-stage" :class="{ 'is-filtering': isFiltering }" :style="{ height: projectGridHeight }">
    <div ref="projectGrid">
    <div v-if="(status === 'pending' || status === 'idle') && (!projects || projects.length === 0)" class="projects-grid tw:grid tw:w-full tw:gap-6"><p class="project-loading-label" role="status">プロジェクトを読み込んでいます...</p><div v-for="placeholder in 6" :key="`loading-${placeholder}`" class="project-skeleton" aria-hidden="true"><span></span><span></span></div></div>
    <p v-else-if="!projects || projects.length === 0">公開されているプロジェクトはありません。</p>
    <TransitionGroup v-else name="project-filter" tag="div" class="projects-grid tw:grid tw:w-full tw:gap-6" @before-leave="lockProjectResult" @after-leave="releaseProjectResult" @leave-cancelled="releaseProjectResult">
      <div v-if="!filteredProjects.length" key="no-results" class="project-empty"><SiteIcon name="search" :size="26"/><p>一致するプロジェクトがありません。</p><button type="button" class="filter-reset" @click="resetProjectFilters">絞り込みを解除</button></div>
      <div v-for="(repo, index) in filteredProjects" :key="repo.id" class="project-card-slot" :style="{ '--project-filter-delay': `${Math.min(index, 5) * 45}ms` }">
      <button type="button" class="project-card tw:flex tw:flex-col tw:text-left tw:no-underline tw:bg-[var(--card-bg-color)] tw:border tw:border-[var(--card-border-color)] tw:text-inherit tw:shadow-[0_4px_15px_var(--shadow-color)] tw:hover:shadow-[0_12px_25px_var(--shadow-hover-color)]" :style="{ '--project-reveal-delay': `${Math.min(index, 5) * 65}ms` }" :aria-label="`${repo.name} の詳細を開く`" v-reveal @click="openProject(repo)">
        <div class="project-image">
          <div class="project-image-media" :style="{ backgroundImage: `url(${projectThumbnail(repo)})` }"></div>
          <div class="project-image-overlay"></div>
          <svg v-if="projectDetails[repo.id]?.commitTrend" class="project-commit-trend" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><polyline :points="projectDetails[repo.id].commitTrend" /></svg>
          <div class="project-heading">
            <h3 class="tw:[font-family:var(--font-display)]">{{ repo.name }}</h3>
            <p v-if="repo.updated_at" class="project-updated">
              <span><SiteIcon name="clock" :size="13"/> 最終更新 {{ relativeUpdate(repo.updated_at) }}</span>
            </p>
          </div>
          <div class="project-view-label"><i class="fa-solid fa-eye" aria-hidden="true"></i> 見る</div>
        </div>
      </button>
      </div>
    </TransitionGroup>
    </div>
    </div>
    <Teleport to="body">
      <Transition name="project-modal-pop">
        <div v-if="selectedProject" class="project-modal-overlay tw:fixed tw:inset-0 tw:z-[3000] tw:grid tw:place-items-center tw:overflow-y-auto tw:p-[clamp(1rem,4vw,3.5rem)] tw:bg-[rgba(9,12,20,0.72)] tw:backdrop-blur-[14px]" :inert="Boolean(expandedImage)" role="dialog" aria-modal="true" :aria-label="`${selectedProject.name} の詳細`" data-lenis-prevent @click.self="closeProject">
          <button class="project-modal-close project-modal-close-in tw:fixed tw:top-6 tw:right-6 tw:z-[3001] tw:inline-flex tw:items-center tw:justify-center tw:cursor-pointer tw:rounded-lg tw:border-2 tw:border-[var(--card-border-color-dark)] tw:bg-[var(--pill-bg-color-dark)] tw:p-0 tw:text-[var(--text-color-dark)] tw:transition-[background-color,color] tw:duration-200 tw:hover:bg-[var(--text-color-dark)] tw:hover:text-[var(--bg-color-dark)] tw:max-[760px]:top-3 tw:max-[760px]:right-3" type="button" aria-label="プロジェクト詳細を閉じる" data-tooltip="閉じる（Esc）" @click="closeProject"><SiteIcon name="close" :size="24"/></button>
          <article :class="{ 'has-no-images': !selectedProjectImages.length }" class="project-modal project-modal-content-in tw:relative tw:w-[min(72rem,100%)] tw:max-h-[min(94vh,66rem)] tw:overflow-hidden tw:rounded-[1.25rem] tw:bg-[var(--card-bg-color)] tw:text-[var(--active-text)] tw:shadow-[0_1.5rem_5rem_rgba(0,0,0,0.42)] tw:[transform-origin:center]" data-lenis-prevent>
            <div class="project-modal-hero tw:relative tw:min-h-[clamp(8rem,20vh,12rem)] tw:overflow-hidden tw:bg-[url('/notfrond.png')] tw:bg-center tw:bg-cover">
              <div class="project-modal-parallax tw:absolute tw:-inset-4 tw:will-change-transform tw:transition-transform tw:duration-300 tw:ease-out" :style="projectHeroParallaxStyle">
                <div class="project-modal-hero-blur" :style="projectDetails[selectedProject.id]?.images[0] ? { backgroundImage: `url(${projectDetails[selectedProject.id].images[0]})` } : {}"></div>
                <div class="project-modal-hero-image project-modal-hero-image-in" :style="projectDetails[selectedProject.id]?.images[0] ? { backgroundImage: `url(${projectDetails[selectedProject.id].images[0]})` } : {}"></div>
              </div>
              <div class="project-modal-hero-overlay"></div>
              <div class="project-modal-title project-modal-title-in tw:absolute tw:right-[clamp(1.25rem,4vw,3rem)] tw:bottom-[clamp(1.25rem,4vw,2.5rem)] tw:left-[clamp(1.25rem,4vw,3rem)] tw:text-white">
                <p v-if="selectedProject.updated_at"><SiteIcon name="clock" :size="13"/> 最終更新 {{ relativeUpdate(selectedProject.updated_at) }}</p>
                <div class="project-modal-heading"><h2>{{ selectedProject.name }}</h2><button class="icon-button project-share" type="button" :aria-label="projectLinkCopied ? 'コピーしました' : 'プロジェクトのURLをコピー'" :data-tooltip="projectLinkCopied ? 'コピーしました' : 'プロジェクトのURLをコピー'" @click="copyProjectLink"><SiteIcon name="link" :checked="projectLinkCopied" :size="19"/></button></div>
              </div>
            </div>
            <div class="project-modal-body tw:grid tw:max-h-[min(66vh,40rem)] tw:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] tw:overflow-hidden tw:bg-[var(--card-bg-color)]">
              <main class="project-modal-readme tw:min-h-0 tw:overflow-y-auto tw:px-[clamp(1.35rem,5vw,3rem)] tw:py-[clamp(1.35rem,4vw,2.4rem)]">
                <div v-if="projectDetails[selectedProject.id]?.shields.length" class="project-modal-badges project-modal-description-in" aria-label="プロジェクトのバッジ"><img v-for="shield in projectDetails[selectedProject.id].shields" :key="shield" :src="shield" alt="" /></div>
                <p v-if="projectDetails[selectedProject.id]?.description" class="project-modal-description project-modal-description-in tw:mt-0 tw:mb-5 tw:text-[0.96rem] tw:leading-[1.7] tw:text-[var(--text-muted-color)] tw:whitespace-pre-wrap">{{ projectDetails[selectedProject.id].description }}</p>
                <div v-if="selectedProjectImages.length" class="gallery-interaction" @pointerenter="interactWithCarousel(true)" @pointerleave="interactWithCarousel(false)" @focusin="focusCarousel" @focusout="focusCarousel" @keydown="galleryKeyboard"><div class="project-gallery project-gallery-in tw:relative tw:grid tw:h-[min(52vh,26rem)] tw:place-items-center tw:overflow-hidden tw:rounded-[0.8rem] tw:bg-[var(--pill-bg-color)] tw:max-sm:h-auto tw:max-sm:aspect-video" aria-label="プロジェクト画像" @pointerdown="gallerySwipe.start" @pointermove="gallerySwipe.move" @pointerup="gallerySwipe.end" @pointercancel="gallerySwipe.cancel" @lostpointercapture="gallerySwipe.cancel" @click.capture="gallerySwipe.click" @dragstart.prevent :style="{ '--gallery-direction': imageDirection }">
                  <ProjectGalleryImage class="gallery-swipe-image" :class="{ 'can-swipe': selectedProjectImages.length > 1, 'is-dragging': galleryDragging }" :style="gallerySwipeStyle" :src="currentProjectImage" :alt="`${selectedProject.name} の画像 ${currentProjectImageIndex + 1}`" @busy="galleryImageBusy = $event" />
                  <button ref="galleryExpand" type="button" class="icon-button gallery-expand" :disabled="galleryImageBusy" aria-label="画像を拡大" data-tooltip="画像を拡大" @click="isImageViewerOpen = true"><SiteIcon name="expand" :size="18"/></button><span v-if="selectedProjectImages.length > 1 && carouselPlaying" :key="`${currentProjectImageIndex}-${carouselCycle}`" class="project-gallery-progress" :class="{ 'is-paused': carouselInteracting || galleryImageBusy }" aria-hidden="true"></span>
                  <button v-if="selectedProjectImages.length > 1" class="project-gallery-arrow project-gallery-arrow-prev" type="button" aria-label="前の画像" data-tooltip="前の画像" @click="changeProjectImage(-1)"><SiteIcon name="chevron" :size="20" class="chevron-prev"/></button>
                  <button v-if="selectedProjectImages.length > 1" class="project-gallery-arrow project-gallery-arrow-next" type="button" aria-label="次の画像" data-tooltip="次の画像" @click="changeProjectImage(1)"><SiteIcon name="chevron" :size="20" class="chevron-next"/></button>
                  <div v-if="selectedProjectImages.length > 1" class="gallery-controls"><span class="gallery-count" :aria-live="carouselPlaying && !carouselInteracting ? 'off' : 'polite'">{{ currentProjectImageIndex + 1 }} / {{ selectedProjectImages.length }}</span><button type="button" class="icon-button gallery-play" :aria-label="carouselPlaying ? '自動再生を停止' : '自動再生を開始'" :data-tooltip="carouselPlaying ? '自動再生を停止' : '自動再生を開始'" :aria-pressed="carouselPlaying" @click="toggleCarousel"><SiteIcon :name="carouselPlaying ? 'pause' : 'play'" :size="16"/></button></div>
                </div>
                <div v-if="selectedProjectImages.length > 1" ref="galleryThumbnails" class="gallery-thumbnails" role="group" aria-label="画像を選ぶ"><button v-for="(image, index) in selectedProjectImages" :key="`${image}-${index}`" type="button" :aria-label="`${index + 1} 枚目を表示`" :aria-pressed="currentProjectImageIndex === index" @click="selectProjectImage(index)"><img :src="image" alt="" loading="lazy" /><span>{{ index + 1 }}</span></button></div></div>
                <div v-else class="project-gallery-empty project-gallery-in"><SiteIcon name="image" :size="22"/><span>画像はありません</span></div>
              </main>
              <aside class="project-modal-sidebar project-modal-sidebar-in tw:min-h-0 tw:overflow-y-auto tw:bg-[color-mix(in_srgb,var(--pill-bg-color)_48%,transparent)] tw:p-[clamp(1.35rem,3vw,2rem)]" aria-label="プロジェクト情報">
                <h3 class="project-modal-sidebar-heading-in tw:mt-0 tw:mb-[0.9rem] tw:text-[1.35rem] tw:leading-normal tw:text-[var(--active-text)]">関連サイト</h3>
                <ProjectRelatedLink v-if="projectHomepage" :href="projectHomepage" />
                <ProjectRelatedLink :href="selectedProject.html_url" />
                <dl class="project-facts project-modal-sidebar-in"><template v-if="selectedProject.language"><dt>主な言語</dt><dd><img v-if="languageIcons[selectedProject.language]" class="project-language-icon" :src="`/icons/languages/${languageIcons[selectedProject.language]}.svg`" alt="" />{{ selectedProject.language }}</dd></template><template v-if="selectedProject.license"><dt>ライセンス</dt><dd>{{ selectedProject.license.spdx_id || selectedProject.license.name }}</dd></template><dt>GitHub</dt><dd><SiteIcon name="star" :size="15"/>{{ selectedProject.stargazers_count || 0 }}<SiteIcon name="fork" :size="15"/>{{ selectedProject.forks_count || 0 }}</dd></dl>
              </aside>
            </div>
          </article>
        </div>
      </Transition>
    </Teleport>
    <ImageViewer :src="expandedImage" :return-focus="galleryExpand" :index="currentProjectImageIndex" :count="selectedProjectImages.length" :direction="imageDirection" :alt="selectedProject ? `${selectedProject.name} の画像 ${currentProjectImageIndex + 1}` : ''" @step="changeProjectImage" @select="selectProjectImage" @close="isImageViewerOpen = false" />
  </section>
</template>
