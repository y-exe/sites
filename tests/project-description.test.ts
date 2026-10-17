import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { renderProjectDescription } from '../utils/project-description.ts'

test('project descriptions render the requested linked badge as an image', () => {
  const source = readFileSync(new URL('../public/project/notice-selfbot/describe.txt', import.meta.url), 'utf8')
  const html = renderProjectDescription(source)
  assert.match(html, /<br>/)
  assert.match(html, /<a href="https:\/\/xn--[^\"]+\.com" target="_blank" rel="noopener noreferrer"><img src="https:\/\/img\.shields\.io\//)
  assert.match(html, /alt="技術者倫理 厳守してない"/)
  assert.doesNotMatch(html, /\[!\[/)
})

test('GitHub-style formatting supports headings, tables, tasks, code, and strikethrough', () => {
  const html = renderProjectDescription('# 見出し\n\n**強調** ~~取消~~ `code`\n\n- [x] 完了\n- [ ] 未完了\n\n| 名前 | 値 |\n| --- | --- |\n| a | b |\n\n```js\nconst a = 1\n```')
  for (const tag of ['h1', 'strong', 's', 'code', 'table', 'pre']) assert.ok(html.includes(`<${tag}`))
  assert.match(html, /type="checkbox"/)
  assert.match(html, /disabled/)
})

test('HTML and executable links cannot run in Markdown descriptions', () => {
  const html = renderProjectDescription('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1))\n\n![bad](data:image/svg+xml;base64,AAAA)')
  assert.doesNotMatch(html, /<script|<img|href="javascript:/i)
  assert.match(html, /&lt;script&gt;/)
})

test('plain descriptions keep line breaks and ordinary URLs become new-tab links', () => {
  const html = renderProjectDescription('1行目\n2行目\nhttps://example.com')
  assert.match(html, /1行目<br>\n2行目<br>/)
  assert.match(html, /href="https:\/\/example.com" target="_blank" rel="noopener noreferrer"/)
})
