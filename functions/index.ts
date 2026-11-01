import { isTerminalClient, terminalPageFor } from '../utils/terminal-page'

const playfulHeaders = {
  'X-Yexe-Mood': 'probably-coding',
  'X-Secret-Path': '/robots.txt',
  'X-Server-Flavor': 'rabbit-house/1.0',
  'X-Actually-Useful': 'debatable'
}

export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const userAgent = request.headers.get('user-agent') || ''
  const requestUrl = new URL(request.url)
  const path = requestUrl.pathname
  const onionHeaders = requestUrl.protocol === 'https:' && requestUrl.hostname === 'yexe.net'
    ? { 'Onion-Location': `http://yexenetrw3zrn2hqgrzm5qe24ww4ilh2df3ftm5d5rziu7nvm7iajgid.onion${path}${requestUrl.search}` }
    : {}

  if (path === '/' && isTerminalClient(userAgent)) {
    const terminal = terminalPageFor(userAgent)
    return new Response(terminal.body, {
      headers: {
        'Content-Type': terminal.contentType,
        'Cache-Control': 'public, max-age=300',
        'Vary': 'User-Agent',
        ...(terminal.downloadName ? { 'Content-Disposition': `attachment; filename="${terminal.downloadName}"` } : {}),
        ...playfulHeaders,
        ...onionHeaders
      }
    })
  }

  const response = await next()
  const headers = new Headers(response.headers)
  Object.entries(playfulHeaders).forEach(([name, value]) => headers.set(name, value))
  Object.entries(onionHeaders).forEach(([name, value]) => headers.set(name, value))
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
