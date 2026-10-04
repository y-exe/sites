import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { ref, computed } from 'vue'
import { createImageZoom } from '../utils/image-zoom.ts'

const source = await readFile(new URL('../composables/useImageZoom.ts', import.meta.url), 'utf8')
const code = stripTypeScriptTypes(source.replace(/^import[^\n]+\n/gm, ''))
const { useImageZoom } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const setup = t => {
  const names = ['ref', 'computed', 'createImageZoom', 'createSpring', 'useResizeObserver', 'onUnmounted', 'onMounted']
  const original = Object.fromEntries(names.map(name => [name, globalThis[name]]))
  t.after(() => Object.assign(globalThis, original))
  let disposed = false, cleanup, mount, constructed = 0
  Object.assign(globalThis, { ref, computed, createImageZoom, useResizeObserver: () => {}, onMounted: fn => { mount = fn }, onUnmounted: fn => { cleanup = fn }, createSpring: (initial, paint) => { constructed++; return { to: paint, jump: paint, stop: () => { disposed = true } } } })
  const captures = new Set(), calls = []
  const stage = { clientWidth: 800, clientHeight: 500, querySelector: () => ({ offsetWidth: 800, offsetHeight: 500 }), getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 500 }), setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id) }
  const swipe = Object.fromEntries(['start', 'move', 'end', 'cancel', 'click'].map(name => [name, () => calls.push(name)]))
  const zoom = useImageZoom(ref(stage), () => true, swipe)
  assert.equal(constructed, 0)
  mount(); assert.equal(constructed, 1)
  const pointer = (id, x, y) => ({ pointerId: id, button: 0, clientX: x, clientY: y, target: { closest: () => true }, currentTarget: stage, preventDefault: () => {} })
  return { zoom, pointer, calls, captures, cleanup: () => { cleanup(); assert.equal(disposed, true) } }
}
test('normal-size images keep their swipe gesture, while enlarged images pan', t => {
  const { zoom, pointer, calls, cleanup } = setup(t)
  zoom.start(pointer(1, 400, 250)); zoom.move(pointer(1, 350, 250)); zoom.end(pointer(1, 350, 250))
  assert.deepEqual(calls, ['start', 'move', 'end'])
  zoom.change(2); zoom.start(pointer(2, 400, 250)); zoom.move(pointer(2, 550, 300)); zoom.end(pointer(2, 550, 300))
  assert.equal(zoom.style.value['--image-pan-x'], '150px'); assert.equal(zoom.style.value['--image-pan-y'], '50px')
  assert.equal(calls.filter(name => name === 'move').length, 1)
  zoom.reset(); assert.equal(zoom.scale.value, 1); cleanup()
})
test('pinch captures both fingers and continues panning with the remaining finger', t => {
  const { zoom, pointer, captures, cleanup } = setup(t)
  zoom.start(pointer(1, 300, 400)); zoom.start(pointer(2, 500, 400)); zoom.move(pointer(2, 600, 400))
  assert.equal(zoom.scale.value, 1.5); assert.deepEqual([...captures], [1, 2])
  assert.equal(zoom.style.value['--image-pan-x'], '50px')
  zoom.end(pointer(2, 600, 400)); zoom.move(pointer(1, 330, 400))
  assert.equal(zoom.style.value['--image-pan-x'], '80px')
  zoom.end(pointer(1, 330, 400)); assert.equal(zoom.dragging.value, false); cleanup()
})
