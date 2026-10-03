import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRenderer, h, nextTick, ref } from 'vue'
import { useVideoPlayback } from '../composables/useVideoPlayback.ts'

test('videos pause offscreen, restart on return and cannot resume from an obsolete play request', async t => {
  const playing = ref(false)
  const restart = ref(true)
  let playCalls = 0
  let completePlay: (() => void) | undefined
  const video = {
    paused: true, currentTime: 4, muted: false, defaultMuted: false, playsInline: false, isConnected: true,
    pause() { this.paused = true },
    play() {
      playCalls++
      return new Promise<void>(resolve => { completePlay = () => { this.paused = false; resolve() } })
    }
  }
  const target = ref(video as unknown as HTMLVideoElement)
  const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null,
    createElement: () => ({}), createText: () => ({}), setText() {}, setElementText() {}, patchProp() {}
  })
  let sync: () => void
  const app = renderer.createApp({ setup() { sync = useVideoPlayback([target], playing, restart); return () => h('div') } })
  app.mount({})
  t.after(() => app.unmount())
  assert.equal(playCalls, 0)
  assert.equal(video.paused, true)
  assert.equal(video.currentTime, 0)
  restart.value = false
  playing.value = true
  await nextTick()
  assert.equal(playCalls, 1)
  assert.equal(video.muted, true)
  assert.equal(video.defaultMuted, true)
  assert.equal(video.playsInline, true)
  playing.value = false
  restart.value = true
  await nextTick()
  completePlay!()
  await nextTick()
  assert.equal(video.paused, true)
  restart.value = false
  playing.value = true
  await nextTick()
  completePlay!()
  await nextTick()
  assert.equal(video.paused, false)
  video.currentTime = 3
  playing.value = false
  await nextTick()
  assert.equal(video.paused, true)
  assert.equal(video.currentTime, 3)
  playing.value = true
  await nextTick()
  completePlay!()
  await nextTick()
  assert.equal(video.paused, false)
  playing.value = false
  restart.value = true
  await nextTick()
  assert.equal(video.currentTime, 0)
  playing.value = true
  restart.value = false
  await nextTick()
  video.isConnected = false
  completePlay!()
  await nextTick()
  assert.equal(video.paused, true)
  target.value.play = () => Promise.reject(new Error('autoplay unavailable'))
  sync!()
  await nextTick()
  await nextTick()
  assert.equal(video.paused, true)
})
