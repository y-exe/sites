import { isTerminalClient, terminalPageFor } from '../utils/terminal-page.ts'
import { isPortfolioPath } from '../utils/site-links.ts'
import { siteRouteResponse, projectWebsiteResponse } from '../utils/site-routing.ts'

interface Context {
  request: Request
  env: { GITHUB_TOKEN?: string; ASSETS: { fetch(request: Request): Promise<Response> } }
  next(): Promise<Response>
}

export const onRequest = async ({ request, env, next }: Context) => {
  const url = new URL(request.url)
  let response = siteRouteResponse(request) || await projectWebsiteResponse(request, env.GITHUB_TOKEN)
  if (!response) {
    if (url.pathname === '/' && isTerminalClient(request.headers.get('user-agent') || '')) {
      const terminal = terminalPageFor(request.headers.get('user-agent') || '')
      response = new Response(request.method === 'HEAD' ? null : terminal.body, { headers: {
        'Content-Type': terminal.contentType, 'Cache-Control': 'public, max-age=300', Vary: 'User-Agent',
        ...(terminal.downloadName ? { 'Content-Disposition': `attachment; filename="${terminal.downloadName}"` } : {}),
      } })
    } else if (url.pathname !== '/' && isPortfolioPath(url.pathname) && ['GET', 'HEAD'].includes(request.method)) {
      // /project/<name> shares a prefix with gallery assets. Fetch only the app shell;
      // /project/<name>/*.png and describe.txt must still reach the asset server.
      const shell = url.pathname === '/about' ? '/about/' : url.pathname === '/project' ? '/project/' : '/200'
      response = await env.ASSETS.fetch(new Request(new URL(shell, url), request))
    } else response = await next()
  }
  const headers = new Headers(response.headers)
  headers.set('X-Yexe-Mood', 'probably-coding')
  headers.set('X-Secret-Path', '/robots.txt')
  headers.set('X-Server-Flavor', 'rabbit-house/1.0')
  headers.set('X-Actually-Useful', 'debatable')
  if (url.protocol === 'https:' && url.hostname === 'yexe.net') {
    headers.set('Onion-Location', `http://yexenetrw3zrn2hqgrzm5qe24ww4ilh2df3ftm5d5rziu7nvm7iajgid.onion${url.pathname}${url.search}`)
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
