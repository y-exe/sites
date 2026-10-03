import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes, createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, h, nextTick, ref } from 'vue'

test('notifications pause while reading, renew on copy, and return keyboard focus when dismissed', async t => {
  const source = await readFile(new URL('../components/TheToast.vue', import.meta.url), 'utf8')
  const script = compileScript(parse(source).descriptor, { id: 'toast-test', genDefaultAs: 'Toast' })
  const vueUrl = pathToFileURL(createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js')).href
  const code = stripTypeScriptTypes(`import { ref, computed, watch, onUnmounted } from 'vue';\nconst useSiteToast = () => ({ toast: globalThis.toastFixture });\n${script.content}\nexport default Toast`).replaceAll("from 'vue'", `from '${vueUrl}'`)
  const { default: Toast } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  Toast.render = () => null
  const originalDocument = globalThis.document
  let focusCount = 0
  const copyButton = { isConnected: true, focus: () => { focusCount++ } }
  globalThis.document = { activeElement: copyButton }
  const notification = ref({ show: false, message: '', kind: 'success' })
  globalThis.toastFixture = notification
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
  t.after(() => { globalThis.document = originalDocument; delete globalThis.toastFixture })
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null,
    createElement: () => ({}), createText: () => ({}), setText() {}, setElementText() {}, patchProp() {}
  })
  let instance
  const app = renderer.createApp({ render: () => h(Toast, { data: notification.value, ref: value => { instance = value } }) })
  app.mount({})
  t.after(() => app.unmount())
  const state = () => instance.$.setupState
  notification.value = { show: true, message: 'コピーしました', kind: 'success' }
  await nextTick()
  t.mock.timers.tick(1000)
  state().hovered = true
  await nextTick()
  t.mock.timers.tick(10000)
  assert.equal(notification.value.show, true)
  state().hovered = false
  await nextTick()
  t.mock.timers.tick(1999)
  assert.equal(notification.value.show, true)
  t.mock.timers.tick(1)
  await nextTick()
  assert.equal(notification.value.show, false)
  notification.value = { show: true, message: 'コピーしました', kind: 'success' }
  await nextTick()
  t.mock.timers.tick(2000)
  notification.value = { ...notification.value }
  await nextTick()
  t.mock.timers.tick(2999)
  assert.equal(notification.value.show, true)
  t.mock.timers.tick(1)
  await nextTick()
  assert.equal(notification.value.show, false)
  notification.value = { show: true, message: 'コピーできませんでした', kind: 'error' }
  await nextTick()
  t.mock.timers.tick(5999)
  assert.equal(notification.value.show, true)
  const dismissButton = {}
  state().dismissButton = dismissButton
  globalThis.document.activeElement = state().dismissButton
  state().focused = true
  await nextTick()
  t.mock.timers.tick(10000)
  assert.equal(notification.value.show, true)
  state().dismiss()
  await nextTick()
  assert.equal(notification.value.show, false)
  assert.equal(focusCount, 1)
})
