import { contactDestinations, discordUserId, isPortfolioPath, projectPath } from './site-links.ts'

const repoNameIsValid = (name: string) => name.length <= 100 && name !== '.' && name !== '..' && /^[A-Za-z0-9_.-]+$/.test(name)
const redirect = (request: Request, destination: string, status = 302) => new Response(null, {
  status, headers: { Location: destination, 'Cache-Control': status === 308 ? 'public, max-age=300' : 'no-store' },
})

export function siteRouteResponse(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, '') || '/'
  if (path === '/discord/id') return new Response(request.method === 'HEAD' ? null : discordUserId, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  })
  if (Object.hasOwn(contactDestinations, path)) return redirect(request, contactDestinations[path]!)
  if (path.startsWith('/github/')) {
    const suffix = path.slice('/github/'.length)
    const safe = suffix.split('/').every(part => {
      try {
        const decoded = decodeURIComponent(part)
        return decoded.length > 0 && decoded !== '.' && decoded !== '..' && !/[\\/\x00-\x1f\x7f]/.test(decoded)
      } catch { return false }
    })
    if (safe) {
      return redirect(request, `https://github.com/y-exe/${suffix}${url.search}${url.hash}`)
    }
  }
  if (path === '/' && url.searchParams.has('project')) {
    const name = url.searchParams.get('project') || ''
    if (repoNameIsValid(name)) {
      url.searchParams.delete('project')
      return redirect(request, `${projectPath(name)}${url.search}`, 308)
    }
  }
  if (path === '/projects') return redirect(request, `/project${url.search}`, 308)
  if (path !== '/' && isPortfolioPath(path) && url.pathname !== path) return redirect(request, `${path}${url.search}`, 308)
  return null
}

export async function projectWebsiteResponse(request: Request, token?: string, fetcher: typeof fetch = (input, options) => globalThis.fetch(input, options)): Promise<Response | null> {
  const match = new URL(request.url).pathname.match(/^\/project\/([^/]+)\/website\/?$/)
  if (!match || !['GET', 'HEAD'].includes(request.method)) return null
  const name = match[1]!
  if (!repoNameIsValid(name)) return new Response('Not found', { status: 404 })
  if (!token) return new Response('Project website temporarily unavailable', { status: 503 })
  try {
    const response = await fetcher(`https://api.github.com/repos/y-exe/${name}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'yexe-net', 'X-GitHub-Api-Version': '2022-11-28' },
      redirect: 'manual', signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return new Response('Not found', { status: 404 })
    const repo = await response.json()
    if (repo.private !== false || typeof repo.homepage !== 'string' || !repo.homepage.trim()) return new Response('Not found', { status: 404 })
    const target = new URL(/^https?:\/\//i.test(repo.homepage) ? repo.homepage : `https://${repo.homepage}`)
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) return new Response('Not found', { status: 404 })
    return redirect(request, target.href)
  } catch { return new Response('Project website temporarily unavailable', { status: 503 }) }
}
