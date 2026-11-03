import type Lenis from 'lenis'
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch, type Ref } from 'vue'
import { portfolioEntry } from '../utils/portfolio-navigation.ts'
import { projectPath } from '../utils/site-links.ts'

export const usePortfolioNavigation = (getLenis: () => Lenis | null, isLoading: Ref<boolean>) => {
  const route = useRoute()
  const router = useRouter()
  const routeProject = computed(() => typeof route.params.project === 'string' ? route.params.project
    : typeof route.query.project === 'string' ? route.query.project : null)
  const entry = portfolioEntry(route.path, route.hash, routeProject.value)
  const projectLinkReady = ref(!entry?.project)
  let entryPending = Boolean(entry)
  let scrolling = false
  let version = 0
  let finishScroll: (() => void) | undefined

  const cancelEntryNavigation = () => {
    version++
    entryPending = false
    if (scrolling) getLenis()?.scrollTo(window.scrollY, { immediate: true, force: true })
    finishScroll?.()
  }
  provide('cancel-entry-navigation', cancelEntryNavigation)

  const runEntryNavigation = async () => {
    const attempt = ++version
    await nextTick()
    if (!entry || !entryPending || attempt !== version) return
    const target = document.querySelector<HTMLElement>(entry.section)
    if (target) {
      scrolling = true
      await new Promise<void>(resolve => {
        finishScroll = () => { finishScroll = undefined; scrolling = false; resolve() }
        const lenis = getLenis()
        if (lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          lenis.scrollTo(entry.section === '#top' ? 0 : target, { duration: 1.2, onComplete: finishScroll })
        } else {
          if (entry.section === '#top') window.scrollTo({ top: 0, behavior: 'instant' })
          else target.scrollIntoView({ behavior: 'instant' })
          finishScroll()
        }
      })
    }
    if (attempt !== version) return
    entryPending = false
    projectLinkReady.value = true
  }

  onMounted(() => {
    if (!entry) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo({ top: 0, behavior: 'instant' })
    if (entry.transient) {
      const query = { ...route.query }
      delete query.project
      void router.replace({ path: '/', query, hash: '' })
    }
    if (!isLoading.value) void runEntryNavigation()
  })
  watch(isLoading, loading => { if (!loading && entryPending) void runEntryNavigation() }, { flush: 'post' })
  watch(routeProject, name => {
    if (entryPending && entry?.project && name !== entry.project) cancelEntryNavigation()
    if (!entryPending) projectLinkReady.value = true
  })
  onUnmounted(cancelEntryNavigation)

  const openProjectLink = (name: string) => {
    cancelEntryNavigation()
    projectLinkReady.value = true
    void router.push(projectPath(name))
  }
  const clearProjectLink = () => {
    cancelEntryNavigation()
    if (routeProject.value) void router.push('/')
  }

  return {
    requestedProject: computed(() => !isLoading.value && projectLinkReady.value ? routeProject.value : null),
    openProjectLink, clearProjectLink, cancelEntryNavigation,
  }
}
