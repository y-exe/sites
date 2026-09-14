interface Env {
  GITHUB_TOKEN?: string
}

const repoNameIsValid = (repo: string | null) => Boolean(repo && /^[A-Za-z0-9_.-]+$/.test(repo))

const upstreamFor = (resource: string, repo: string | null) => {
  if (resource === 'repos') return 'https://api.github.com/users/y-exe/repos?sort=updated&per_page=9'
  if (resource === 'profile') return 'https://api.github.com/users/y-exe'
  if (resource === 'events') return 'https://api.github.com/users/y-exe/events/public?per_page=6'
  if (resource === 'readme' && repoNameIsValid(repo)) return `https://api.github.com/repos/y-exe/${repo}/readme`
  if (resource === 'commit-activity' && repoNameIsValid(repo)) return `https://api.github.com/repos/y-exe/${repo}/stats/commit_activity`
  return null
}

const ttlFor = (resource: string) => ({
  profile: 900,
  events: 900,
  repos: 1800,
  'commit-activity': 21600,
  readme: 86400
}[resource] || 900)

export const onRequestGet = async (context: { request: Request; env: Env; waitUntil: (promise: Promise<unknown>) => void }) => {
  if (!context.env.GITHUB_TOKEN) {
    return Response.json({ message: 'GitHub API token is not configured.' }, { status: 503 })
  }

  const requestUrl = new URL(context.request.url)
  const resource = requestUrl.searchParams.get('resource') || ''
  const repo = requestUrl.searchParams.get('repo')
  const upstreamUrl = upstreamFor(resource, repo)
  if (!upstreamUrl) return Response.json({ message: 'Unknown GitHub resource.' }, { status: 400 })

  const cache = caches.default
  const cached = await cache.match(context.request)
  if (cached) return cached

  const upstream = await fetch(upstreamUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${context.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'yexe-net'
    }
  })

  if (!upstream.ok) {
    return Response.json({ message: 'GitHub API request failed.' }, { status: upstream.status })
  }

  const response = new Response(upstream.body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${ttlFor(resource)}`
    }
  })
  context.waitUntil(cache.put(context.request, response.clone()))
  return response
}
