import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { ref, reactive } from 'vue'
import { stepToyBall } from '../utils/toy-ball.ts'
const code = stripTypeScriptTypes((await readFile(new URL('../composables/useAvatarBall.ts', import.meta.url), 'utf8')).replace(/^import[^\n]+\n/gm, ''))
const { useAvatarBall } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('inline ball follows dragging, bounces inside its card and resets when hidden or switched', t => {
  const names = ['ref','reactive','stepToyBall','useElementVisibility','useDocumentVisibility','usePreferredReducedMotion','watch','useResizeObserver','useEventListener','onMounted','onUnmounted','requestAnimationFrame','cancelAnimationFrame']
  const originals = Object.fromEntries(names.map(name => [name, globalThis[name]]))
  t.after(() => Object.assign(globalThis, originals))
  let mount, cleanup, changed, frame, cancelled = false
  const enabled = ref(true), visible = ref(true), captures = new Set(), hits = []
  Object.assign(globalThis, { ref, reactive, stepToyBall, useElementVisibility: () => visible, useDocumentVisibility: () => ref('visible'), usePreferredReducedMotion: () => ref('no-preference'), watch: (_, fn) => { changed = fn }, useResizeObserver() {}, useEventListener() {}, onMounted: fn => { mount = fn }, onUnmounted: fn => { cleanup = fn }, requestAnimationFrame: fn => { frame = fn; return 1 }, cancelAnimationFrame: () => { cancelled = true } })
  const root = { getBoundingClientRect: () => ({ left: 100, top: 90, width: 132, height: 132 }), setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id), releasePointerCapture: id => captures.delete(id) }
  const arena = { clientWidth: 500, clientHeight: 420, getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 420 }) }
  const ball = useAvatarBall(ref(root), ref(arena), enabled, note => hits.push(note))
  const event = (x,y,time) => ({ button: 0, isPrimary: true, pointerId: 1, pointerType: 'mouse', clientX:x, clientY:y, timeStamp:time, currentTarget:root, preventDefault() {} })
  mount(); ball.start(event(150,140,0)); ball.move(event(250,140,16))
  assert.equal(ball.offset.x,100); assert.equal(captures.size,1)
  ball.end(event(250,140,20)); assert.equal(captures.size,0)
  for(let time=16;time<3000;time+=16) { frame(time); assert.ok(ball.offset.x + 154 >= 66 && ball.offset.x + 154 <= 410); assert.ok(ball.offset.y + 144 >= 66 && ball.offset.y + 144 <= 330) }
  assert.ok(hits.length > 0)
  visible.value = false; changed(); assert.deepEqual({...ball.offset},{x:0,y:0})
  visible.value = true; ball.start(event(150,140,0)); ball.move(event(250,140,16)); enabled.value = false; changed()
  assert.equal(captures.size,0); assert.deepEqual({...ball.offset},{x:0,y:0})
  cleanup(); assert.equal(cancelled,true)
})
