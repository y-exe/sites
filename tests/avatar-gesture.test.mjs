import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { avatarGestureMode } from '../utils/avatar-gesture.ts'

const source = stripTypeScriptTypes((await readFile(new URL('../composables/useAvatarGesture.ts', import.meta.url), 'utf8')).replace(/^import[^\n]+\n/gm, ''))
const { useAvatarGesture } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('automatic gestures distinguish edge rotation from pulling and lock until release', t => {
  const names = ['avatarGestureMode', 'useEventListener', 'onUnmounted', 'useElementVisibility', 'useDocumentVisibility', 'watch']
  const originals = Object.fromEntries(names.map(name => [name, globalThis[name]]))
  t.after(() => Object.assign(globalThis, originals))
  Object.assign(globalThis, { avatarGestureMode, useEventListener() {}, onUnmounted() {}, useElementVisibility: () => ({ value: true }), useDocumentVisibility: () => ({ value: 'visible' }), watch() {} })
  const calls = [], capture = new Set()
  const host = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 132, height: 132 }), setPointerCapture: id => capture.add(id), hasPointerCapture: id => capture.has(id), releasePointerCapture: id => capture.delete(id) }
  const control = kind => Object.fromEntries(['start','move','end','cancel','pause','reset'].map(method => [method, () => calls.push(`${kind}.${method}`)]))
  const gesture = useAvatarGesture({ value: host }, control('scratch'), control('ball'), () => calls.push('prepare'))
  const event = (x, y, pointerType = 'mouse') => ({ isPrimary: true, button: 0, pointerId: 1, clientX: x, clientY: y, timeStamp: 16, currentTarget: host, pointerType, preventDefault() {} })
  gesture.start(event(120,66)); gesture.move(event(120,69))
  assert.ok(!calls.includes('scratch.start'))
  gesture.move(event(118,82)); gesture.move(event(150,66)); gesture.end(event(150,66))
  assert.ok(calls.includes('scratch.start')); assert.ok(calls.includes('scratch.end'))
  assert.ok(!calls.includes('ball.start')); assert.equal(capture.size,0)
  assert.equal(gesture.click(event(150,66)),false)
  calls.length = 0
  gesture.start(event(66,66)); gesture.move(event(110,70)); gesture.end(event(110,70))
  assert.ok(calls.includes('ball.start')); assert.ok(calls.includes('ball.end'))
  assert.ok(!calls.includes('scratch.start'))
  calls.length = 0
  gesture.start(event(120,66,'touch')); gesture.move(event(120,90,'touch'))
  assert.ok(!calls.includes('ball.start') && !calls.includes('scratch.start'))
  assert.equal(gesture.move(event(125,95,'touch')),false)
})

test('radial edge drags throw; tangential drags rotate on either side', () => {
  assert.equal(avatarGestureMode(55,0,20,0,66),'ball')
  assert.equal(avatarGestureMode(55,0,0,-20,66),'scratch')
  assert.equal(avatarGestureMode(-55,0,0,20,66),'scratch')
  assert.equal(avatarGestureMode(0,-55,20,0,66),'scratch')
  assert.equal(avatarGestureMode(5,0,0,20,66),'ball')
})
