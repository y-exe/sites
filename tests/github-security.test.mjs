import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = await readFile(new URL('../server/api/github.get.ts', import.meta.url), 'utf8');
const code = stripTypeScriptTypes(source.replace('export default', 'globalThis.handler ='));
function handlerFor(query, fetch) {
  const context = vm.createContext({
    defineEventHandler: handler => handler,
    getQuery: () => query,
    useRuntimeConfig: () => ({ githubToken: 'test-token' }),
    createError: ({ statusCode }) => Object.assign(new Error('Request rejected'), { statusCode }),
    fetch, AbortSignal,
  });
  vm.runInContext(code, context);
  return context.handler;
}
test('invalid resources and path traversal never reach GitHub', async () => {
  for (const query of [{ resource: '__proto__' }, { resource: 'constructor' }, { resource: 'readme', repo: '..' }, { resource: 'readme', repo: 'a'.repeat(101) }]) {
    await assert.rejects(handlerFor(query, () => { throw new Error('Fetch should not run'); })({}), error => error.statusCode === 400);
  }
});
test('private repositories are rejected before reading content', async () => {
  const calls = [];
  const handler = handlerFor({ resource: 'readme', repo: 'private-project' }, async url => {
    calls.push(url);
    return { ok: true, json: async () => ({ private: true }) };
  });
  await assert.rejects(handler({}), error => error.statusCode === 404);
  assert.equal(calls.length, 1);
});
test('public repository reads have a deadline and reject redirects', async () => {
  const calls = [];
  const handler = handlerFor({ resource: 'readme', repo: 'public-project' }, async (url, options) => {
    calls.push(url);
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => url.endsWith('/readme') ? { content: 'readme' } : { private: false } };
  });
  assert.equal((await handler({})).content, 'readme');
  assert.equal(calls.length, 2);
});
