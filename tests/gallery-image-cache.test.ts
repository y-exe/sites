import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getDecodedGalleryImage, rememberDecodedGalleryImage } from '../utils/gallery-image-cache.ts'

test('decoded images are bounded, refreshed by use and expire without reusing failed loads', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1000 })
  const image = () => ({ complete: true, naturalWidth: 1000 }) as HTMLImageElement
  const first = image()
  rememberDecodedGalleryImage('/cache-one.png', first)
  for (const name of ['two', 'three', 'four']) rememberDecodedGalleryImage(`/cache-${name}.png`, image())
  assert.equal(getDecodedGalleryImage('/cache-one.png'), first)
  rememberDecodedGalleryImage('/cache-five.png', image())
  assert.equal(getDecodedGalleryImage('/cache-two.png'), null)
  assert.equal(getDecodedGalleryImage('/cache-one.png'), first)
  rememberDecodedGalleryImage('/cache-error.png', { complete: true, naturalWidth: 0 } as HTMLImageElement)
  assert.equal(getDecodedGalleryImage('/cache-error.png'), null)
  t.mock.timers.tick(5 * 60_000)
  assert.equal(getDecodedGalleryImage('/cache-one.png'), null)
  assert.equal(getDecodedGalleryImage('/cache-five.png'), null)
})
