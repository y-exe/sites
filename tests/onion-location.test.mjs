import assert from 'node:assert/strict'
import { test } from 'node:test'
import { onRequest } from '../functions/_middleware.ts'

const invoke = (url, userAgent = 'Mozilla/5.0') => onRequest({
  request: new Request(url, { headers: { 'User-Agent': userAgent } }),
  env: { ASSETS: { fetch: async () => new Response('app shell') } },
  next: async () => new Response('website', { headers: { 'Content-Type': 'text/html', 'X-Existing': 'kept' } }),
})
const onion = 'http://yexenetrw3zrn2hqgrzm5qe24ww4ilh2df3ftm5d5rziu7nvm7iajgid.onion'

test('HTML advertises the matching onion path and query without changing the response', async () => {
  const response = await invoke('https://yexe.net/?source=share')
  assert.equal(response.headers.get('Onion-Location'), `${onion}/?source=share`)
  assert.equal(response.headers.get('X-Existing'), 'kept')
  assert.equal(await response.text(), 'website')
})

test('terminal responses advertise the same onion counterpart', async () => {
  const response = await invoke('https://yexe.net/', 'curl/8.0')
  assert.equal(response.headers.get('Onion-Location'), `${onion}/`)
  assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8')
  assert.ok((await response.text()).length > 0)
})

test('HTTP, development, preview and onion hosts do not advertise Onion-Location', async () => {
  for (const url of ['http://yexe.net/', 'http://localhost:3000/', 'https://preview.yexe.pages.dev/', `${onion}/`]) {
    assert.equal((await invoke(url)).headers.get('Onion-Location'), null)
  }
})
