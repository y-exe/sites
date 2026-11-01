import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import { test } from 'node:test'

const source = await readFile(new URL('../functions/index.ts', import.meta.url), 'utf8')
const context = vm.createContext({
  URL, Headers, Response,
  isTerminalClient: value => value.startsWith('curl/'),
  terminalPageFor: () => ({ body: 'terminal profile', contentType: 'text/plain' }),
})
vm.runInContext(stripTypeScriptTypes(source.replace(/^import .*\r?\n/m, '').replace('export const onRequest', 'globalThis.onRequest')), context)
const invoke = (url, userAgent = 'Mozilla/5.0') => context.onRequest({
  request: new Request(url, { headers: { 'User-Agent': userAgent } }),
  next: async () => new Response('website', { headers: { 'Content-Type': 'text/html', 'X-Existing': 'kept' } }),
})
const onion = 'http://yexenetrw3zrn2hqgrzm5qe24ww4ilh2df3ftm5d5rziu7nvm7iajgid.onion'

test('HTML advertises the matching onion path and query without changing the response', async () => {
  const response = await invoke('https://yexe.net/?project=sites')
  assert.equal(response.headers.get('Onion-Location'), `${onion}/?project=sites`)
  assert.equal(response.headers.get('X-Existing'), 'kept')
  assert.equal(await response.text(), 'website')
})

test('terminal responses advertise the same onion counterpart', async () => {
  const response = await invoke('https://yexe.net/', 'curl/8.0')
  assert.equal(response.headers.get('Onion-Location'), `${onion}/`)
  assert.equal(response.headers.get('Content-Type'), 'text/plain')
  assert.equal(await response.text(), 'terminal profile')
})

test('HTTP, development, preview and onion hosts do not advertise Onion-Location', async () => {
  for (const url of ['http://yexe.net/', 'http://localhost:3000/', 'https://preview.yexe.pages.dev/', `${onion}/`]) {
    assert.equal((await invoke(url)).headers.get('Onion-Location'), null)
  }
})
