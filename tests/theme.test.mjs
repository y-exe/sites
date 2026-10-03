import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'

test('initial theme respects saved choice and system preference even when storage is unavailable', async () => {
  const config = await readFile(new URL('../nuxt.config.ts', import.meta.url), 'utf8')
  const script = config.match(/script: \[\{ innerHTML: `([^`]+)`/)?.[1]
  assert.ok(script)
  for (const [stored, system, denied, expected] of [
    ['dark', false, false, true], ['light', true, false, false],
    [null, true, false, true], [null, false, false, false],
    [null, true, true, true], [null, false, true, false],
    ['invalid', true, false, true]
  ]) {
    let dark
    const meta = { content: '#ffffff' }
    const root = { style: {}, classList: { toggle(name, enabled) { dark = enabled } } }
    runInNewContext(script, {
      localStorage: { getItem() { if (denied) throw new Error('Unavailable'); return stored } },
      matchMedia: () => ({ matches: system }),
      document: { documentElement: root, querySelector: () => meta }
    })
    assert.equal(dark, expected)
    assert.equal(root.style.colorScheme, expected ? 'dark' : 'light')
    assert.equal(meta.content, expected ? '#121212' : '#ffffff')
  }
})
