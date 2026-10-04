import test from 'node:test'
import assert from 'node:assert/strict'
import { toySequence } from '../utils/toy-sequence.ts'
import { stepToyBall } from '../utils/toy-ball.ts'

test('recorded notes retain order and spacing, scale together and have a closing gap', () => {
  const events = [{ note: 7, time: 200 }, { note: 2, time: 375 }, { note: 5, time: 950 }]
  assert.deepEqual(toySequence(events, 2), { notes: [{ note: 7, time: 0 }, { note: 2, time: 87.5 }, { note: 5, time: 375 }], duration: 550 })
  assert.equal(toySequence([], 1).duration, 500)
  assert.equal(toySequence(Array.from({ length: 100 }, (_, i) => ({ note: i, time: i * 150 }))).notes.length, 64)
})

test('each wall sounds a distinct note and reflects velocity without leaving the board', () => {
  for (const [ball, pitch] of [[{ x: 35, y: 100, vx: -400, vy: 0 }, 60], [{ x: 265, y: 100, vx: 400, vy: 0 }, 64], [{ x: 150, y: 35, vx: 0, vy: -400 }, 67], [{ x: 150, y: 205, vx: 0, vy: 400 }, 72]] as const) {
    const state = { ...ball }
    assert.deepEqual(stepToyBall(state, .03, 300, 240, 0, .8), [pitch])
    assert.ok(state.x >= 34 && state.x <= 266 && state.y >= 34 && state.y <= 206)
  }
  const resting = { x: 150, y: 206, vx: 0, vy: 0 }
  for (let i = 0; i < 120; i++) assert.deepEqual(stepToyBall(resting, 1 / 60, 300, 240, 220, .88), [])
  assert.equal(resting.vy, 0)
})
