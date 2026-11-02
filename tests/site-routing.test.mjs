import assert from 'node:assert/strict'
import { test } from 'node:test'
import { discordUserId, outboundPathFor, projectPath, sectionPath } from '../utils/site-links.ts'
import { siteRouteResponse, projectWebsiteResponse } from '../utils/site-routing.ts'
import { onRequest } from '../functions/_middleware.ts'

const request = path => new Request(`https://yexe.net${path}`)

test('contact and repository routes redirect only to configured destinations', () => {
  const cases = {
    '/github': 'https://github.com/y-exe',
    '/github/sites': 'https://github.com/y-exe/sites',
    '/github/sites/blob/main/nuxt.config.ts': 'https://github.com/y-exe/sites/blob/main/nuxt.config.ts',
    '/matrix': 'https://matrix.to/#/@yexe:matrix.org',
    '/discord': `https://discord.com/users/${discordUserId}`,
  }
  for (const [path, target] of Object.entries(cases)) {
    const response = siteRouteResponse(request(path))
    assert.equal(response.status, 302)
    assert.equal(response.headers.get('Location'), target)
  }
  assert.equal(siteRouteResponse(request('/github?url=https://evil.example')).headers.get('Location'), cases['/github'])
  assert.equal(siteRouteResponse(request('/constructor')), null)
  assert.equal(siteRouteResponse(request('/telegram')), null)
})

test('Discord ID is exactly the configured digits and is shared by the profile route', async () => {
  const response = siteRouteResponse(request('/discord/id'))
  assert.match(response.headers.get('Content-Type'), /^text\/plain/)
  assert.equal(await response.text(), discordUserId)
  assert.match(discordUserId, /^\d+$/)
  assert.equal(await siteRouteResponse(new Request('https://yexe.net/discord/id', { method: 'HEAD' })).text(), '')
})

test('legacy links and trailing slashes normalize to the new URLs', () => {
  for (const [before, after] of [
    ['/?project=sites', '/project/sites'],
    ['/?project=sites&source=share', '/project/sites?source=share'],
    ['/projects', '/project'], ['/project/', '/project'], ['/project/sites/', '/project/sites'], ['/about/', '/about'],
  ]) {
    const response = siteRouteResponse(request(before))
    assert.equal(response.status, 308)
    assert.equal(response.headers.get('Location'), after)
  }
})

test('portfolio URLs serve the app shell and gallery assets keep their own response', async () => {
  const fetched = []
  const pages = ['/project', '/project/sites', '/about']
  for (const path of [...pages, '/project/sites/1.png', '/project/sites/describe.txt', '/project/_payload.json']) {
    const response = await onRequest({ request: request(path), env: { ASSETS: { fetch: async req => { fetched.push(new URL(req.url).pathname); return new Response('shell') } } }, next: async () => new Response('asset') })
    assert.equal(await response.text(), pages.includes(path) ? 'shell' : 'asset')
    assert.ok(response.headers.get('Onion-Location').endsWith(path))
  }
  assert.deepEqual(fetched, ['/project/', '/200', '/about/'])
})

test('public project websites resolve from fixed-owner metadata', async () => {
  let called = ''
  const fetcher = async (url, options) => {
    called = url
    assert.equal(options.redirect, 'manual')
    assert.ok(options.signal)
    return Response.json({ private: false, homepage: 'https://example.com/site' })
  }
  const response = await projectWebsiteResponse(request('/project/sites/website'), 'private-token', fetcher)
  assert.equal(called, 'https://api.github.com/repos/y-exe/sites')
  assert.equal(response.headers.get('Location'), 'https://example.com/site')
  for (const data of [{ private: true, homepage: 'https://private.example' }, { private: false, homepage: '' }, { private: false, homepage: 'https://user:secret@example.com' }]) {
    assert.equal((await projectWebsiteResponse(request('/project/sites/website'), 'private-token', async () => Response.json(data))).status, 404)
  }
  assert.equal((await projectWebsiteResponse(request('/project/a%2Fb/website'), 'private-token', () => { throw new Error('must not fetch') })).status, 404)
})

test('link builders preserve repository paths and keep sharing relative to the current host', () => {
  assert.equal(projectPath('sites'), '/project/sites')
  assert.equal(new URL(projectPath('sites'), 'http://example.onion').href, 'http://example.onion/project/sites')
  assert.equal(sectionPath('#projects'), '/project')
  assert.equal(sectionPath('#about'), '/about')
  assert.equal(sectionPath('#top'), '/')
  assert.equal(outboundPathFor('https://github.com/y-exe/sites'), '/github/sites')
  assert.equal(outboundPathFor('https://github.com/y-exe/sites/blob/main/file.md'), '/github/sites/blob/main/file.md')
  assert.equal(outboundPathFor('https://github.com.evil.example/y-exe/sites'), 'https://github.com.evil.example/y-exe/sites')
})
