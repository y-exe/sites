import { isTerminalClient, terminalPageFor } from '../utils/terminal-page.ts'
import { isPortfolioPath } from '../utils/site-links.ts'
import { siteRouteResponse, projectWebsiteResponse } from '../utils/site-routing.ts'

interface Context {
  request: Request
  env: { GITHUB_TOKEN?: string; ASSETS: { fetch(request: Request): Promise<Response> } }
  next(): Promise<Response>
}

// CSP allows only the third parties the site actually loads. 'unsafe-inline' on
// script-src covers the head theme script; styles need it for Vue's style attrs.
const securityHeaders: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://cdn.discordapp.com https://media.discordapp.net https://img.shields.io https://raw.githubusercontent.com https://opengraph.githubassets.com https://avatars.githubusercontent.com https://www.google.com https://www.google-analytics.com https://i.scdn.co https://count.yexe.xyz",
    "connect-src 'self' https://api.github.com https://api.lanyard.rest wss://api.lanyard.rest https://www.google-analytics.com https://region1.google-analytics.com https://count.yexe.xyz",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests'
  ].join('; ')
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
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value)
  headers.set('X-Yexe-Mood', 'probably-coding')
  headers.set('X-Secret-Path', '/robots.txt')
  headers.set('X-Server-Flavor', 'rabbit-house/1.0')
  headers.set('X-Actually-Useful', 'debatable')
  if (url.protocol === 'https:' && url.hostname === 'yexe.net') {
    headers.set('Onion-Location', `http://yexenetrw3zrn2hqgrzm5qe24ww4ilh2df3ftm5d5rziu7nvm7iajgid.onion${url.pathname}${url.search}`)
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
