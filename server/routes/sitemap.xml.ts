const SITE = 'https://yexe.net'
const repoNameIsValid = (repo: string | undefined) => Boolean(repo && /^[A-Za-z0-9_.-]+$/.test(repo))

interface SitemapEntry {
  loc: string
  changefreq: string
  priority: string
  lastmod?: string
}

// Prerendered at build time (nitro.prerender.routes). Falls back to the fixed
// routes alone when GITHUB_TOKEN is unavailable, so the build never fails.
export default defineEventHandler(async (event) => {
  const token = useRuntimeConfig(event).githubToken
  const entries: SitemapEntry[] = [
    { loc: `${SITE}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE}/project/`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE}/about/`, changefreq: 'monthly', priority: '0.7' }
  ]

  if (token) {
    try {
      const response = await fetch('https://api.github.com/users/y-exe/repos?sort=pushed&per_page=9', {
        signal: AbortSignal.timeout(10_000),
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'yexe-net'
        }
      })
      if (response.ok) {
        const repos = (await response.json()) as Array<{ name: string; fork: boolean; private: boolean; pushed_at: string }>
        for (const repo of repos) {
          if (repo.fork || repo.private || !repoNameIsValid(repo.name)) continue
          entries.push({
            loc: `${SITE}/project/${repo.name}/`,
            changefreq: 'monthly',
            priority: '0.6',
            lastmod: repo.pushed_at.slice(0, 10)
          })
        }
      }
    } catch { /* Fixed routes alone are still a valid sitemap. */ }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(entry => `  <url><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`).join('\n')}\n</urlset>\n`
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return xml
})
