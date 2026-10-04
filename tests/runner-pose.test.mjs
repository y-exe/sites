import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const source = await readFile(new URL('../utils/runner-pose.ts', import.meta.url), 'utf8')
const code = stripTypeScriptTypes(source.replace("'./spring'", JSON.stringify(new URL('../utils/spring.ts', import.meta.url).href)))
const { createRunnerPose } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('jump pose blends sprites, stretches on launch, and settles after landing', () => {
  const pose = createRunnerPose(); pose.launch()
  let visual = pose.advance(1 / 60, true, -16.5)
  assert.ok(visual.y > 1); assert.ok(visual.x < 1); assert.ok(visual.angle < 0)
  for (let i = 0; i < 20; i++) visual = pose.advance(1 / 60, true, 0)
  assert.ok(visual.blend > .98)
  pose.land(); visual = pose.advance(1 / 60, false, 0)
  assert.ok(visual.y < 1); assert.ok(visual.x > 1)
  for (let i = 0; i < 180; i++) visual = pose.advance(1 / 60, false, 0)
  assert.ok(Math.abs(visual.x - 1) < .001); assert.ok(Math.abs(visual.y - 1) < .001); assert.ok(visual.blend < .001)
})
test('reduced motion preserves sprite choice with no squash or rotation', () => {
  const pose = createRunnerPose(); pose.launch()
  assert.deepEqual(pose.advance(.1, true, -16.5, true), { x: 1, y: 1, angle: 0, blend: 1 })
  pose.land()
  assert.deepEqual(pose.advance(.1, false, 0, true), { x: 1, y: 1, angle: 0, blend: 0 })
})
