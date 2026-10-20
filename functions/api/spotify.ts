import { createSpotifyReader } from '../../server/utils/spotify'

interface Env {
  SPOTIFY_CLIENT_ID?: string
  SPOTIFY_CLIENT_SECRET?: string
  SPOTIFY_REFRESH_TOKEN?: string
}

const readSpotify = createSpotifyReader()

export const onRequestGet = async ({ env }: { env: Env }) => Response.json(await readSpotify({
  clientId: env.SPOTIFY_CLIENT_ID,
  clientSecret: env.SPOTIFY_CLIENT_SECRET,
  refreshToken: env.SPOTIFY_REFRESH_TOKEN,
}), { headers: { 'Cache-Control': 'no-store' } })
