import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes, createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, h, nextTick } from 'vue'

test('dialog autofocus stays quiet while Tab focus and mouse hover retain tooltips', async t => {
  const source = await readFile(new URL('../components/SiteTooltip.vue', import.meta.url), 'utf8')
  const script = compileScript(parse(source).descriptor, { id: 'tooltip-test', genDefaultAs: 'Tooltip' })
  const vueUrl = pathToFileURL(createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js')).href
  const code = stripTypeScriptTypes(`import { ref, nextTick, onMounted, onUnmounted } from 'vue';\n${script.content}\nexport default Tooltip`).replaceAll("from 'vue'", `from '${vueUrl}'`)
  const { default: Tooltip } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  Tooltip.render = () => null
  const names = ['document', 'window', 'PointerEvent', 'MutationObserver']
  const originals = Object.fromEntries(names.map(key => [key, globalThis[key]]))
  t.after(() => Object.assign(globalThis, originals))
  const listeners = new Map(), windowListeners = new Map(), attributes = new Map()
  Object.assign(globalThis, {
    document: { documentElement: { clientWidth: 390, clientHeight: 844 }, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    window: { addEventListener: (name, fn) => windowListeners.set(name, fn), removeEventListener: name => windowListeners.delete(name) },
    PointerEvent: class { constructor(type, target) { Object.assign(this, { type, target, pointerType: 'mouse', clientX: 24 }) } },
    MutationObserver: class { observe() {} disconnect() {} },
  })
  const target = {
    isConnected: true, dataset: { tooltip: '閉じる（Esc）' }, closest() { return this }, contains(node) { return node === this },
    getAttribute: name => attributes.get(name), setAttribute: (name, value) => attributes.set(name, value), removeAttribute: name => attributes.delete(name),
    getBoundingClientRect: () => ({ top: 20, bottom: 48, left: 10, right: 38, width: 28 }),
  }
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null, createElement: () => ({}), createText: () => ({}), setText() {}, setElementText() {}, patchProp() {} })
  let instance
  const app = renderer.createApp({ render: () => h(Tooltip, { ref: value => { instance = value } }) })
  app.mount({})
  t.after(() => app.unmount())
  const text = () => instance.$.setupState.text
  listeners.get('focusin')({ type: 'focusin', target })
  t.mock.timers.tick(300); await nextTick()
  assert.equal(text(), '')
  listeners.get('keydown')({ key: 'Tab' })
  listeners.get('focusin')({ type: 'focusin', target })
  t.mock.timers.tick(1); await nextTick()
  assert.equal(text(), '閉じる（Esc）')
  listeners.get('keydown')({ key: 'Enter' })
  listeners.get('focusin')({ type: 'focusin', target })
  t.mock.timers.tick(300); await nextTick()
  assert.equal(text(), '')
  listeners.get('pointerover')(new PointerEvent('pointerover', target))
  t.mock.timers.tick(299); await nextTick()
  assert.equal(text(), '')
  t.mock.timers.tick(1); await nextTick()
  assert.equal(text(), '閉じる（Esc）')
  listeners.get('pointerdown')()
  listeners.get('focusin')({ type: 'focusin', target })
  t.mock.timers.tick(300); await nextTick()
  assert.equal(text(), '')
  app.unmount()
  assert.equal(listeners.size, 0)
  assert.equal(windowListeners.size, 0)
})
