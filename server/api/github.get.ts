const repoNameIsValid = (repo: string | undefined) => Boolean(repo && /^[A-Za-z0-9_.-]+$/.test(repo))

export default defineEventHandler(async (event) => {
  const { resource, repo } = getQuery(event)
  const token = useRuntimeConfig(event).githubToken
  const repoName = typeof repo === 'string' ? repo : undefined
  const urls: Record<string, string | undefined> = {
    repos: 'https://api.github.com/users/y-exe/repos?sort=updated&per_page=9',
    profile: 'https://api.github.com/users/y-exe',
    events: 'https://api.github.com/users/y-exe/events/public?per_page=6',
    readme: repoNameIsValid(repoName) ? `https://api.github.com/repos/y-exe/${repoName}/readme` : undefined,
    'commit-activity': repoNameIsValid(repoName) ? `https://api.github.com/repos/y-exe/${repoName}/stats/commit_activity` : undefined
  }
  const upstreamUrl = typeof resource === 'string' ? urls[resource] : undefined
  if (!upstreamUrl) throw createError({ statusCode: 400, statusMessage: 'Unknown GitHub resource.' })
  if (!token) throw createError({ statusCode: 503, statusMessage: 'GITHUB_TOKEN is not configured.' })

  const response = await fetch(upstreamUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'yexe-net'
    }
  })
  if (!response.ok) throw createError({ statusCode: response.status, statusMessage: 'GitHub API request failed.' })
  return response.json()
})
