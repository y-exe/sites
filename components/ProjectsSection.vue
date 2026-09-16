<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{ projects: any[] | null; status: string }>()

const themeTriggerRef = ref<HTMLElement | null>(null)
const registerThemeTrigger = inject<(el: HTMLElement) => void>('registerThemeTrigger')
type ProjectDetails = { description: string; images: string[]; shields: string[]; commitTrend: string }
const projectDetails = ref<Record<string | number, ProjectDetails>>({})
const githubPopoverRef = ref<HTMLElement | null>(null)
const isGithubProfileOpen = ref(false)
const isGithubProfilePinned = ref(false)
const isGithubProfileLoading = ref(false)
const githubProfileError = ref(false)
const githubProfile = ref<any | null>(null)
const githubEvents = ref<any[]>([])
const githubContributions = ref<{ date: string; count: number; level: number }[]>([])
const githubContributionTotal = ref<number | null>(null)
const selectedProject = ref<any | null>(null)
const currentProjectImageIndex = ref(0)
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

const linkLabel = (url: string) => {
  try {
    const { host, pathname } = new URL(url)
    return `${host}${pathname === '/' ? '' : pathname}`
  } catch {
    return url
  }
}

const faviconUrl = (url: string) => {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
  } catch {
    return ''
  }
}

const contributionWeeks = computed(() => {
  if (!githubContributions.value.length) return []
  const recentContributions = githubContributions.value.slice(-280)
  const firstDate = new Date(`${recentContributions[0].date}T00:00:00Z`)
  const paddedDays = [
    ...Array.from({ length: firstDate.getUTCDay() }, () => null),
    ...recentContributions
  ]
  return Array.from({ length: Math.ceil(paddedDays.length / 7) }, (_, index) => paddedDays.slice(index * 7, index * 7 + 7))
})

const recentContributionTotal = computed(() => githubContributions.value.slice(-280)
  .reduce((total, day) => total + day.count, 0))

const githubEventText = (event: any) => {
  const repository = event.repo?.name?.replace('y-exe/', '') || 'GitHub'
  const labels: Record<string, string> = {
    PushEvent: `${repository} にコミットを追加`,
    CreateEvent: `${repository} を作成`,
    DeleteEvent: `${repository} を削除`,
    WatchEvent: `${repository} にスター`,
    ForkEvent: `${repository} をフォーク`,
    IssuesEvent: `${repository} の Issue を更新`,
    PullRequestEvent: `${repository} の Pull Request を更新`,
    ReleaseEvent: `${repository} のリリースを公開`
  }
  return labels[event.type] || `${repository} でアクティビティー`
}

const githubEventIcon = (type: string) => ({
  PushEvent: 'fa-code-commit',
  CreateEvent: 'fa-plus',
  DeleteEvent: 'fa-trash-can',
  WatchEvent: 'fa-star',
  ForkEvent: 'fa-code-fork',
  IssuesEvent: 'fa-circle-dot',
  PullRequestEvent: 'fa-code-pull-request',
  ReleaseEvent: 'fa-tag'
}[type] || 'fa-clock-rotate-left')

const githubEventDate = (date: string) => new Intl.DateTimeFormat('ja-JP', {
  month: 'short', day: 'numeric'
}).format(new Date(date))

const loadGithubContributions = async () => {
  try {
    const response = await fetch('https://github-contributions-api.jogruber.de/v4/y-exe?y=last')
    if (!response.ok) return
    const contributions = await response.json()
    githubContributions.value = contributions.contributions || []
    githubContributionTotal.value = contributions.total?.lastYear ?? null
  } catch {
  }
}

const loadGithubProfile = async () => {
  if (githubProfile.value || isGithubProfileLoading.value) return

  isGithubProfileLoading.value = true
  githubProfileError.value = false
  try {
    const [profileResponse, eventsResponse] = await Promise.all([
      githubRequest('profile'),
      githubRequest('events')
    ])
    githubProfile.value = profileResponse
    githubEvents.value = eventsResponse
    void loadGithubContributions()
  } catch {
    githubProfileError.value = true
  } finally {
    isGithubProfileLoading.value = false
  }
}

const toggleGithubProfile = () => {
  if (isGithubProfileOpen.value && isGithubProfilePinned.value) {
    isGithubProfileOpen.value = false
    isGithubProfilePinned.value = false
    return
  }
  isGithubProfileOpen.value = true
  isGithubProfilePinned.value = true
  loadGithubProfile()
}

