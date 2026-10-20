import type { SpotifySnapshot } from '../../utils/listening-activity.ts'

export interface SpotifyCredentials {
  clientId?: string
  clientSecret?: string
  refreshToken?: string
}

// One instance per server/isolate: deduplicate requests and share tokens across visitors.
export function createSpotifyReader(fetcher: typeof fetch = fetch, now = Date.now) {
  let token = ''
  let tokenExpires = 0
  let refreshToken = ''
  let credentialKey = ''
  let cached: SpotifySnapshot = { available: false, activity: null }
  let nextRead = 0
  let pending: Promise<SpotifySnapshot> | null = null

  return async function readSpotify(credentials: SpotifyCredentials): Promise<SpotifySnapshot> {
    const { clientId, clientSecret } = credentials
    if (!clientId || !clientSecret || !credentials.refreshToken) return { available: false, activity: null }
    const key = JSON.stringify(credentials)
    if (key !== credentialKey) {
      credentialKey = key
      token = ''
      tokenExpires = 0
      refreshToken = credentials.refreshToken
      nextRead = 0
    }
    if (pending) return pending
    if (now() < nextRead) return cached

    const request = async (url: string, options: RequestInit) => {
      const response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(8000) })
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'))
        nextRead = now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000
      }
      return response
    }
    const getToken = async () => {
      const response = await request('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      })
      if (!response.ok) throw new Error('Spotify authorization unavailable')
      const data = await response.json()
      if (typeof data.access_token !== 'string' || !(data.expires_in > 0)) throw new Error('Invalid Spotify token')
      token = data.access_token
      tokenExpires = now() + Math.max(0, data.expires_in - 60) * 1000
      if (typeof data.refresh_token === 'string') refreshToken = data.refresh_token
    }
    pending = (async () => {
      try {
        if (!token || now() >= tokenExpires) await getToken()
        const getPlayback = () => request('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: { Authorization: `Bearer ${token}` },
        })
        let response = await getPlayback()
        if (response.status === 401) {
          token = ''
          await getToken()
          response = await getPlayback()
        }
        if (!response.ok) throw new Error('Spotify playback unavailable')
        const data = response.status === 204 ? null : await response.json()
        if (data !== null && typeof data.is_playing !== 'boolean') throw new Error('Invalid Spotify playback')
        cached = { available: true, activity: null }
        const item = data?.item
        if (data?.is_playing && data.currently_playing_type === 'track' && item?.type === 'track'
          && typeof item.name === 'string' && Number.isFinite(item.duration_ms) && item.duration_ms > 0
          && Number.isFinite(data.progress_ms)) {
          const start = now() - Math.min(item.duration_ms, Math.max(0, data.progress_ms))
          cached.activity = {
            name: 'Spotify', details: item.name,
            state: Array.isArray(item.artists) ? item.artists.map((artist: { name: string }) => artist.name).join(', ') : '',
            iconUrl: item.album?.images?.[0]?.url || '',
            timestamps: { start, end: start + item.duration_ms },
          }
        }
        nextRead = now() + 10_000
      } catch {
        // Never expose OAuth responses, tokens, or stale playback after an error.
        cached = { available: false, activity: null }
        nextRead = Math.max(nextRead, now() + 30_000)
      }
      return cached
    })()
    try { return await pending } finally { pending = null }
  }
}
