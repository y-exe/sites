import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { ref } from 'vue'

const source = await readFile(new URL('../composables/useElasticWord.ts', import.meta.url), 'utf8')
const code = stripTypeScriptTypes(source.replace(/^import[^\n]+\n/gm, ''))
const { useElasticWord } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const setup = t => {
  const names = ['useElementVisibility', 'useDocumentVisibility', 'usePreferredReducedMotion', 'createSpring', 'watch', 'useEventListener', 'onUnmounted']
  const original = Object.fromEntries(names.map(name => [name, globalThis[name]]))
  t.after(() => Object.assign(globalThis, original))
  let watchChange, cleanup
  const motion = new Map(), captures = new Set(), nodes = Array.from({ length: 8 }, () => ({ style: {} }))
  const visible = ref(true), visibility = ref('visible'), reduced = ref('no-preference')
  Object.assign(globalThis, { useElementVisibility: () => visible, useDocumentVisibility: () => visibility, usePreferredReducedMotion: () => reduced, watch: (_, fn) => { watchChange = fn }, useEventListener: () => {}, onUnmounted: fn => { cleanup = fn }, createSpring: (initial, paint) => {
    const state = { value: initial, target: initial, stopped: false }
    motion.set(motion.size, state)
    return { jump: value => { state.value = value; paint(value) }, to: target => { state.target = target }, kick: () => {}, stop: () => { state.stopped = true } }
  } })
  const root = { querySelectorAll: () => nodes, setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id) }
  const word = useElasticWord(ref(root))
  const pointer = (x, y, touch = false, id = 1) => ({ button: 0, isPrimary: true, pointerId: id, pointerType: touch ? 'touch' : 'mouse', clientX: x, clientY: y, currentTarget: root, target: { closest: () => nodes[3] }, preventDefault() { this.prevented = true } })
  return { word, pointer, captures, motion, cleanup, watchChange, reduced }
}

test('a grabbed letter moves its neighbors, stays bounded and springs back without a second click wave', t => {
  const { word, pointer, captures, motion, cleanup } = setup(t)
  word.start(pointer(100, 100)); word.move(pointer(5000, 5000))
  assert.deepEqual([...captures], [1])
  const values = [...motion.values()].map(state => state.value)
  assert.equal(values[3].x, 32); assert.equal(values[3].y, 24)
  assert.ok(values[2].x < values[3].x && values[2].x > values[1].x)
  word.end(pointer(5000, 5000)); assert.equal(captures.size, 0)
  for (const state of motion.values()) assert.deepEqual(state.target, { x: 0, y: 0, angle: 0 })
  const event = { preventDefault() { this.prevented = true } }
  word.click(event); assert.equal(event.prevented, true)
  cleanup(); assert.ok([...motion.values()].every(state => state.stopped))
})

test('vertical touch scrolling stays native, horizontal dragging captures, and offscreen or reduced motion resets', t => {
  const { word, pointer, captures, motion, cleanup, watchChange, reduced } = setup(t)
  word.start(pointer(100, 100, true)); const vertical = pointer(102, 140, true); word.move(vertical)
  assert.equal(captures.size, 0); assert.equal(vertical.prevented, undefined); assert.equal(motion.size, 0)
  word.start(pointer(100, 100, true)); const horizontal = pointer(140, 102, true); word.move(horizontal)
  assert.equal(captures.size, 1); assert.equal(horizontal.prevented, true)
  watchChange([false, 'visible', 'no-preference']); assert.equal(captures.size, 0)
  assert.ok([...motion.values()].every(state => state.value.x === 0 && state.value.y === 0))
  reduced.value = 'reduce'; word.start(pointer(100, 100)); word.move(pointer(140, 102)); assert.equal(captures.size, 0)
  cleanup()
})
