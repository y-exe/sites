import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, h, nextTick } from 'vue'

test('selection follows resized children even when the track does not resize', async t => {
  const observers = []
  let app
  const originals = Object.fromEntries(['useResizeObserver', 'document', 'matchMedia', 'cancelAnimationFrame'].map(key => [key, globalThis[key]]))
  globalThis.useResizeObserver = (target, callback) => observers.push({ target, callback })
  globalThis.document = { fonts: { ready: Promise.resolve() } }
  globalThis.matchMedia = () => ({ matches: true })
  globalThis.cancelAnimationFrame = () => {}
  t.after(() => { app?.unmount(); Object.assign(globalThis, originals) })
  const source = await readFile(new URL('../components/SelectionTrack.vue', import.meta.url), 'utf8')
  const script = compileScript(parse(source).descriptor, { id: 'selection-test', genDefaultAs: 'SelectionTrack' })
  const vueUrl = pathToFileURL(createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js')).href
  const code = stripTypeScriptTypes(`import { ref, watch, nextTick, onMounted, onUpdated, onUnmounted } from 'vue';\n${script.content}\nexport default SelectionTrack`)
    .replaceAll("from 'vue'", `from '${vueUrl}'`)
    .replace("from '~/utils/spring'", `from '${new URL('../utils/spring.ts', import.meta.url).href}'`)
  const { default: SelectionTrack } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  SelectionTrack.render = () => null
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null,
    createElement: () => ({}), createText: () => ({}), setText() {}, setElementText() {}, patchProp() {}
  })
  let instance
  app = renderer.createApp({ render: () => h(SelectionTrack, { active: 'Python', ref: value => { instance = value } }) })
  app.mount({})
  const selected = { dataset: { selection: 'Python' }, offsetLeft: 120, offsetTop: 0, offsetWidth: 90, offsetHeight: 36 }
  let children = [selected]
  const state = instance.$.setupState
  const marker = { style: {} }
  state.root = { querySelectorAll: () => children }
  state.marker = marker
  state.observeSelections()
  state.positionMarker()
  await nextTick()
  assert.equal(marker.style.width, '90px')
  const childObserver = observers.find(observer => Array.isArray(observer.target.value))
  assert.ok(childObserver)
  selected.offsetLeft = 144
  selected.offsetWidth = 104
  selected.offsetTop = 42
  childObserver.callback()
  assert.equal(marker.style.translate, '144px 42px')
  assert.equal(marker.style.width, '104px')
  children = []
  state.observeSelections()
  childObserver.callback()
  assert.equal(marker.style.opacity, '0')
  children = [selected]
  state.observeSelections()
  childObserver.callback()
  assert.equal(marker.style.opacity, '1')
  assert.equal(marker.style.width, '104px')
})
