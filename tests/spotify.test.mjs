import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSpotifyReader } from '../server/utils/spotify.ts'
import { selectListeningActivity } from '../utils/listening-activity.ts'

const credentials = { clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh' }
const token = () => Response.json({ access_token: 'access', expires_in: 3600 })
const track = (changes = {}) => ({
  is_playing: true, currently_playing_type: 'track', progress_ms: 10_000,
  // Spotify timestamp denotes the last state change, not the progress observation.
  timestamp: 1,
  item: { type: 'track', name: '曲', duration_ms: 200_000, artists: [{ name: 'A' }, { name: 'B' }], album: { images: [{ url: 'https://i.scdn.co/image/art' }] } },
  ...changes,
})

test('missing credentials make no requests', async () => {
  const read = createSpotifyReader(() => { throw new Error('Unexpected fetch') })
  assert.deepEqual(await read({}), { available: false, activity: null })
})

test('playback is sanitized, timed at observation, deduplicated and cached', async () => {
  let time = 100_000
  const calls = []
  const read = createSpotifyReader(async (url, options) => {
    calls.push({ url, options })
    return url.includes('/api/token') ? token() : Response.json(track())
  }, () => time)
  const results = await Promise.all([read(credentials), read(credentials), read(credentials)])
  assert.equal(calls.length, 2)
  assert.deepEqual(results[0], { available: true, activity: {
    name: 'Spotify', details: '曲', state: 'A, B', iconUrl: 'https://i.scdn.co/image/art',
    timestamps: { start: 90_000, end: 290_000 },
  } })
  assert.equal(calls[0].options.body.get('grant_type'), 'refresh_token')
  assert.equal(calls[0].options.body.get('refresh_token'), 'refresh')
  assert.equal(calls[1].options.headers.Authorization, 'Bearer access')
  assert.ok(calls.every(call => call.options.signal instanceof AbortSignal && call.options.redirect === 'error'))
  await read(credentials)
  assert.equal(calls.length, 2)
  time += 11_000
  await read(credentials)
  assert.equal(calls.length, 3)
})

test('paused, absent, ad and episode playback clear old songs', async () => {
  for (const playback of [null, track({ is_playing: false }), track({ item: null }), track({ currently_playing_type: 'ad' }), track({ currently_playing_type: 'episode' })]) {
    const read = createSpotifyReader(async url => url.includes('/api/token') ? token() : playback ? Response.json(playback) : new Response(null, { status: 204 }))
    assert.deepEqual(await read(credentials), { available: true, activity: null })
  }
})

test('401 refreshes token once and retries playback', async () => {
  let tokens = 0
  let plays = 0
  const read = createSpotifyReader(async url => {
    if (url.includes('/api/token')) { tokens++; return token() }
    return ++plays === 1 ? new Response(null, { status: 401 }) : Response.json(track())
  })
  assert.equal((await read(credentials)).available, true)
  assert.equal(tokens, 2)
  assert.equal(plays, 2)
})

test('token expiry uses rotated refresh token', async () => {
  let time = 1_000
  const refreshes = []
  const read = createSpotifyReader(async (url, options) => {
    if (!url.includes('/api/token')) return Response.json(track())
    refreshes.push(options.body.get('refresh_token'))
    return Response.json({ access_token: 'access', expires_in: 120, refresh_token: 'rotated' })
  }, () => time)
  await read(credentials)
  time += 61_000
  await read(credentials)
  assert.deepEqual(refreshes, ['refresh', 'rotated'])
})

test('rate limits honor Retry-After and return fallback without secrets', async () => {
  let time = 1_000
  let plays = 0
  const read = createSpotifyReader(async url => {
    if (url.includes('/api/token')) return token()
    plays++
    return new Response('sensitive upstream message', { status: 429, headers: { 'Retry-After': '120' } })
  }, () => time)
  assert.deepEqual(await read(credentials), { available: false, activity: null })
  time += 60_000
  await read(credentials)
  assert.equal(plays, 1)
  time += 61_000
  await read(credentials)
  assert.equal(plays, 2)
})

test('network, token and malformed JSON failures fall back', async () => {
  for (const fetcher of [
    async () => { throw new Error('secret error') },
    async () => new Response('secret error', { status: 400 }),
    async () => Response.json({}),
    async url => url.includes('/api/token') ? token() : new Response('{'),
    async url => url.includes('/api/token') ? token() : Response.json({}),
  ]) {
    assert.deepEqual(await createSpotifyReader(fetcher)(credentials), { available: false, activity: null })
  }
})

test('API overrides Lanyard songs, stops stale songs, and preserves games', () => {
  const discord = { name: 'Spotify', details: 'old', state: '', iconUrl: '', timestamps: { start: 1, end: 2000 } }
  const api = { ...discord, details: 'new' }
  const game = { ...discord, name: 'Game' }
  assert.equal(selectListeningActivity(discord, { available: true, activity: api }, 1000), api)
  assert.equal(selectListeningActivity(null, { available: true, activity: api }, 1000), api)
  assert.equal(selectListeningActivity(discord, { available: true, activity: null }, 1000), null)
  assert.equal(selectListeningActivity(discord, { available: false, activity: null }, 1000), discord)
  assert.equal(selectListeningActivity(discord, null, 1000), discord)
  assert.equal(selectListeningActivity(discord, null, 2000), null)
  assert.equal(selectListeningActivity(null, { available: true, activity: api }, 2000), null)
  assert.equal(selectListeningActivity(game, { available: true, activity: api }, 1000), game)
})
