import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceSpring, createSpring } from '../utils/spring.ts'

test('a playful spring overshoots and settles at its target', () => {
  const state = { value: 0, velocity: 0, target: 1 }
  let peak = 0
  for (let i = 0; i < 360; i++) {
    advanceSpring(state, 1 / 120, { stiffness: 240, damping: 13 })
    peak = Math.max(peak, state.value)
  }
  assert.ok(peak > 1.1 && peak < 1.3)
  assert.ok(Math.abs(state.value - 1) < .00001)
})

test('60 Hz and 144 Hz produce the same response for every damping regime', () => {
  for (const damping of [13, Math.sqrt(240) * 2, 45]) {
    const low = { value: -15, velocity: -100, target: 0 }, high = { ...low }
    for (let i = 0; i < 60; i++) advanceSpring(low, 1 / 60, { stiffness: 240, damping })
    for (let i = 0; i < 144; i++) advanceSpring(high, 1 / 144, { stiffness: 240, damping })
    assert.ok(Math.abs(low.value - high.value) < 1e-8)
    assert.ok(Math.abs(low.velocity - high.velocity) < 1e-8)
  }
})

test('retargeting preserves momentum, reduced motion snaps, disposal cancels work', () => {
  const callbacks = new Map<number, FrameRequestCallback>()
  let id = 0, reduce = false, output = 0
  globalThis.matchMedia = (() => ({ get matches() { return reduce } })) as typeof matchMedia
  globalThis.requestAnimationFrame = callback => { callbacks.set(++id, callback); return id }
  globalThis.cancelAnimationFrame = frame => { callbacks.delete(frame) }
  const spring = createSpring({ x: 0 }, value => { output = value.x }, { stiffness: 240, damping: 13 })
  const frame = (time: number) => {
    const next = callbacks.entries().next().value!
    callbacks.delete(next[0]); next[1](time)
  }
  const now = performance.now()
  spring.to({ x: 1 }); frame(now + 16)
  const before = output
  spring.to({ x: -1 })
  assert.equal(output, before)
  frame(now + 17)
  assert.ok(output > before, 'momentum continues briefly even after target changes')
  spring.jump({ x: 0 })
  assert.equal(output, 0)
  assert.equal(callbacks.size, 0)
  spring.kick({ x: 100 })
  assert.equal(callbacks.size, 1)
  frame(performance.now() + 16)
  assert.ok(output > 0)
  reduce = true
  spring.to({ x: 3 })
  assert.equal(output, 3)
  spring.stop()
  assert.equal(callbacks.size, 0)
  spring.kick({ x: 100 })
  assert.equal(callbacks.size, 0)
})
