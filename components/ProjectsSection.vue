<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps<{ projects: any[] | null; status: string }>()

const themeTriggerRef = ref<HTMLElement | null>(null)
const registerThemeTrigger = inject<(el: HTMLElement) => void>('registerThemeTrigger')
type ProjectDetails = { image: string | null; shields: string[]; commitTrend: string; readme: string; renderedReadme: string }
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
  void renderGithubReadme(repo)
}

const closeProject = () => {
  selectedProject.value = null
}

const decodeReadme = (content: string) => {
  const bytes = Uint8Array.from(atob(content.replace(/\s/g, '')), char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const getReadmeImages = (readme: string, repo: any) => {
  const matches = [
    ...readme.matchAll(/<img[^>]+src=["']([^"']+)["']/gi),
    ...readme.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)
  ]
  const resolve = (source: string) => {
    if (/^https?:\/\//i.test(source)) return source.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/')
    return new URL(source.replace(/^\//, ''), `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${repo.default_branch}/`).href
  }
  const sources = matches.map(match => match[1])
  return {
    image: sources.find(url => !/shields\.io|badge|github-readme-stats/i.test(url)) ? resolve(sources.find(url => !/shields\.io|badge|github-readme-stats/i.test(url))!) : null,
    shields: sources.filter(url => /img\.shields\.io/i.test(url)).slice(0, 4).map(resolve)
  }
}

const renderGithubReadme = async (repo: any) => {
  const details = projectDetails.value[repo.id]
  if (!details?.readme || details.renderedReadme) return
  details.renderedReadme = marked.parse(details.readme, { gfm: true, breaks: false }) as string
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
  try {
    const readmeResponse = await fetch(`/api/github?${new URLSearchParams({ resource: 'readme', repo: repo.name })}`)
    const readme = readmeResponse.ok ? await readmeResponse.json() : null
    const readmeContent = readme?.content ? decodeReadme(readme.content) : ''
    const readmeDetails = readmeContent ? getReadmeImages(readmeContent, repo) : { image: null, shields: [] }
    projectDetails.value[repo.id] = { ...readmeDetails, readme: readmeContent, renderedReadme: '', commitTrend: await getCommitTrend(repo) }
    if (selectedProject.value?.id === repo.id) void renderGithubReadme(repo)
  } catch {
    projectDetails.value[repo.id] = { image: null, shields: [], readme: '', renderedReadme: '', commitTrend: await getCommitTrend(repo) }
  }
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
})

onUnmounted(() => {
  document.removeEventListener('click', closeGithubProfileOnOutsideClick)
  document.removeEventListener('keydown', closeGithubProfileOnEscape)
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
          <div class="project-image-media" :style="projectDetails[repo.id]?.image ? { backgroundImage: `url(${projectDetails[repo.id].image})` } : {}"></div>
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
            <div class="project-modal-hero" :style="projectDetails[selectedProject.id]?.image ? { backgroundImage: `url(${projectDetails[selectedProject.id].image})` } : {}">
              <div class="project-modal-hero-overlay"></div>
              <div class="project-modal-title">
                <p v-if="selectedProject.updated_at"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> 最終更新 {{ relativeUpdate(selectedProject.updated_at) }}</p>
                <h2>{{ selectedProject.name }}</h2>
              </div>
            </div>
            <div class="project-modal-body">
              <main class="project-modal-readme">
                <div v-if="projectDetails[selectedProject.id]?.shields.length" class="project-modal-shields"><img v-for="shield in projectDetails[selectedProject.id].shields" :key="shield" :src="shield" alt="" /></div>
                <div v-if="projectDetails[selectedProject.id]?.renderedReadme" class="project-readme-content markdown-body" v-html="projectDetails[selectedProject.id].renderedReadme"></div>
                <p v-else class="project-readme-loading">README をGitHub形式で読み込み中…</p>
              </main>
              <aside class="project-modal-sidebar" aria-label="プロジェクト情報">
                <a class="project-modal-url" :href="selectedProject.homepage || selectedProject.html_url" target="_blank" rel="noopener"><i class="fa-solid fa-link"></i> {{ selectedProject.homepage || selectedProject.html_url }} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                <h3>About</h3>
                <a class="project-modal-sidebar-link" :href="selectedProject.html_url" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> GitHub</a>
                <a class="project-modal-sidebar-link" :href="`${selectedProject.html_url}/blob/${selectedProject.default_branch}/README.md`" target="_blank" rel="noopener"><i class="fa-regular fa-book-open"></i> README</a>
                <p class="project-modal-sidebar-meta"><i class="fa-solid fa-clock-rotate-left"></i> 最終更新 {{ relativeUpdate(selectedProject.updated_at) }}</p>
                <p v-if="selectedProject.language" class="project-modal-sidebar-meta"><i class="fa-solid fa-code"></i> {{ selectedProject.language }}</p>
                <a class="project-modal-sidebar-link" :href="`${selectedProject.html_url}/activity`" target="_blank" rel="noopener"><i class="fa-solid fa-chart-line"></i> Activity</a>
              </aside>
            </div>
          </article>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
