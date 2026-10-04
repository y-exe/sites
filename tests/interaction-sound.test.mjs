import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { ref, watch, nextTick } from 'vue'

test('saved sound preference restores after hydration, and enabling plays after state changes', async t => {
  const names = ['useState', 'useNuxtApp', 'localStorage']
  const originals = Object.fromEntries(names.map(key => [key, globalThis[key]]))
  t.after(() => Object.assign(globalThis, originals))
  const states = new Map(), played = [], saved = []
  Object.assign(globalThis, {
    useState: (key, initial) => { if (!states.has(key)) states.set(key, ref(initial())); return states.get(key) },
    localStorage: { getItem: () => storedPreference, setItem: (key, value) => saved.push(value) },
    useNuxtApp: () => ({ $interactionAudio: { play: kind => { assert.equal(states.get('site-sound-enabled').value, true); played.push(kind) } } }),
  })
  const source = await readFile(new URL('../composables/useInteractionSound.ts', import.meta.url), 'utf8')
  const code = stripTypeScriptTypes(source)
  const { useInteractionSound } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  let storedPreference = null
  const sound = useInteractionSound()
  assert.equal(sound.enabled.value, true)
  assert.equal(played.length, 0)
  sound.restore()
  assert.equal(sound.enabled.value, true)
  assert.equal(played.length, 0)
  storedPreference = '0'
  sound.restore()
  assert.equal(sound.enabled.value, false)
  storedPreference = '1'
  sound.restore()
  assert.equal(sound.enabled.value, true)
  sound.toggle()
  assert.equal(sound.enabled.value, false)
  assert.equal(played.length, 0)
  sound.toggle()
  assert.equal(sound.enabled.value, true)
  assert.deepEqual(played, ['toggle'])
  assert.deepEqual(saved, ['0', '1'])
  assert.equal(useInteractionSound().enabled, sound.enabled)
})

test('sound follows activation and copy results, respects mute, and cleans up listeners', async t => {
  const names = ['document', 'window', 'localStorage', 'watch', 'useInteractionSound', 'useSiteToast', 'createInteractionAudio']
  const originals = Object.fromEntries(names.map(key => [key, globalThis[key]]))
  t.after(() => Object.assign(globalThis, originals))
  const enabled = ref(false), pulse = ref(0), toast = ref({ show: false, kind: 'success' })
  const listeners = new Map(), windowListeners = new Map(), played = []
  let unlocks = 0, cancels = 0, disposed = false, unmount, clickCapture, errorPage = false
  const document = { visibilityState: 'visible', querySelector: () => errorPage ? {} : null, addEventListener: (name, fn, capture) => { listeners.set(name, fn); if (name === 'click') clickCapture = capture }, removeEventListener: name => listeners.delete(name) }
  Object.assign(globalThis, {
    document, window: { addEventListener: (name, fn) => windowListeners.set(name, fn), removeEventListener: name => windowListeners.delete(name) },
    localStorage: { getItem: () => '1' }, watch,
    useInteractionSound: () => ({ enabled, pulse }), useSiteToast: () => ({ toast }),
    createInteractionAudio: (factory, onPlay) => ({ unlock: () => { unlocks++ }, play: kind => { played.push(kind); onPlay() }, cancel: () => { cancels++ }, dispose: () => { disposed = true } }),
  })
  const source = await readFile(new URL('../plugins/interaction-sound.client.ts', import.meta.url), 'utf8')
  const code = stripTypeScriptTypes(source.replace(/^import[^\n]+\n/, '').replace('export default defineNuxtPlugin(', 'export default ('))
  const { default: setup } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  const { provide } = setup({ vueApp: { onUnmount: fn => { unmount = fn } } })
  const host = (attributes = {}, classes = '') => ({
    closest: selector => selector.startsWith('[inert]') ? null : element,
    matches: selector => selector.startsWith(':disabled') ? attributes.disabled : classes.split(' ').some(name => name && selector.includes(`.${name}`)),
    getAttribute: name => attributes[name], hasAttribute: name => name in attributes,
  })
  let element = host()
  const click = (values = {}) => listeners.get('click')({ button: 0, target: element, ...values })
  click()
  assert.equal(unlocks, 0)
  enabled.value = true
  assert.equal(enabled.value, true)
  click({ detail: 0 })
  assert.deepEqual(played, ['tap'])
  assert.equal(clickCapture, true)
  errorPage = true; click(); assert.equal(played.length, 1); errorPage = false
  assert.equal(listeners.has('pointerenter'), false)
  click({ ctrlKey: true })
  element = host({ disabled: true }); click()
  assert.equal(played.length, 1)
  element = host({ 'aria-label': 'メールアドレスをコピー' }); click()
  assert.equal(played.length, 2)
  assert.equal(unlocks, 2)
  toast.value = { show: true, kind: 'success' }; await nextTick()
  assert.deepEqual(played, ['tap', 'tap', 'success'])
  element = host({}, 'modal-close-btn'); click()
  assert.equal(played.at(-1), 'close')
  element = { ...host(), closest: () => null }; click()
  assert.equal(played.at(-1), 'tap')
  element = { ...host({}, 'project-modal-overlay'), closest: () => null }; click()
  assert.equal(played.at(-1), 'close')
  const beforeMute = played.length
  enabled.value = false
  assert.equal(cancels, 1)
  click()
  toast.value = { show: true, kind: 'success' }; await nextTick()
  assert.equal(played.length, beforeMute)
  windowListeners.get('storage')({ key: 'site-sound-enabled', newValue: '1' })
  element = host({ 'data-sound-toggle': '' }); click(); provide.interactionAudio.play('toggle'); await nextTick()
  assert.equal(played.at(-1), 'toggle')
  click(); enabled.value = false; await nextTick()
  assert.equal(played.length, beforeMute + 1)
  document.visibilityState = 'hidden'; listeners.get('visibilitychange')()
  assert.equal(cancels, 3)
  unmount()
  assert.equal(disposed, true)
  assert.equal(listeners.size, 0)
  assert.equal(windowListeners.size, 0)
})
