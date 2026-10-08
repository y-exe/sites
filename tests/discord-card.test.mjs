import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { compile } from '@vue/compiler-dom'
import * as Vue from 'vue'
import { renderToString } from '@vue/server-renderer'

test('Discord custom emoji names render as text rather than HTML', async () => {
  const source = await readFile(new URL('../components/HeroSection.vue', import.meta.url), 'utf8')
  const template = source.match(/<span v-if="customStatus.emojiUrl \|\| customStatus.emoji"[\s\S]*?<\/span>\s*<\/span>/)?.[0]
  assert.ok(template)
  const render = new Function('Vue', compile(template, { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  const html = await renderToString(Vue.createSSRApp({
    setup: () => ({ customStatus: { emojiUrl: '', emoji: '<img src=x onerror=alert(1)>' } }), render,
  }))
  assert.ok(!html.includes('<img'))
  assert.ok(html.includes('&lt;img'))
})

test('Discord media and nameplate updates preserve the entrance visibility class', async () => {
  const source = await readFile(new URL('../components/HeroSection.vue', import.meta.url), 'utf8')
  const opening = source.match(/<a :href="discordProfileUrl"[^>]*>/)?.[0]
  assert.ok(opening)
  const render = new Function('Vue', compile(`${opening}</a>`, { mode: 'function', prefixIdentifiers: true }).code)(Vue)
  const makeNode = () => ({ props: {}, children: [], parent: null, classes: new Set() })
  const renderer = Vue.createRenderer({
    createElement: makeNode, createText: makeNode, createComment: makeNode,
    setText() {}, setElementText() {}, remove() {},
    parentNode: node => node.parent, nextSibling: () => null,
    insert(node, parent) { node.parent = parent; parent.children.push(node) },
    patchProp(node, key, previous, value) {
      node.props[key] = value
      if (key === 'class') node.classes = new Set((value || '').split(' '))
    },
  })
  const nameplateBaseUrl = Vue.ref('')
  const discordMediaPlaying = Vue.ref(true)
  const app = renderer.createApp({
    setup: () => ({ discordProfileUrl: 'https://discord.com/users/483307286513582090',
      discordNameplateStyle: {}, nameplateBaseUrl, discordMediaPlaying, setDiscordContact() {} }),
    render,
  })
  app.directive('reveal', { mounted: node => node.classes.add('is-visible') })
  const root = makeNode()
  app.mount(root)
  const card = root.children[0]
  assert.ok(card.classes.has('is-visible'))
  nameplateBaseUrl.value = 'https://cdn.discordapp.com/assets/collectibles/nameplate/'
  await Vue.nextTick()
  assert.ok(card.classes.has('is-visible'))
  assert.equal(card.props['data-has-nameplate'], '')
  for (const playing of [false, true, false, true]) {
    discordMediaPlaying.value = playing
    await Vue.nextTick()
    assert.ok(card.classes.has('is-visible'))
    assert.equal(card.props['data-media-paused'], playing ? undefined : '')
  }
  nameplateBaseUrl.value = ''
  await Vue.nextTick()
  assert.ok(card.classes.has('is-visible'))
  app.unmount()
})
