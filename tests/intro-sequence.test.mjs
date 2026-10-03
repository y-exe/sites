import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'

test('intro elements wait for the loading sequence even before their template refs register', async () => {
  const source = await readFile(new URL('../plugins/directives.client.ts', import.meta.url), 'utf8')
  const code = stripTypeScriptTypes(`
    export const state = { introElements: { value: [] }, isHeaderIntroDone: { value: false } };
    export const observed = [];
    const observer = { observe: element => observed.push(element), unobserve() {} };
    const useIntro = () => state;
    const useSharedObserver = () => ({ getObservers: () => ({ revealObserver: observer, textObserver: observer }) });
    ${source.replace(/^import .*\r?\n/gm, '').replace('defineNuxtPlugin(', '(')}
  `)
  const { default: setup, state, observed } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  const directives = new Map()
  setup({ vueApp: { directive: (name, directive) => directives.set(name, directive) } })
  const element = intro => {
    const classes = new Set(intro ? ['intro-sequence'] : [])
    return { dataset: {}, classList: { contains: value => classes.has(value), add: value => classes.add(value) } }
  }
  const reveal = element(true)
  const text = element(true)
  directives.get('reveal').mounted(reveal, {})
  directives.get('split-text').mounted(text)
  assert.equal(observed.length, 0)
  assert.equal(reveal.classList.contains('is-visible'), false)
  assert.equal(text.classList.contains('is-visible'), false)
  assert.equal(text.classList.contains('is-ready'), true)
  const normal = element(false)
  directives.get('reveal').mounted(normal, {})
  assert.deepEqual(observed, [normal])
  state.isHeaderIntroDone.value = true
  const late = element(true)
  directives.get('reveal').mounted(late, {})
  assert.equal(late.classList.contains('is-visible'), true)
})
