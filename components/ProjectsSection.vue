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
const currentProjectImage = computed(() => selectedProjectImages.value[currentProjectImageIndex.value] || '')

const changeProjectImage = (direction: number) => {
  const images = selectedProjectImages.value
  if (images.length < 2) return
  currentProjectImageIndex.value = (currentProjectImageIndex.value + direction + images.length) % images.length
}

const startProjectCarousel = () => {
  if (projectCarouselTimer) clearInterval(projectCarouselTimer)
  projectCarouselTimer = setInterval(() => changeProjectImage(1), 1_500)
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
})

watch(selectedProject, (project) => {
  if (import.meta.client) document.body.classList.toggle('project-modal-open', Boolean(project))
  if (project) {
    currentProjectImageIndex.value = 0
    startProjectCarousel()
  } else {
    stopProjectCarousel()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeGithubProfileOnOutsideClick)
  document.removeEventListener('keydown', closeGithubProfileOnEscape)
  stopProjectCarousel()
  if (import.meta.client) document.body.classList.remove('project-modal-open')
})
</script>

<template>
  <section id="projects" class="section projects-section">
    <div ref="themeTriggerRef" style="position: absolute; top: 0; height: 1px; width: 100%; pointer-events: none;"></div>

    <h2 class="section-title hover-highlight" v-split-text>
      <span v-for="(char, i) in `Projects`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
    </h2>
    <div ref="githubPopoverRef" class="projects-source-wrap">
      <p class="projects-source">
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
    <div class="projects-grid">
      <p v-if="status === 'pending' && (!projects || projects.length === 0)">プロジェクトを読み込んでいます...</p>
      <p v-else-if="!projects || projects.length === 0">公開されているプロジェクトはありません。</p>
      <button v-else v-for="repo in projects" :key="repo.id" type="button" class="project-card" :aria-label="`${repo.name} の詳細を開く`" @click="openProject(repo)">
        <div class="project-image">
          <div class="project-image-media" :style="{ backgroundImage: `url(${projectThumbnail(repo)})` }"></div>
          <div class="project-image-overlay"></div>
          <svg v-if="projectDetails[repo.id]?.commitTrend" class="project-commit-trend" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><polyline :points="projectDetails[repo.id].commitTrend" /></svg>
          <div class="project-heading">
            <h3>{{ repo.name }}</h3>
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
        <div v-if="selectedProject" class="project-modal-overlay" data-lenis-prevent @click.self="closeProject">
          <article class="project-modal" role="dialog" aria-modal="true" :aria-label="`${selectedProject.name} の詳細`" data-lenis-prevent>
            <button class="project-modal-close" type="button" aria-label="プロジェクト詳細を閉じる" @click="closeProject"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            <div class="project-modal-hero">
              <div class="project-modal-hero-blur" :style="projectDetails[selectedProject.id]?.images[0] ? { backgroundImage: `url(${projectDetails[selectedProject.id].images[0]})` } : {}"></div>
              <div class="project-modal-hero-image" :style="projectDetails[selectedProject.id]?.images[0] ? { backgroundImage: `url(${projectDetails[selectedProject.id].images[0]})` } : {}"></div>
              <div class="project-modal-hero-overlay"></div>
              <div class="project-modal-title">
                <p v-if="selectedProject.updated_at"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> 最終更新 {{ relativeUpdate(selectedProject.updated_at) }}</p>
                <h2>{{ selectedProject.name }}</h2>
              </div>
            </div>
            <div class="project-modal-body">
              <main class="project-modal-readme">
                <p v-if="projectDetails[selectedProject.id]?.description" class="project-modal-description">{{ projectDetails[selectedProject.id].description }}</p>
                <div v-if="currentProjectImage" class="project-gallery" aria-label="プロジェクト画像">
                  <img :src="currentProjectImage" :alt="`${selectedProject.name} の画像 ${currentProjectImageIndex + 1}`" />
                  <button v-if="selectedProjectImages.length > 1" class="project-gallery-arrow project-gallery-arrow-prev" type="button" aria-label="前の画像" @click="changeProjectImage(-1)"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                  <button v-if="selectedProjectImages.length > 1" class="project-gallery-arrow project-gallery-arrow-next" type="button" aria-label="次の画像" @click="changeProjectImage(1)"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
                  <div v-if="selectedProjectImages.length > 1" class="project-gallery-dots"><button v-for="(_image, index) in selectedProjectImages" :key="index" type="button" :class="{ 'is-active': currentProjectImageIndex === index }" :aria-label="`${index + 1} 枚目を表示`" @click="currentProjectImageIndex = index"></button></div>
                </div>
                <p v-else class="project-readme-loading">プロジェクト画像を読み込み中…</p>
              </main>
              <aside class="project-modal-sidebar" aria-label="プロジェクト情報">
                <h3>リンク</h3>
                <a v-if="selectedProject.homepage" class="project-modal-link-chip" :href="selectedProject.homepage" target="_blank" rel="noopener"><img :src="faviconUrl(selectedProject.homepage)" alt="" /> <span>{{ linkLabel(selectedProject.homepage) }}</span></a>
                <a class="project-modal-link-chip" :href="selectedProject.html_url" target="_blank" rel="noopener"><img :src="faviconUrl(selectedProject.html_url)" alt="" /> <span>{{ linkLabel(selectedProject.html_url) }}</span></a>
              </aside>
            </div>
          </article>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
