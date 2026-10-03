import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchesProjectSearch } from '../utils/project-search.ts'

const project = { name: 'games-bot', description: 'いろんなゲームを入れたBot', language: 'Python', topics: ['discord'] }
test('search combines words across name, language, description and topics', () => {
  assert.equal(matchesProjectSearch(project, 'bot python'), true)
  assert.equal(matchesProjectSearch(project, 'discord ゲーム'), true)
  assert.equal(matchesProjectSearch(project, 'bot typescript'), false)
})
test('search accepts fullwidth input, mixed casing and extra whitespace', () => {
  assert.equal(matchesProjectSearch(project, ' ＢＯＴ　Ｐｙｔｈｏｎ '), true)
  assert.equal(matchesProjectSearch(project, 'Python\n\tDiscord'), true)
  assert.equal(matchesProjectSearch(project, '　 '), true)
})
test('projects without descriptions or languages remain searchable', () => {
  assert.equal(matchesProjectSearch({ name: 'sites', description: null, language: null }, 'sites'), true)
  assert.equal(matchesProjectSearch({ name: 'sites' }, 'python'), false)
})
