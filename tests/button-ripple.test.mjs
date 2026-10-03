import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'

test('ripples follow actual keyboard activation and cancel when touch becomes scrolling', async t => {
  const originals = Object.fromEntries(['document', 'matchMedia', 'getComputedStyle', 'PointerEvent', 'KeyboardEvent'].map(key => [key, globalThis[key]]))
  const listeners = new Map()
  const animations = []
  const element = (tag = 'span') => ({
    tagName: tag.toUpperCase(), children: [], style: {}, classList: { add() {} }, disabled: false,
    closest(selector) { return selector.startsWith('.nuxt-devtools') ? null : this },
    matches(selector) { return selector.startsWith('a[href]') ? this.tagName === 'A' : this.disabled },
    getBoundingClientRect() { return { left: 10, top: 10, width: 60, height: 36 } },
    setAttribute() {},
    append(child) { child.parent = this; this.children.push(child) },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this) },
    animate() { const animation = { cancel() { this.oncancel?.() } }; animations.push(animation); return animation }
  })
  globalThis.document = { createElement: () => element(), addEventListener: (name, fn) => listeners.set(name, fn) }
  globalThis.matchMedia = () => ({ matches: false })
  globalThis.getComputedStyle = () => ({ position: 'relative' })
  globalThis.PointerEvent = class { constructor(values) { Object.assign(this, { button: 0, isPrimary: true, pointerId: 7, clientX: 30, clientY: 20 }, values) } }
  globalThis.KeyboardEvent = class { constructor(values) { Object.assign(this, { repeat: false }, values) } }
  t.after(() => Object.assign(globalThis, originals))
  const source = await readFile(new URL('../plugins/button-ripple.client.ts', import.meta.url), 'utf8')
  const code = stripTypeScriptTypes(source.replace('export default defineNuxtPlugin(', 'export default ('))
  const { default: setup } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  setup()
  const anchor = element('a')
  const button = element('button')
  const key = (target, value) => listeners.get('keydown')(new KeyboardEvent({ target, key: value }))
  key(anchor, ' ')
  assert.equal(animations.length, 0)
  key(anchor, 'Enter')
  assert.equal(anchor.children.length, 1)
  listeners.get('pointercancel')(new PointerEvent({ pointerId: 7 }))
  assert.equal(anchor.children.length, 1)
  animations.at(-1).onfinish()
  assert.equal(anchor.children.length, 0)
  key(button, ' ')
  assert.equal(button.children.length, 1)
  animations.at(-1).onfinish()
  const beforeIgnored = animations.length
  listeners.get('pointerdown')(new PointerEvent({ target: button, isPrimary: false }))
  listeners.get('pointerdown')(new PointerEvent({ target: button, button: 2 }))
  button.disabled = true
  listeners.get('pointerdown')(new PointerEvent({ target: button }))
  assert.equal(animations.length, beforeIgnored)
  button.disabled = false
  listeners.get('pointerdown')(new PointerEvent({ target: button }))
  assert.equal(button.children.length, 1)
  listeners.get('pointercancel')(new PointerEvent({ pointerId: 8 }))
  assert.equal(button.children.length, 1)
  listeners.get('pointercancel')(new PointerEvent({ pointerId: 7 }))
  assert.equal(button.children.length, 0)
})
