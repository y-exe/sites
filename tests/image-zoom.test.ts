import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createImageZoom } from '../utils/image-zoom.ts'

test('zoom keeps the point under the cursor and bounds its scale', () => {
  const zoom = createImageZoom(); zoom.measure(800, 500, 800, 500)
  zoom.zoom(2, 100, 50)
  assert.deepEqual(zoom.state, { scale: 2, x: -100, y: -50 })
  zoom.zoom(12); assert.equal(zoom.state.scale, 4)
  zoom.zoom(.5); assert.deepEqual(zoom.state, { scale: 1, x: 0, y: 0 })
})
test('panning cannot lose the image and resizing clamps the visible region', () => {
  const zoom = createImageZoom(); zoom.measure(800, 500, 600, 500); zoom.zoom(2)
  zoom.pan(999, -999); assert.equal(zoom.state.x, 200); assert.equal(zoom.state.y, -250)
  zoom.measure(1200, 1000, 600, 500); assert.equal(zoom.state.x, 0); assert.equal(zoom.state.y, 0)
  zoom.reset(); assert.deepEqual(zoom.state, { scale: 1, x: 0, y: 0 })
})
