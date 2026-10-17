import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getReadmeShields } from '../utils/project-shields.ts'

const repo = { owner: { login: 'y-exe' }, name: 'sites', default_branch: 'main' }

test('linked Markdown and HTML badges retain their targets and README order', () => {
  const badges = getReadmeShields(`
[![Twitter](https://img.shields.io/badge/Twitter(X)-blue)](https://x.com/y__exe)
<a href="https://example.com/?a=1&amp;b=2"><img src="https://img.shields.io/badge/build-passing-green" alt="Build"></a>
`, repo)
  assert.equal(badges.length, 2)
  assert.equal(badges[0].src, 'https://img.shields.io/badge/Twitter(X)-blue')
  assert.equal(badges[0].href, 'https://x.com/y__exe')
  assert.equal(badges[1].href, 'https://example.com/?a=1&b=2')
  assert.equal(badges[1].alt, 'Build')
})

test('reference badges, relative targets, and Shields link parameters work', () => {
  const badges = getReadmeShields(`
[![Docs][badge]][docs]
[badge]: https://img.shields.io/badge/docs-blue
[docs]: docs/guide.md
![Site](https://img.shields.io/badge/site-blue?link=https%3A%2F%2Fexample.com)
`, repo)
  assert.equal(badges[0].href, 'https://github.com/y-exe/sites/blob/main/docs/guide.md')
  assert.equal(badges[1].href, 'https://example.com/')
})

test('unlinked badges remain images and unsafe URLs are never navigation targets', () => {
  const badges = getReadmeShields(`
![Plain](https://img.shields.io/badge/plain-blue)
<a href="javascript:alert(1)"><img src="https://img.shields.io/badge/test-blue"></a>
![Fake](https://img.shields.io.evil.example/badge/test-blue)
`, repo)
  assert.equal(badges.length, 2)
  assert.equal(badges[0].href, undefined)
  assert.equal(badges[1].href, undefined)
})

test('at most four badges are displayed', () => {
  assert.equal(getReadmeShields(Array.from({ length: 6 }, (_, i) => `![${i}](https://img.shields.io/badge/${i}-blue)`).join('\n'), repo).length, 4)
})
