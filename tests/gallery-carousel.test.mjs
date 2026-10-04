import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes, createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, h, nextTick, ref } from 'vue'

test('carousel gives each decoded image four seconds and pauses for interaction and loading', async t => {
  const source = await readFile(new URL('../components/ProjectsSection.vue', import.meta.url), 'utf8')
  const script = compileScript(parse(source).descriptor, { id: 'carousel-test', genDefaultAs: 'Projects' })
  const vueUrl = pathToFileURL(createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js')).href
  const code = stripTypeScriptTypes(`
    import { ref, nextTick } from 'vue';
    const usePreferredReducedMotion = () => ref('no-preference');
    const useResizeObserver = () => {};
    const useEventListener = () => {};
    const useDialogFocus = () => {};
    let copiedProjectLink;
    const useSiteToast = () => ({ copy: async value => { copiedProjectLink = value; return true } });
    export const getCopiedProjectLink = () => copiedProjectLink;
    ${script.content}
    export default Projects;
  `)
    .replaceAll("from 'vue'", `from '${vueUrl}'`)
    .replace("from '~/utils/language-icons'", `from '${new URL('../utils/language-icons.ts', import.meta.url).href}'`)
    .replace("from '~/composables/useGallerySwipe'", `from '${new URL('../composables/useGallerySwipe.ts', import.meta.url).href}'`)
    .replace("from '~/utils/project-search'", `from '${new URL('../utils/project-search.ts', import.meta.url).href}'`)
    .replace("import ProjectGalleryImage from './ProjectGalleryImage.vue'", 'const ProjectGalleryImage = {}')
  const { default: Projects, getCopiedProjectLink } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  Projects.render = () => null
  const originals = { document: globalThis.document, window: globalThis.window, matchMedia: globalThis.matchMedia }
  const classList = { toggle() {}, remove() {} }
  globalThis.document = { hidden: false, body: { classList }, addEventListener() {}, removeEventListener() {} }
  globalThis.window = { location: { origin: 'https://yexe.net' }, addEventListener() {}, removeEventListener() {} }
  globalThis.matchMedia = () => ({ matches: false })
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] })
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null,
    createElement: () => ({}), createText: () => ({}), setText() {}, setElementText() {}, patchProp() {}
  })
  let instance
  const projectList = ref(null)
  const app = renderer.createApp({ render: () => h(Projects, { projects: projectList.value, status: 'idle', ref: value => { instance = value } }) })
  app.provide('registerThemeTrigger', () => {})
  app.mount({})
  t.after(() => { app.unmount(); Object.assign(globalThis, originals) })
  const state = () => instance.$.setupState
  const advance = async ms => { t.mock.timers.tick(ms); await nextTick() }
  state().projectDetails = { 1: { description: '', shields: [], commitTrend: '', images: ['/one.png', '/two.png'] } }
  state().selectedProject = { id: 1, name: 'sites' }
  await nextTick()
  await advance(8000)
  assert.equal(state().currentProjectImageIndex, 0)
  state().galleryImageBusy = false
  await nextTick()
  await advance(3999)
  assert.equal(state().currentProjectImageIndex, 0)
  await advance(1)
  assert.equal(state().currentProjectImageIndex, 1)
  assert.equal(state().galleryImageBusy, true)
  await advance(12000)
  assert.equal(state().currentProjectImageIndex, 1)
  state().galleryImageBusy = false
  await nextTick()
  await advance(3999)
  assert.equal(state().currentProjectImageIndex, 1)
  await advance(1)
  assert.equal(state().currentProjectImageIndex, 0)
  state().galleryImageBusy = false
  await nextTick()
  state().interactWithCarousel(true)
  await advance(8000)
  assert.equal(state().currentProjectImageIndex, 0)
  state().interactWithCarousel(false)
  await advance(4000)
  assert.equal(state().currentProjectImageIndex, 1)
  state().toggleCarousel()
  state().galleryImageBusy = false
  await nextTick()
  await advance(8000)
  assert.equal(state().currentProjectImageIndex, 1)
  state().toggleCarousel()
  await advance(4000)
  assert.equal(state().currentProjectImageIndex, 0)
  state().galleryImageBusy = false
  await nextTick()
  state().isImageViewerOpen = true
  await nextTick()
  await advance(8000)
  assert.equal(state().currentProjectImageIndex, 0)
  state().isImageViewerOpen = false
  await nextTick()
  await advance(4000)
  assert.equal(state().currentProjectImageIndex, 1)
  await t.test('sharing copies the currently selected project and a URL that can reopen it', async () => {
    state().selectedProject = { id: 2, name: 'DiscordWebBotClient' }
    await nextTick()
    await state().copyProjectLink()
    assert.equal(getCopiedProjectLink(), 'https://yexe.net/?project=DiscordWebBotClient#projects')
    assert.equal(state().projectLinkCopied, true)
    state().selectedProject = { id: 3, name: 'different-project' }
    await nextTick()
    assert.equal(state().projectLinkCopied, false)
    await state().copyProjectLink()
    assert.equal(getCopiedProjectLink(), 'https://yexe.net/?project=different-project#projects')
  })

  await t.test('project browsing follows the filter, preserves return focus and resets the image viewer', async () => {
    const repos = [{ id: 10, name: 'first', language: 'Vue' }, { id: 11, name: 'middle', language: 'Python' }, { id: 12, name: 'last', language: 'Vue' }]
    projectList.value = repos
    state().selectedProject = repos[0]
    const origin = Object.freeze({})
    state().projectReturnFocus = origin
    state().currentProjectImageIndex = 3
    state().isImageViewerOpen = true
    await nextTick()
    assert.equal(state().browsingIndex, 0)
    assert.equal(state().previousProject, undefined)
    await state().browseProject(1)
    assert.equal(state().selectedProject.id, 11)
    assert.equal(state().currentProjectImageIndex, 0)
    assert.equal(state().isImageViewerOpen, false)
    assert.equal(state().projectReturnFocus, origin)
    state().selectedLanguage = 'Vue'
    state().selectedProject = repos[0]
    await nextTick()
    assert.equal(state().browsingProjects.length, 2)
    await state().browseProject(1)
    assert.equal(state().selectedProject.id, 12)
    assert.equal(state().nextProject, undefined)
    await state().browseProject(1)
    assert.equal(state().selectedProject.id, 12)
    await state().browseProject(-1)
    assert.equal(state().selectedProject.id, 10)
  })
})
