import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createInteractionAudio } from '../utils/interaction-audio.ts'

const mockContext = () => {
  const oscillators: any[] = []
  const gains: any[] = []
  const parameter = () => ({ events: [] as number[][], setValueAtTime(value: number, time: number) { this.events.push([value, time]) }, exponentialRampToValueAtTime(value: number, time: number) { this.events.push([value, time]) } })
  const context = {
    state: 'running', currentTime: 2, destination: {}, closed: false,
    resume: async () => {}, close: async () => { context.closed = true },
    createOscillator: () => {
      const node = { frequency: parameter(), type: '', started: -1, stops: [] as number[], onended: null, connect() {}, disconnect() {}, start(time: number) { this.started = time }, stop(time = 0) { this.stops.push(time) } }
      oscillators.push(node); return node
    },
    createGain: () => { const node = { gain: parameter(), connect() {}, disconnect() {} }; gains.push(node); return node },
  }
  return { context, oscillators, gains }
}

test('audio is lazy, short, soft, and rapid ordinary taps are throttled', async () => {
  const mock = mockContext()
  let created = 0, played = 0
  const audio = createInteractionAudio(() => { created++; return mock.context as unknown as AudioContext }, () => played++)
  assert.equal(created, 0)
  await audio.play()
  await audio.play()
  assert.equal(created, 1)
  assert.equal(played, 1)
  assert.equal(mock.oscillators.length, 1)
  assert.ok(mock.oscillators[0].stops[0] - mock.oscillators[0].started < .1)
  assert.equal(mock.gains[0].gain.events[1][0], .022 * 3)
  assert.ok(mock.gains[0].gain.events.every(([gain]: number[]) => gain <= .09 && gain > 0))
  mock.context.currentTime += .05
  await audio.play()
  await audio.play('success')
  assert.equal(played, 3)
  assert.equal(mock.oscillators.length, 4)
  assert.ok(mock.oscillators[3].started > mock.oscillators[2].started)
  audio.dispose()
  assert.equal(mock.context.closed, true)
})

test('mute stops active voices and invalidates playback waiting for audio permission', async () => {
  const mock = mockContext()
  mock.context.state = 'suspended'
  let finishResume!: () => void
  mock.context.resume = () => new Promise<void>(resolve => { finishResume = () => { mock.context.state = 'running'; resolve() } })
  const audio = createInteractionAudio(() => mock.context as unknown as AudioContext)
  const pending = audio.play('open')
  audio.cancel()
  finishResume()
  await pending
  assert.equal(mock.oscillators.length, 0)
  await audio.play('open')
  audio.cancel()
  assert.ok(mock.oscillators.every(node => node.stops.at(-1) === 0))
  audio.dispose()
  await audio.play()
  assert.equal(mock.oscillators.length, 2)
})

test('unsupported or blocked audio does not break site interactions', async () => {
  const unavailable = createInteractionAudio(() => { throw new Error('No device') })
  await unavailable.play()
  unavailable.dispose()
  const mock = mockContext()
  mock.context.state = 'suspended'
  mock.context.resume = async () => { throw new Error('Blocked') }
  const blocked = createInteractionAudio(() => mock.context as unknown as AudioContext)
  await blocked.play('toggle')
  assert.equal(mock.oscillators.length, 0)
  blocked.dispose()
})