const showGithubProfileOnHover = () => {
  if (isGithubProfilePinned.value) return
  isGithubProfileOpen.value = true
  loadGithubProfile()
}

const closeGithubProfileOnMouseLeave = () => {
  if (!isGithubProfilePinned.value) isGithubProfileOpen.value = false
}

const closeGithubProfileOnOutsideClick = (event: MouseEvent) => {
  if (githubPopoverRef.value && !githubPopoverRef.value.contains(event.target as Node)) {
    isGithubProfileOpen.value = false
    isGithubProfilePinned.value = false
  }
}

const closeGithubProfileOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isGithubProfileOpen.value = false
    isGithubProfilePinned.value = false
    selectedProject.value = null
  }
}

const openProject = (repo: any) => {
  selectedProject.value = repo
}

const closeProject = () => {
  selectedProject.value = null
}

const projectHeroParallaxStyle = computed(() => ({
  transform: `translate3d(${projectHeroParallax.value.x}px, ${projectHeroParallax.value.y}px, 0)`
}))

const updateProjectHeroParallax = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || !selectedProject.value) return
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
const fallbackCommitTrend = '0,22 8,21 16,22 24,17 32,20 40,13 48,21 56,18 64,22 72,15 80,19 88,11 96,20 100,16'

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

const selectedProjectImages = computed(() => selectedProject.value ? projectDetails.value[selectedProject.value.id]?.images || [] : [])
const currentProjectImage = computed(() => selectedProjectImages.value[currentProjectImageIndex.value] || '/notfrond.png')

const changeProjectImage = (direction: number, restartTimer = true) => {
  const images = selectedProjectImages.value
  if (images.length < 2) return
  currentProjectImageIndex.value = (currentProjectImageIndex.value + direction + images.length) % images.length
  if (restartTimer) startProjectCarousel()
}

const selectProjectImage = (index: number) => {
  if (currentProjectImageIndex.value === index) return
  currentProjectImageIndex.value = index
  startProjectCarousel()
}

const startProjectCarousel = () => {
  if (projectCarouselTimer) clearInterval(projectCarouselTimer)
  projectCarouselTimer = setInterval(() => changeProjectImage(1, false), 4_000)
}

const stopProjectCarousel = () => {
  if (projectCarouselTimer) clearInterval(projectCarouselTimer)
  projectCarouselTimer = undefined
}

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
  document.addEventListener('click', closeGithubProfileOnOutsideClick)
  document.addEventListener('keydown', closeGithubProfileOnEscape)
  window.addEventListener('pointermove', updateProjectHeroParallax)
})

watch(selectedProject, (project) => {
  if (import.meta.client) document.body.classList.toggle('project-modal-open', Boolean(project))
  if (project) {
    currentProjectImageIndex.value = 0
    resetProjectHeroParallax()
    startProjectCarousel()
  } else {
    resetProjectHeroParallax()
    stopProjectCarousel()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeGithubProfileOnOutsideClick)
  document.removeEventListener('keydown', closeGithubProfileOnEscape)
  window.removeEventListener('pointermove', updateProjectHeroParallax)
  stopProjectCarousel()
  if (import.meta.client) document.body.classList.remove('project-modal-open')
})
</script>

