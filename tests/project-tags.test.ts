import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getProjectTags, getProjectTagCounts } from '../utils/project-tags.ts'

test('projects are grouped by purpose across programming languages', () => {
  assert.ok(getProjectTags({ name: 'AniCome', language: 'Kotlin' }).includes('android'))
  assert.ok(getProjectTags({ name: 'DiscordWebAnalytics', language: 'TypeScript' }).includes('web'))
  assert.ok(getProjectTags({ name: 'DiscordWebAnalytics' }).includes('discord'))
  assert.ok(getProjectTags({ name: 'notice-selfbot' }).includes('notification'))
  assert.ok(getProjectTags({ name: 'games-bot' }).includes('game'))
  assert.ok(getProjectTags({ name: 'tokumei-bot' }).includes('discord'))
})

test('tag counts include each project once per tag and only available categories', () => {
  const projects = ['AniCome', 'sites', 'DiscordWebAnalytics', 'games-bot'].map(name => ({ name }))
  const counts = getProjectTagCounts(projects)
  assert.equal(counts.find(tag => tag.name === 'web')?.count, 2)
  assert.equal(counts.find(tag => tag.name === 'discord')?.count, 2)
  assert.equal(counts.find(tag => tag.name === 'android')?.count, 1)
  assert.equal(counts.some(tag => tag.name === 'selfbot'), false)
})

test('new projects get categories from metadata or fall back to tool', () => {
  assert.deepEqual(getProjectTags({ name: 'new', topics: ['discord', 'discord-py', 'nextjs'] }), ['web', 'discord'])
  assert.deepEqual(getProjectTags({ name: 'new', language: 'Vue' }), ['web'])
  assert.deepEqual(getProjectTags({ name: 'new', description: 'An Android app' }), ['android'])
  assert.deepEqual(getProjectTags({ name: '__proto__' }), ['tool'])
})
