import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ScratchTransport } from '../public/audio/scratch-transport.js'

test('scratch uses a nonempty PCM recording instead of the synthesized vowel', async () => {
  const wav = await readFile(new URL('../public/audio/vinyl-scratch.wav', import.meta.url))
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF')
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE')
  assert.ok(wav.length > 50000 && wav.length < 100000)
  let position = 12, data
  while (position + 8 < wav.length) {
    const length = wav.readUInt32LE(position + 4)
    if (wav.toString('ascii', position, position + 4) === 'data') { data = wav.subarray(position + 8, position + 8 + length); break }
    position += 8 + length + length % 2
  }
  assert.ok(data)
  let energy = 0
  for (let i = 0; i < data.length; i += 2) energy += (data.readInt16LE(i) / 32768) ** 2
  assert.ok(Math.sqrt(energy / (data.length / 2)) > .03)
})

test('record movement follows distance exactly, reverses over the same audio and fades when stopped', () => {
  const transport = new ScratchTransport(48000)
  const samples = Float32Array.from({ length: 44100 }, (_, i) => Math.sin(i * .08))
  transport.load(samples, 44100)
  const initial = transport.position
  transport.move(.12, .02)
  const forward = new Float32Array(960)
  transport.render(forward)
  assert.ok(Math.abs(transport.position - initial - .12 * 44100) < .001)
  assert.ok(forward.some(value => Math.abs(value) > .01))
  transport.move(-.12, .02)
  transport.render(new Float32Array(960))
  assert.ok(Math.abs(transport.position - initial) < .001)
  const stoppedPosition = transport.position
  const silence = new Float32Array(4096)
  transport.render(silence)
  assert.equal(transport.position, stoppedPosition)
  assert.ok(Math.abs(silence.at(-1)!) < .000001)
  transport.move(.08, .05)
  transport.render(new Float32Array(128))
  transport.stop()
  const releasedPosition = transport.position
  transport.render(new Float32Array(4096))
  assert.equal(transport.position, releasedPosition)
})

test('record cursor crosses either edge without random offsets or invalid output', () => {
  const transport = new ScratchTransport(48000)
  transport.load(Float32Array.from({ length: 100 }, (_, i) => Math.sin(i / 10)), 48000)
  for (const distance of [.1, -.2, .4, -.3]) {
    transport.move(distance, .01)
    const block = new Float32Array(480)
    transport.render(block)
    assert.ok(block.every(value => Number.isFinite(value)))
  }
  const target = transport.target
  transport.move(NaN, .02)
  assert.equal(transport.target, target)
})
