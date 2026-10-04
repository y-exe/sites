import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { ref, computed } from 'vue'
const source = stripTypeScriptTypes(await readFile(new URL('../composables/usePlayState.ts', import.meta.url), 'utf8'))
const { usePlayState, playMoods } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
test('rare expressions require 3–5 consecutive clicks and restart after a pause', t => {
  const names = ['useState', 'computed'], originals = Object.fromEntries(names.map(name => [name, globalThis[name]]))
  const originalNow = Date.now, originalRandom = Math.random
  t.after(() => { Object.assign(globalThis, originals); Date.now = originalNow; Math.random = originalRandom })
  const states = new Map(); let now = 10000
  Object.assign(globalThis, { computed, useState: (key, initial) => { if (!states.has(key)) states.set(key, ref(initial())); return states.get(key) } })
  Date.now = () => now; Math.random = () => .99
  const play = usePlayState()
  for (let i = 1; i <= 4; i++) { play.react(); now += 100; assert.equal(play.label.value, 'Hentai') }
  play.react(); assert.equal(play.label.value, 'Unimpressed.')
  now += 1000; play.react(); assert.equal(play.mood.value, 0)
  play.sleeping.value = true; play.react(); assert.equal(play.sleeping.value, false)
  Math.random = () => 0; now += 1000
  for (let i = 1; i <= 2; i++) { play.react(); now += 100; assert.equal(play.label.value, 'Hentai') }
  play.react(); assert.equal(play.label.value, 'Sad...')
  now += 100; play.react(); assert.equal(play.label.value, 'Hentai')
  Math.random = () => 1.5 / (playMoods.length - 1); now += 1000
  for (let i = 1; i <= 2; i++) { play.react(); now += 100; assert.equal(play.label.value, 'Hentai') }
  play.react(); assert.equal(play.label.value, 'Happy!')
  for (let index = 1; index < playMoods.length; index++) {
    Math.random = () => (index - .5) / (playMoods.length - 1)
    now += 1000
    for (let click = 0; click < 5; click++) {
      play.react(); now += 100
      if (play.mood.value !== 0) break
    }
    assert.equal(play.face.value, playMoods[index].face)
    assert.equal(play.label.value, playMoods[index].label)
  }
})