<template>
  <section id="projects" class="section projects-section tw:relative tw:flex tw:min-h-screen tw:w-full tw:max-w-[1200px] tw:flex-col tw:items-center tw:justify-center tw:bg-transparent tw:px-8 tw:py-24 tw:max-md:px-4 tw:max-md:py-20">
    <div ref="themeTriggerRef" style="position: absolute; top: 0; height: 1px; width: 100%; pointer-events: none;"></div>

    <h2 class="section-title hover-highlight" v-split-text>
      <span v-for="(char, i) in `Projects`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
    </h2>
    <div ref="githubPopoverRef" class="projects-source-wrap" v-reveal>
      <p class="projects-source tw:inline-flex tw:items-center">
        <span
          class="github-lockup-frame"
          role="button"
          tabindex="0"
          aria-label="GitHub プロフィールとアクティビティーを表示"
          :aria-expanded="isGithubProfileOpen"
          @mouseenter="showGithubProfileOnHover"
          @mouseleave="closeGithubProfileOnMouseLeave"
          @click="toggleGithubProfile"
          @keydown.enter.prevent="toggleGithubProfile"
          @keydown.space.prevent="toggleGithubProfile"
        >
          <img class="github-lockup" src="/github-lockup.png" alt="GitHub" />
          <span
            class="github-profile-trigger"
            :class="{ 'is-open': isGithubProfileOpen }"
            aria-hidden="true"
          >
            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </span>
        </span>
        <span>より</span>
      </p>
      <Transition name="github-profile-pop">
        <aside v-if="isGithubProfileOpen" class="github-profile-panel" aria-label="GitHub プロフィール">
          <div v-if="isGithubProfileLoading" class="github-profile-loading">
            <i class="fa-brands fa-github" aria-hidden="true"></i> GitHub を読み込み中…
          </div>
          <template v-else-if="githubProfile">
            <div class="github-profile-heading">
              <img :src="githubProfile.avatar_url" :alt="`${githubProfile.login} のプロフィール画像`" />
              <div>
                <strong>{{ githubProfile.name || githubProfile.login }}</strong>
                <a :href="githubProfile.html_url" target="_blank" rel="noopener">@{{ githubProfile.login }} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
              </div>
            </div>
            <p v-if="githubProfile.bio" class="github-profile-bio">{{ githubProfile.bio }}</p>
            <div class="github-profile-details">
              <div class="github-activity">
                <p class="github-activity-title">アクティビティー履歴</p>
                <ul v-if="githubEvents.length">
                  <li v-for="(event, index) in githubEvents" :key="event.id" :style="{ '--event-index': index }">
                    <i class="fa-solid" :class="githubEventIcon(event.type)" aria-hidden="true"></i>
                    <span>{{ githubEventText(event) }}</span>
                    <time :datetime="event.created_at">{{ githubEventDate(event.created_at) }}</time>
                  </li>
                </ul>
                <p v-else class="github-activity-empty">公開アクティビティーはまだありません。</p>
              </div>
              <div class="github-contributions">
                <span class="github-contributions-heading">
                  <b>コミット履歴</b>
                  <small v-if="githubContributionTotal !== null">直近9か月 {{ recentContributionTotal }} 件</small>
                </span>
                <span v-if="contributionWeeks.length" class="contribution-calendar" aria-label="直近9か月の contribution カレンダー">
                  <span v-for="(week, weekIndex) in contributionWeeks" :key="weekIndex" class="contribution-week">
                    <span
                      v-for="(day, dayIndex) in week"
                      :key="day?.date || `${weekIndex}-${dayIndex}`"
                      class="contribution-day"
                      :data-level="day?.level || 0"
                      :title="day ? `${day.date}: ${day.count} contributions` : ''"
                    ></span>
                  </span>
                </span>
                <span v-if="contributionWeeks.length" class="contribution-legend"><i data-level="0"></i> 少ない <i data-level="1"></i><i data-level="2"></i><i data-level="3"></i><i data-level="4"></i> 多い</span>
                <span v-else class="contribution-unavailable">コミット履歴を読み込み中…</span>
              </div>
            </div>
          </template>
          <p v-else-if="githubProfileError" class="github-profile-error">プロフィールを読み込めませんでした。時間をおいて再度お試しください。</p>
        </aside>
      </Transition>
    </div>
    <div class="projects-grid tw:grid tw:w-full tw:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] tw:gap-6">
      <p v-if="status === 'pending' && (!projects || projects.length === 0)">プロジェクトを読み込んでいます...</p>
      <p v-else-if="status === 'error'">プロジェクトを取得できませんでした。時間をおいて再度お試しください。</p>
      <p v-else-if="!projects || projects.length === 0">公開されているプロジェクトはありません。</p>
      <button v-else v-for="(repo, index) in projects" :key="repo.id" type="button" class="project-card tw:flex tw:flex-col tw:text-left tw:no-underline tw:bg-[var(--card-bg-color)] tw:border tw:border-[var(--card-border-color)] tw:text-inherit tw:shadow-[0_4px_15px_var(--shadow-color)] tw:hover:shadow-[0_12px_25px_var(--shadow-hover-color)]" :style="{ '--project-reveal-delay': `${index * 85}ms` }" :aria-label="`${repo.name} の詳細を開く`" v-reveal @click="openProject(repo)">
        <div class="project-image">
          <div class="project-image-media" :style="{ backgroundImage: `url(${projectThumbnail(repo)})` }"></div>
          <div class="project-image-overlay"></div>
          <svg v-if="projectDetails[repo.id]?.commitTrend" class="project-commit-trend" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><polyline :points="projectDetails[repo.id].commitTrend" /></svg>
          <div class="project-heading">
            <h3 class="tw:[font-family:var(--font-display)]">{{ repo.name }}</h3>
            <p v-if="repo.updated_at" class="project-updated">
              <span><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> 最終更新 {{ relativeUpdate(repo.updated_at) }}</span>
            </p>
          </div>
          <div class="project-shields" v-if="projectDetails[repo.id]?.shields.length"><img v-for="shield in projectDetails[repo.id].shields" :key="shield" :src="shield" alt="" /></div>
          <div class="project-view-label"><i class="fa-solid fa-eye" aria-hidden="true"></i> 見る</div>
          <i class="fa-solid fa-expand project-link-icon" aria-hidden="true"></i>
        </div>
      </button>
    </div>
    <Teleport to="body">
      <Transition name="project-modal-pop">
        <div v-if="selectedProject" class="project-modal-overlay tw:fixed tw:inset-0 tw:z-[3000] tw:grid tw:place-items-center tw:overflow-y-auto tw:p-[clamp(1rem,4vw,3.5rem)] tw:bg-[rgba(9,12,20,0.72)] tw:backdrop-blur-[14px]" data-lenis-prevent @click.self="closeProject">
          <article class="project-modal project-modal-content-in tw:relative tw:w-[min(72rem,100%)] tw:max-h-[min(94vh,66rem)] tw:overflow-hidden tw:rounded-[1.25rem] tw:bg-[var(--card-bg-color)] tw:text-[var(--active-text)] tw:shadow-[0_1.5rem_5rem_rgba(0,0,0,0.42)] tw:[transform-origin:center]" role="dialog" aria-modal="true" :aria-label="`${selectedProject.name} の詳細`" data-lenis-prevent>
            <button class="project-modal-close project-modal-close-in tw:absolute tw:top-4 tw:right-4 tw:z-[2] tw:grid tw:size-[2.4rem] tw:cursor-pointer tw:place-items-center tw:rounded-full tw:border-0 tw:bg-[rgba(15,23,42,0.54)] tw:p-0 tw:text-base tw:text-white tw:transition-[transform,background] tw:duration-300 tw:hover:rotate-90 tw:hover:scale-[1.08] tw:hover:bg-[rgba(15,23,42,0.82)]" type="button" aria-label="プロジェクト詳細を閉じる" @click="closeProject"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            <div class="project-modal-hero tw:relative tw:min-h-[clamp(8rem,20vh,12rem)] tw:overflow-hidden tw:bg-[url('/notfrond.png')] tw:bg-center tw:bg-cover">
              <div class="project-modal-parallax tw:absolute tw:-inset-4 tw:will-change-transform tw:transition-transform tw:duration-300 tw:ease-out" :style="projectHeroParallaxStyle">
                <div class="project-modal-hero-blur" :style="projectDetails[selectedProject.id]?.images[0] ? { backgroundImage: `url(${projectDetails[selectedProject.id].images[0]})` } : {}"></div>
                <div class="project-modal-hero-image project-modal-hero-image-in" :style="projectDetails[selectedProject.id]?.images[0] ? { backgroundImage: `url(${projectDetails[selectedProject.id].images[0]})` } : {}"></div>
              </div>
              <div class="project-modal-hero-overlay"></div>
              <div class="project-modal-title project-modal-title-in tw:absolute tw:right-[clamp(1.25rem,4vw,3rem)] tw:bottom-[clamp(1.25rem,4vw,2.5rem)] tw:left-[clamp(1.25rem,4vw,3rem)] tw:text-white">
                <p v-if="selectedProject.updated_at"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> 最終更新 {{ relativeUpdate(selectedProject.updated_at) }}</p>
                <h2>{{ selectedProject.name }}</h2>
              </div>
            </div>
            <div class="project-modal-body tw:grid tw:max-h-[min(66vh,40rem)] tw:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] tw:overflow-hidden tw:bg-[var(--card-bg-color)]">
              <main class="project-modal-readme tw:min-h-0 tw:overflow-y-auto tw:px-[clamp(1.35rem,5vw,3rem)] tw:py-[clamp(1.35rem,4vw,2.4rem)]">
                <p v-if="projectDetails[selectedProject.id]?.description" class="project-modal-description project-modal-description-in tw:mt-0 tw:mb-5 tw:text-[0.96rem] tw:leading-[1.7] tw:text-[var(--text-muted-color)] tw:whitespace-pre-wrap">{{ projectDetails[selectedProject.id].description }}</p>
                <div class="project-gallery project-gallery-in tw:relative tw:grid tw:h-[min(52vh,26rem)] tw:place-items-center tw:overflow-hidden tw:rounded-[0.8rem] tw:bg-[var(--pill-bg-color)] tw:max-sm:h-auto tw:max-sm:aspect-video" aria-label="プロジェクト画像">
                  <img class="project-gallery-image-in tw:block tw:h-full tw:w-full tw:object-contain tw:object-center" :src="currentProjectImage" :alt="`${selectedProject.name} の画像 ${currentProjectImageIndex + 1}`" />
                  <span v-if="selectedProjectImages.length > 1" :key="currentProjectImageIndex" class="project-gallery-progress" aria-hidden="true"></span>
                  <button v-if="selectedProjectImages.length > 1" class="project-gallery-arrow project-gallery-arrow-prev" type="button" aria-label="前の画像" @click="changeProjectImage(-1)"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                  <button v-if="selectedProjectImages.length > 1" class="project-gallery-arrow project-gallery-arrow-next" type="button" aria-label="次の画像" @click="changeProjectImage(1)"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
                  <div v-if="selectedProjectImages.length > 1" class="project-gallery-dots"><button v-for="(_image, index) in selectedProjectImages" :key="index" type="button" :class="{ 'is-active': currentProjectImageIndex === index }" :aria-label="`${index + 1} 枚目を表示`" @click="selectProjectImage(index)"></button></div>
                </div>
              </main>
              <aside class="project-modal-sidebar project-modal-sidebar-in tw:min-h-0 tw:overflow-y-auto tw:bg-[color-mix(in_srgb,var(--pill-bg-color)_48%,transparent)] tw:p-[clamp(1.35rem,3vw,2rem)]" aria-label="プロジェクト情報">
                <h3 class="project-modal-sidebar-heading-in tw:mt-0 tw:mb-[0.9rem] tw:text-[1.35rem] tw:leading-normal tw:text-[var(--active-text)]">関連サイト</h3>
                <a v-if="selectedProject.homepage" class="project-modal-link-chip project-modal-link-in tw:my-[0.6rem] tw:flex tw:w-fit tw:max-w-full tw:min-w-0 tw:items-center tw:gap-2 tw:overflow-hidden tw:rounded-full tw:bg-[#cecfd9] tw:px-[0.72rem] tw:py-[0.42rem] tw:text-left tw:text-[0.76rem] tw:font-bold tw:leading-[1.35] tw:text-[#4f4e69] tw:no-underline tw:transition-[color,background,transform] tw:duration-300 tw:hover:translate-x-[0.18rem] tw:hover:bg-[#bfc0cc]" :href="selectedProject.homepage" target="_blank" rel="noopener"><img class="tw:size-4 tw:shrink-0 tw:rounded-full" :src="faviconUrl(selectedProject.homepage)" alt="" /> <span class="tw:min-w-0 tw:flex-1 tw:truncate tw:whitespace-nowrap tw:text-left">{{ linkLabel(selectedProject.homepage) }}</span></a>
                <a class="project-modal-link-chip project-modal-link-in tw:my-[0.6rem] tw:flex tw:w-fit tw:max-w-full tw:min-w-0 tw:items-center tw:gap-2 tw:overflow-hidden tw:rounded-full tw:bg-[#cecfd9] tw:px-[0.72rem] tw:py-[0.42rem] tw:text-left tw:text-[0.76rem] tw:font-bold tw:leading-[1.35] tw:text-[#4f4e69] tw:no-underline tw:transition-[color,background,transform] tw:duration-300 tw:hover:translate-x-[0.18rem] tw:hover:bg-[#bfc0cc]" :href="selectedProject.html_url" target="_blank" rel="noopener"><img class="tw:size-4 tw:shrink-0 tw:rounded-full" :src="faviconUrl(selectedProject.html_url)" alt="" /> <span class="tw:min-w-0 tw:flex-1 tw:truncate tw:whitespace-nowrap tw:text-left">{{ linkLabel(selectedProject.html_url) }}</span></a>
              </aside>
            </div>
          </article>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
