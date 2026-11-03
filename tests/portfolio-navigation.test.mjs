import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRenderer, nextTick, reactive, ref } from 'vue'
import { usePortfolioNavigation } from '../composables/usePortfolioNavigation.ts'
import { useSectionNavigation } from '../composables/useSectionNavigation.ts'
import { portfolioEntry, projectThemeActive } from '../utils/portfolio-navigation.ts'

const settle = async () => { await nextTick(); await nextTick() }
function harness(t, path = '/', project = null) {
  const keys = ['useRoute', 'useRouter', 'document', 'window', 'matchMedia']
  const originals = Object.fromEntries(keys.map(key => [key, globalThis[key]]))
  const route = reactive({ path, hash: '', query: {}, params: project ? { project } : {} })
  const routes = []
  const setRoute = value => {
    route.path = typeof value === 'string' ? value : value.path
    route.params = route.path.startsWith('/project/') ? { project: route.path.slice('/project/'.length) } : {}
    route.query = typeof value === 'string' ? {} : value.query || {}
    route.hash = ''
  }
  globalThis.useRoute = () => route
  globalThis.useRouter = () => ({
    push: value => { routes.push({ method: 'push', value }); setRoute(value); return Promise.resolve() },
    replace: value => { routes.push({ method: 'replace', value }); setRoute(value); return Promise.resolve() },
  })
  const targets = { '#projects': { id: 'projects' }, '#about': { id: 'about' }, '#top': { id: 'top' } }
  const scrolls = []
  globalThis.document = { querySelector: id => targets[id] }
  globalThis.window = { scrollY: 460, scrollTo: () => {} }
  globalThis.matchMedia = () => ({ matches: false })
  const lenis = { scrollTo: (target, options) => { scrolls.push({ target, options }); if (options.immediate && typeof target === 'number') window.scrollY = target } }
  const loading = ref(true)
  let navigation
  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null })
  const app = renderer.createApp({ setup() { navigation = usePortfolioNavigation(() => lenis, loading); return () => null } })
  app.mount({})
  t.after(() => { app.unmount(); Object.assign(globalThis, originals) })
  return { route, routes, scrolls, loading, navigation, targets }
}

test('section landing URLs disappear immediately and scroll only after loading', async t => {
  const state = harness(t, '/project')
  assert.equal(state.route.path, '/')
  assert.equal(state.routes[0].method, 'replace')
  assert.equal(state.scrolls.length, 1)
  assert.equal(state.scrolls[0].target, 0)
  state.loading.value = false
  await settle()
  assert.equal(state.scrolls.at(-1).target, state.targets['#projects'])
  assert.equal(state.scrolls.at(-1).options.duration, 1.2)
})

test('a project landing reveals details only after the entry scroll completes', async t => {
  const state = harness(t, '/project/sites', 'sites')
  assert.equal(state.routes.length, 0)
  state.loading.value = false
  await settle()
  assert.equal(state.navigation.requestedProject.value, null)
  state.scrolls.at(-1).options.onComplete()
  await settle()
  assert.equal(state.navigation.requestedProject.value, 'sites')
  assert.equal(state.route.path, '/project/sites')
})

test('opening, closing and history changes preserve the manual card position', async t => {
  const state = harness(t)
  state.loading.value = false
  await settle()
  window.scrollY = 673
  state.navigation.openProjectLink('notice-selfbot')
  await settle()
  assert.equal(state.route.path, '/project/notice-selfbot')
  assert.equal(state.navigation.requestedProject.value, 'notice-selfbot')
  assert.equal(window.scrollY, 673)
  assert.equal(state.scrolls.length, 0)
  state.navigation.clearProjectLink()
  await settle()
  assert.equal(state.route.path, '/')
  assert.equal(state.navigation.requestedProject.value, null)
  state.route.path = '/project/notice-selfbot'
  state.route.params = { project: 'notice-selfbot' }
  await settle()
  assert.equal(state.navigation.requestedProject.value, 'notice-selfbot')
  assert.equal(state.scrolls.length, 0)
})

test('a manual card choice cancels the pending landing without revealing the old card', async t => {
  const state = harness(t, '/project/sites', 'sites')
  state.loading.value = false
  await settle()
  const finishOldScroll = state.scrolls.at(-1).options.onComplete
  window.scrollY = 395
  state.navigation.openProjectLink('notice-selfbot')
  finishOldScroll()
  await settle()
  assert.equal(window.scrollY, 395)
  assert.equal(state.navigation.requestedProject.value, 'notice-selfbot')
})

test('navigation clicks scroll without calling the router or changing the URL', t => {
  const originals = Object.fromEntries(['MouseEvent', 'document', 'matchMedia'].map(key => [key, globalThis[key]]))
  class Click extends Event { button = 0; detail = 1; metaKey = false; ctrlKey = false; shiftKey = false; altKey = false }
  globalThis.MouseEvent = Click
  const target = {}
  globalThis.document = { querySelector: () => target }
  globalThis.matchMedia = () => ({ matches: false })
  t.after(() => Object.assign(globalThis, originals))
  const scrolls = []
  let cancelled = 0
  const navigate = useSectionNavigation(() => ({ scrollTo: (...args) => scrolls.push(args) }), () => { cancelled++ })
  const event = new Click('click', { cancelable: true })
  navigate(event, '#projects')
  assert.equal(event.defaultPrevented, true)
  assert.equal(cancelled, 1)
  assert.equal(scrolls[0][0], target)
})

test('theme changes before the section landing line and entry intents stay distinct', () => {
  assert.equal(projectThemeActive(161), false)
  assert.equal(projectThemeActive(160), true)
  assert.equal(projectThemeActive(80), true)
  assert.equal(portfolioEntry('/about', '', null).transient, true)
  assert.equal(portfolioEntry('/project/notice-selfbot', '', 'notice-selfbot').transient, false)
  assert.equal(portfolioEntry('/', '', null), null)
})
