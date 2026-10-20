import { createSpotifyReader } from '../utils/spotify'

const readSpotify = createSpotifyReader()

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig(event)
  return readSpotify({
    clientId: config.spotifyClientId,
    clientSecret: config.spotifyClientSecret,
    refreshToken: config.spotifyRefreshToken,
  })
})
