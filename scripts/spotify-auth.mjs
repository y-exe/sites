import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { loadEnvFile } from 'node:process'
import { readFile, writeFile } from 'node:fs/promises'

const envPath = new URL('../.env', import.meta.url)
try { loadEnvFile(envPath) } catch (error) { if (error.code !== 'ENOENT') throw error }
const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('.env に SPOTIFY_CLIENT_ID と SPOTIFY_CLIENT_SECRET を設定してください。')
  process.exit(1)
}

const redirectUri = 'http://127.0.0.1:8888/callback'
const state = randomBytes(32).toString('hex')
const authorize = new URL('https://accounts.spotify.com/authorize')
authorize.search = new URLSearchParams({
  client_id: clientId, response_type: 'code', redirect_uri: redirectUri,
  scope: 'user-read-currently-playing', state,
}).toString()
let exchanging = false
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  const url = new URL(request.url, redirectUri)
  if (url.pathname !== '/callback' || url.searchParams.get('state') !== state) {
    response.writeHead(400).end('無効な認証リクエストです。')
    return
  }
  const code = url.searchParams.get('code')
  if (!code || exchanging) {
    response.writeHead(400).end('認証がキャンセルされたか、処理中です。')
    return
  }
  exchanging = true
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
    })
    if (!tokenResponse.ok) throw new Error('Token exchange failed')
    const data = await tokenResponse.json()
    if (typeof data.refresh_token !== 'string' || !data.refresh_token) throw new Error('Missing refresh token')
    const existing = await readFile(envPath, 'utf8').catch(error => {
      if (error.code === 'ENOENT') return ''
      throw error
    })
    const line = `SPOTIFY_REFRESH_TOKEN=${JSON.stringify(data.refresh_token)}`
    const updated = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(existing)
      ? existing.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, () => line)
      : `${existing}${existing.endsWith('\n') || !existing ? '' : '\n'}${line}\n`
    await writeFile(envPath, updated, { mode: 0o600 })
    response.end('認証完了。.env にリフレッシュトークンを保存しました。このタブを閉じてください。')
    console.log('認証完了。SPOTIFY_REFRESH_TOKEN を .env に保存しました。')
  } catch {
    response.writeHead(500).end('認証に失敗しました。設定を確認してコマンドを再実行してください。')
    console.error('認証に失敗しました。Spotifyアプリの設定を確認してください。')
    process.exitCode = 1
  } finally {
    clearTimeout(deadline)
    server.close()
  }
})
const deadline = setTimeout(() => {
  console.error('認証がタイムアウトしました。コマンドを再実行してください。')
  server.close()
  process.exitCode = 1
}, 5 * 60_000)
server.on('error', () => {
  clearTimeout(deadline)
  console.error('認証サーバーを起動できませんでした。127.0.0.1:8888 が空いているか確認してください。')
  process.exitCode = 1
})
server.listen(8888, '127.0.0.1', () => {
  console.log(`Spotifyアプリに Redirect URI として ${redirectUri} を登録してから、次のURLを開いてください。\n${authorize}`)
})
