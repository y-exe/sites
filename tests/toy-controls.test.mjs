import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { ref } from 'vue'

const load = async name => {
  const source = (await readFile(new URL(`../composables/${name}.ts`, import.meta.url), 'utf8')).replace(/^import[^\n]+\n/gm, '')
  return import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`)
}
const { useHoldAction } = await load('useHoldAction')
const { useToyAudio } = await load('useToyAudio')
const loopCode = stripTypeScriptTypes((await readFile(new URL('../composables/useNoteLoop.ts', import.meta.url), 'utf8')).replace(/^import[^\n]+\n/gm, ''))
const { useNoteLoop } = await import(`data:text/javascript;base64,${Buffer.from(loopCode).toString('base64')}`)

test('long press opens the instrument without toggling sound; normal clicks and moved gestures stay distinct', t => {
  const originals = { setTimeout, clearTimeout, onUnmounted: globalThis.onUnmounted }
  t.after(() => Object.assign(globalThis, originals))
  const pending = new Map(); let serial = 0, cleanup, held = 0, clicked = 0
  Object.assign(globalThis, { setTimeout: fn => { pending.set(++serial, fn); return serial }, clearTimeout: id => pending.delete(id), onUnmounted: fn => { cleanup = fn } })
  const control = useHoldAction(() => { held++ }, () => { clicked++ })
  const pointer = { isPrimary: true, button: 0, clientX: 0, clientY: 0 }
  control.start(pointer); control.cancel(); control.activate({}); assert.equal(clicked, 1)
  control.start(pointer); [...pending.values()][0](); control.cancel()
  const event = { preventDefault() { this.prevented = true }, stopPropagation() { this.stopped = true } }
  control.activate(event); assert.equal(held, 1); assert.equal(clicked, 1); assert.equal(event.prevented, true)
  control.start(pointer); control.move({ clientX: 30, clientY: 0 }); assert.equal(pending.size, 0)
  control.start(pointer); cleanup(); assert.equal(pending.size, 0)
})

test('toy audio respects OFF, creates pitched and scratch voices, and cancels pending resumes', async t => {
  const names = ['useInteractionSound', 'AudioContext', 'watch', 'useEventListener', 'onUnmounted', 'fetch', 'AudioWorkletNode']
  const originals = Object.fromEntries(names.map(name => [name, globalThis[name]]))
  t.after(() => Object.assign(globalThis, originals))
  const enabled = ref(false), nodes = [], gains = [], messages = []; let worklet; let cleanup, muted, resume, constructed = 0
  const node = () => { const n = { frequency: { value: 0 }, playbackRate: { value: 1, setValueAtTime(value) { this.value = value }, exponentialRampToValueAtTime(value) { this.end = value } }, connect() {}, disconnect() {}, start() { this.started = true }, stop() { this.stopped = true; this.onended?.() } }; nodes.push(n); return n }
  const context = { state: 'running', currentTime: 0, sampleRate: 48000, destination: {}, audioWorklet: { addModule: async () => {} }, createOscillator: node, createBufferSource: node, decodeAudioData: async () => ({ numberOfChannels: 1, length: 40000, sampleRate: 48000, getChannelData: () => new Float32Array(40000) }), createBuffer: (_, size) => ({ getChannelData: () => new Float32Array(size) }), createBiquadFilter: () => ({ frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: {}, connect() {}, disconnect() {} }), createGain: () => { const n = { gain: { cancelScheduledValues() {}, setValueAtTime() {}, exponentialRampToValueAtTime(value) { n.level = value } }, connect() {}, disconnect() {} }; gains.push(n); return n }, resume: () => new Promise(resolve => { resume = () => { context.state = 'running'; resolve() } }), close: async () => { context.closed = true } }
  Object.assign(globalThis, { AudioWorkletNode: function() { worklet = this; this.port = { postMessage: message => messages.push(message) }; this.connect = () => {}; this.disconnect = () => { this.disconnected = true } }, fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }), useInteractionSound: () => ({ enabled }), AudioContext: function() { constructed++; return context }, watch: (_, fn) => { muted = fn }, useEventListener() {}, onUnmounted: fn => { cleanup = fn } })
  const audio = useToyAudio()
  await audio.note(69); assert.equal(constructed, 0)
  enabled.value = true; await audio.note(69, .4, 'sine'); assert.equal(nodes[0].frequency.value, 440); assert.equal(nodes[0].type, 'sine'); assert.equal(nodes[0].started, true)
  await audio.scratch(-.08, .02); assert.equal(messages[0].type, 'load'); assert.deepEqual(messages[1], { type: 'move', distance: -.08, interval: .02 }); audio.endScratch(); assert.equal(messages.at(-1).type, 'stop')
  enabled.value = false; muted(false); assert.ok(nodes.every(n => n.stopped))
  enabled.value = true; context.state = 'suspended'; const pending = audio.note(72); audio.stop(); resume(); await pending; assert.equal(nodes.length, 1)
  cleanup(); assert.equal(context.closed, true); assert.equal(worklet.disconnected, true)
})

test('fast distinct notes are recorded and closing the loop cancels every scheduled note', t => {
  const names = ['ref', 'watch', 'useEventListener', 'onUnmounted', 'toySequence', 'setTimeout', 'clearTimeout']
  const originals = Object.fromEntries(names.map(name => [name, globalThis[name]]))
  t.after(() => Object.assign(globalThis, originals))
  let cleanup, serial = 0; const timers = new Map(), heard = []
  Object.assign(globalThis, { ref, watch() {}, useEventListener() {}, onUnmounted: fn => { cleanup = fn }, toySequence: events => ({ notes: events, duration: 500 }), setTimeout: fn => { timers.set(++serial, fn); return serial }, clearTimeout: id => timers.delete(id) })
  const loop = useNoteLoop(note => heard.push(note), ref(1))
  loop.record(); loop.capture(0); loop.capture(2); loop.capture(4)
  assert.deepEqual(loop.events.value.map(e => e.note), [0, 2, 4])
  loop.start(); assert.equal(timers.size, 4)
  const callbacks = [...timers.values()]; callbacks.slice(0,3).forEach(fn => fn()); assert.deepEqual(heard, [0,2,4])
  cleanup(); assert.equal(timers.size, 0); assert.equal(loop.playing.value, false)
})
