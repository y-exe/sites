export interface ListeningActivity {
  name: string
  details: string
  state: string
  iconUrl: string
  timestamps?: { start?: number; end?: number }
}

export interface SpotifySnapshot {
  available: boolean
  activity: ListeningActivity | null
}

export function selectListeningActivity(discord: ListeningActivity | null, spotify: SpotifySnapshot | null, now: number): ListeningActivity | null {
  if (discord && discord.name !== 'Spotify') return discord
  const activity = spotify?.available ? spotify.activity : discord
  if (activity?.name === 'Spotify' && activity.timestamps?.end && activity.timestamps.end <= now) return null
  return activity
}
