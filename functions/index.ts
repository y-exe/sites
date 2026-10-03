import { isTerminalClient, terminalPageFor } from '../utils/terminal-page'

const playfulHeaders = {
  'X-Yexe-Mood': 'probably-coding',
  'X-Secret-Path': '/robots.txt',
  'X-Server-Flavor': 'rabbit-house/1.0',
  'X-Actually-Useful': 'debatable'
}

export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const userAgent = request.headers.get('user-agent') || ''
  const path = new URL(request.url).pathname

  if (path === '/' && isTerminalClient(userAgent)) {
    const terminal = terminalPageFor(userAgent)
    return new Response(terminal.body, {
      headers: {
        'Content-Type': terminal.contentType,
        'Cache-Control': 'public, max-age=300',
        'Vary': 'User-Agent',
        ...(terminal.downloadName ? { 'Content-Disposition': `attachment; filename="${terminal.downloadName}"` } : {}),
        ...playfulHeaders
      }
    })
  }

  const response = await next()
  const headers = new Headers(response.headers)
  Object.entries(playfulHeaders).forEach(([name, value]) => headers.set(name, value))
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
