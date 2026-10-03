import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRenderer, h } from 'vue'
import { useGallerySwipe } from '../composables/useGallerySwipe.ts'

test('gallery swipe separates horizontal navigation from scrolling, controls, clicks and cancelled gestures', t => {
  const previousMedia = globalThis.matchMedia
  let reduced = false
  globalThis.matchMedia = (() => ({ matches: reduced })) as typeof matchMedia
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null,
    createElement: () => ({}), createText: () => ({}), setText() {}, setElementText() {}, patchProp() {}
  })
  let enabled = true
  const steps: number[] = []
  let swipe: ReturnType<typeof useGallerySwipe>
  const app = renderer.createApp({ setup() { swipe = useGallerySwipe(() => enabled, direction => steps.push(direction)); return () => h('div') } })
  app.mount({})
  t.after(() => { app.unmount(); globalThis.matchMedia = previousMedia })
  let captured = 0
  const element = { clientWidth: 500, setPointerCapture(id: number) { captured = id } }
  const pointer = (x: number, y = 0, extra = {}) => ({
    pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y,
    currentTarget: element, target: { closest: () => null }, preventDefault() {}, ...extra
  }) as unknown as PointerEvent
  swipe!.start(pointer(200))
  swipe!.move(pointer(120))
  assert.equal(captured, 1)
  assert.equal(swipe!.dragging.value, true)
  assert.ok(Math.abs(parseFloat(swipe!.style.value['--gallery-drag-x']) + 22.4) < .001)
  swipe!.end(pointer(120))
  assert.deepEqual(steps, [1])
  assert.equal(swipe!.dragging.value, false)
  assert.equal(swipe!.style.value['--gallery-drag-x'], '0px')
  let prevented = 0
  let stopped = 0
  swipe!.click({ detail: 1, preventDefault: () => prevented++, stopPropagation: () => stopped++ } as MouseEvent)
  assert.equal(prevented, 1)
  assert.equal(stopped, 1)
  swipe!.click({ detail: 1, preventDefault: () => prevented++, stopPropagation() {} } as MouseEvent)
  assert.equal(prevented, 1)
  swipe!.start(pointer(200))
  swipe!.move(pointer(224))
  swipe!.end(pointer(224))
  assert.deepEqual(steps, [1])
  swipe!.start(pointer(200))
  swipe!.move(pointer(220, 80))
  swipe!.end(pointer(320, 100))
  assert.deepEqual(steps, [1])
  swipe!.start(pointer(200, 0, { target: { closest: () => ({}) } }))
  swipe!.move(pointer(80))
  swipe!.end(pointer(80))
  assert.deepEqual(steps, [1])
  swipe!.start(pointer(200))
  swipe!.move(pointer(100))
  swipe!.cancel()
  swipe!.end(pointer(100))
  assert.deepEqual(steps, [1])
  swipe!.start(pointer(200))
  swipe!.start(pointer(300, 0, { isPrimary: false, pointerId: 2 }))
  swipe!.end(pointer(80))
  assert.deepEqual(steps, [1])
  enabled = false
  swipe!.start(pointer(200))
  swipe!.end(pointer(80))
  assert.deepEqual(steps, [1])
  enabled = true
  reduced = true
  swipe!.start(pointer(200))
  swipe!.move(pointer(300))
  assert.equal(swipe!.style.value['--gallery-drag-x'], '0px')
  swipe!.end(pointer(300))
  assert.deepEqual(steps, [1, -1])
  t.mock.timers.tick(1)
  swipe!.click({ detail: 1, preventDefault: () => prevented++, stopPropagation() {} } as MouseEvent)
  assert.equal(prevented, 1)
})
