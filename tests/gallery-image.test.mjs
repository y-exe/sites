import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes, createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, h, nextTick, reactive } from 'vue'

test('gallery retains decoded images, rejects stale loads, and recovers after failure', async t => {
  const source = await readFile(new URL('../components/ProjectGalleryImage.vue', import.meta.url), 'utf8')
  const script = compileScript(parse(source).descriptor, { id: 'gallery-test', genDefaultAs: 'GalleryImage' })
  const vueUrl = pathToFileURL(createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js')).href
  const code = stripTypeScriptTypes(`import { ref, onMounted, watch } from 'vue';\n${script.content}\nexport default GalleryImage`).replaceAll("from 'vue'", `from '${vueUrl}'`).replace("from '~/utils/gallery-image-cache'", `from '${new URL('../utils/gallery-image-cache.ts', import.meta.url).href}'`)
  const { default: GalleryImage } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  GalleryImage.render = () => null
  const pending = []
  const originalImage = globalThis.Image
  globalThis.Image = class {
    complete = true
    naturalWidth = 1000
    set src(value) { this.url = value; this.finish = this.onload; this.fail = this.onerror; pending.push(this) }
    decode() { return Promise.resolve() }
  }
  t.mock.timers.enable({ apis: ['setTimeout'] })
  t.after(() => { globalThis.Image = originalImage })
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null,
    createElement: () => ({}), createText: () => ({}), setText() {}, setElementText() {}, patchProp() {}
  })
  const props = reactive({ src: '/first.png', alt: 'first' })
  const events = []
  let instance
  const app = renderer.createApp({ render: () => h(GalleryImage, { ...props, ref: value => { instance = value }, onBusy: value => events.push(value) }) })
  app.mount({})
  t.after(() => app.unmount())
  const state = () => instance.$.setupState
  const settle = () => new Promise(resolve => setImmediate(resolve))
  assert.equal(state().displayed, null)
  pending[0].finish()
  await settle()
  assert.deepEqual(state().displayed, { src: '/first.png', alt: 'first' })
  assert.equal(events.at(-1), false)
  props.src = '/second.png'; props.alt = 'second'
  await nextTick()
  t.mock.timers.tick(180)
  assert.equal(state().loading, true)
  assert.equal(state().displayed.src, '/first.png')
  props.src = '/third.png'; props.alt = 'third'
  await nextTick()
  pending[2].finish()
  await settle()
  pending[1].finish()
  await settle()
  assert.deepEqual(state().displayed, { src: '/third.png', alt: 'third' })
  props.src = '/failed.png'
  await nextTick()
  pending[3].fail()
  await settle()
  assert.equal(state().failed, true)
  assert.equal(state().displayed.src, '/third.png')
  state().retry++
  await nextTick()
  pending[4].finish()
  await settle()
  assert.equal(state().failed, false)
  assert.equal(state().displayed.src, '/failed.png')
  const loadsBeforeReturn = pending.length
  props.src = '/first.png'; props.alt = 'first revisited'
  await nextTick()
  assert.equal(pending.length, loadsBeforeReturn)
  assert.deepEqual(state().displayed, { src: '/first.png', alt: 'first revisited' })
  assert.equal(events.at(-1), false)
  assert.equal(state().loading, false)
  props.src = '/timeout.png'
  await nextTick()
  t.mock.timers.tick(15000)
  await settle()
  assert.equal(state().failed, true)
  props.src = '/unmounted.png'
  await nextTick()
  app.unmount()
  const eventCount = events.length
  pending[6].finish()
  await settle()
  assert.equal(events.length, eventCount)
})
