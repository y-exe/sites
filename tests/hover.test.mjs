import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import { test } from 'node:test'
import postcss from 'postcss'

test('hover styles require a fine pointer while keyboard focus stays available', async () => {
  for (const file of ['style.css', 'refinements.css']) {
    const root = postcss.parse(await readFile(new URL(`../assets/css/${file}`, import.meta.url), 'utf8'))
    root.walkRules(rule => {
      if (!rule.selector.includes(':hover')) return
      let parent = rule.parent
      while (parent && !(parent.type === 'atrule' && parent.name === 'media' && parent.params.includes('(hover: hover)') && parent.params.includes('(pointer: fine)'))) parent = parent.parent
      assert.ok(parent, `Unguarded hover: ${rule.selector}`)
    })
    const focusRules = []
    root.walkRules(rule => { if (rule.selector.includes(':focus-visible') && rule.parent === root) focusRules.push(rule) })
    assert.ok(focusRules.length > 0, 'Keyboard focus styles must remain outside hover-only media queries')
  }
})

test('touch and tap focus do not trigger hover motion; mouse and keyboard still do', async () => {
  const listeners = new Map(), updates = []
  let finePointer = true, keyboardFocus = false
  class PointerEvent { constructor(pointerType) { this.pointerType = pointerType; this.target = element } }
  const element = {
    isConnected: true, classList: { add() {} }, style: { setProperty() {} },
    closest() { return this }, hasAttribute() { return false }, contains() { return false },
    matches(selector) { return selector === ':focus-visible' ? keyboardFocus : selector.includes('.tech-pills') },
  }
  const source = await readFile(new URL('../plugins/interaction-motion.client.ts', import.meta.url), 'utf8')
  const code = stripTypeScriptTypes(source.replace(/^import .*\r?\n/, '').replace(/  if \(import\.meta\.hot\).*\r?\n/, ''))
  vm.runInNewContext(code.replace('export default', 'globalThis.plugin ='), {
    defineNuxtPlugin: setup => setup(), PointerEvent,
    matchMedia: () => ({ matches: finePointer }),
    springEasing: () => 'ease', createSpring: () => ({ to: value => updates.push(value), stop() {} }),
    MutationObserver: class { observe() {} disconnect() {} },
    document: { documentElement: { style: { setProperty() {} } }, body: {}, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener() {} },
  })
  listeners.get('pointerover')(new PointerEvent('touch'))
  listeners.get('focusin')({ target: element })
  finePointer = false
  listeners.get('pointerover')(new PointerEvent('mouse'))
  assert.equal(updates.length, 0)
  finePointer = true
  listeners.get('pointerover')(new PointerEvent('mouse'))
  assert.equal(updates.at(-1).hover, 1)
  listeners.get('pointerout')(new PointerEvent('mouse'))
  assert.equal(updates.at(-1).hover, 0)
  keyboardFocus = true
  listeners.get('focusin')({ target: element })
  assert.equal(updates.at(-1).hover, 1)
})
