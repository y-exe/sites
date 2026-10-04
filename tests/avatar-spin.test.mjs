import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { ref } from 'vue'

const source = await readFile(new URL('../composables/useAvatarSpin.ts', import.meta.url), 'utf8')
const code = stripTypeScriptTypes(source.replace(/^import[^\n]+\n/gm, ''))
const { useAvatarSpin } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const setup = t => {
  const names = ['ref', 'useElementVisibility', 'useDocumentVisibility', 'usePreferredReducedMotion', 'createSpring', 'watch', 'useEventListener', 'onMounted', 'onUnmounted']
  const original = Object.fromEntries(names.map(name => [name, globalThis[name]]))
  t.after(() => Object.assign(globalThis, original))
  let mount, cleanup, changed, paint, constructed = 0
  const captures = new Set(), layer = { style: {} }, reduced = ref('no-preference')
  const state = { value: 0, target: 0, velocity: 0, stopped: false }
  Object.assign(globalThis, { ref, useElementVisibility: () => ref(true), useDocumentVisibility: () => ref('visible'), usePreferredReducedMotion: () => reduced, watch: (_, fn) => { changed = fn }, useEventListener: () => {}, onMounted: fn => { mount = fn }, onUnmounted: fn => { cleanup = fn }, createSpring: (_, render) => {
    constructed++; paint = rotation => { state.value = rotation; render({ rotation }) }
    return { jump: ({ rotation }) => { paint(rotation); state.velocity = 0 }, to: ({ rotation }) => { state.target = rotation }, kick: ({ rotation }) => { state.velocity = rotation }, stop: () => { state.stopped = true } }
  } })
  const root = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 132, height: 132 }), querySelector: () => layer, setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id) }
  const spin = useAvatarSpin(ref(root))
  assert.equal(constructed, 0); mount(); assert.equal(constructed, 1)
  const pointer = (degrees, time = 0, touch = false, radius = 50) => ({ isPrimary: true, button: 0, pointerId: 1, pointerType: touch ? 'touch' : 'mouse', clientX: 66 + Math.cos(degrees * Math.PI / 180) * radius, clientY: 66 + Math.sin(degrees * Math.PI / 180) * radius, timeStamp: time, currentTarget: root, preventDefault() { this.prevented = true } })
  return { spin, state, pointer, captures, cleanup, changed, reduced, paint: value => paint(value) }
}

test('rotation crosses the angle seam smoothly, limits fling speed and returns to a full turn', t => {
  const { spin, state, pointer, captures, cleanup } = setup(t)
  spin.start(pointer(170)); spin.move(pointer(190, 16))
  assert.ok(Math.abs(state.value - 20) < .001)
  assert.equal(state.velocity, 0)
  assert.equal(spin.dragging.value, true)
  spin.end(pointer(190, 20))
  assert.equal(captures.size, 0); assert.equal(spin.dragging.value, false)
  assert.ok(Math.abs(state.velocity) <= 1200); assert.equal(state.target % 360, 0)
  const event = { preventDefault() { this.prevented = true } }
  assert.equal(spin.click(event), false); assert.equal(event.prevented, true)
  cleanup(); assert.equal(state.stopped, true)
})

test('scrolling, ordinary taps and dragging through the center do not strand or flip the image', t => {
  const { spin, state, pointer, captures, cleanup, paint } = setup(t)
  paint(70)
  spin.start(pointer(0, 0, true)); spin.move(pointer(40, 20, true))
  assert.equal(captures.size, 0); assert.equal(spin.dragging.value, false)
  assert.equal(state.target, 0)
  paint(70); spin.start(pointer(0)); spin.end(pointer(0, 20)); assert.equal(state.target, 0)
  spin.start(pointer(0)); spin.move(pointer(0, 16, false, 0)); spin.move(pointer(180, 32))
  assert.equal(state.value, 70)
  spin.end(pointer(180, 40)); assert.equal(state.velocity, 0)
  cleanup()
})

test('keyboard rotation works, and hidden or reduced-motion states release capture and reset', t => {
  const { spin, state, pointer, captures, cleanup, changed, reduced } = setup(t)
  const key = { key: 'ArrowRight', preventDefault() { this.prevented = true } }
  spin.key(key); assert.equal(state.target, 360); assert.equal(key.prevented, true)
  spin.start(pointer(0)); spin.move(pointer(90, 16)); assert.equal(captures.size, 1)
  changed([false, 'visible', 'no-preference']); assert.equal(captures.size, 0); assert.equal(state.value, 0)
  reduced.value = 'reduce'; spin.start(pointer(0)); spin.move(pointer(90, 16)); assert.equal(captures.size, 0)
  cleanup()
})
