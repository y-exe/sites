import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRunnerGame, RUNNER } from '../utils/runner-game.ts'

test('runner physics and score do not depend on screen refresh rate', () => {
  const run = (hz: number) => {
    const runner = createRunnerGame(() => .5); runner.start(); runner.input()
    for (let i = 0; i < hz; i++) runner.advance(1 / hz)
    return runner.game
  }
  assert.deepEqual(run(60), run(144))
})
test('pause freezes the game, restarting resets it, and collisions finish the run', () => {
  const events: string[] = [], runner = createRunnerGame(() => .5, e => events.push(e))
  runner.input(); runner.advance(.1); runner.pause()
  const frame = runner.game.frame
  runner.advance(.1); runner.input()
  assert.equal(runner.game.frame, frame)
  assert.equal(runner.game.jumping, false)
  runner.pause(); runner.game.obstacles.push({ x: RUNNER.x + 15, size: 80, counted: false }); runner.advance(1 / 60)
  assert.equal(runner.game.state, 'dead'); assert.equal(events.at(-1), 'dead')
  runner.input(); assert.equal(runner.game.state, 'running'); assert.equal(runner.game.score, 0); assert.equal(runner.game.obstacles.length, 0)
})
test('jump requests just before landing are buffered once, not double-fired', () => {
  const events: string[] = [], runner = createRunnerGame(() => .5, e => events.push(e))
  runner.start(); runner.input()
  for (let i = 0; i < 34; i++) runner.advance(1 / 60)
  runner.input()
  for (let i = 0; i < 5; i++) runner.advance(1 / 60)
  assert.deepEqual(events.slice(0, 3), ['jump', 'land', 'jump'])
  assert.equal(runner.game.jumping, true)
})
test('the full jump stays inside the playfield while clearing the tallest obstacle', () => {
  const runner = createRunnerGame(() => .5); runner.start(); runner.input()
  let minimumY = runner.game.y
  for (let i = 0; i < 60; i++) { runner.advance(1 / 60); minimumY = Math.min(minimumY, runner.game.y) }
  assert.ok(minimumY >= 0)
  assert.ok(minimumY + RUNNER.heightRun < RUNNER.ground - 100)
})
