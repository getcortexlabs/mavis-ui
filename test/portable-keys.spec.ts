import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
// @ts-expect-error The conformance generator uses native ESM helpers.
import { swiftKey } from '../scripts/portable-keys.mjs'

describe('Mac fixture keyboard generation', () => {
  it('emits plain menu typeahead without treating it as a named keyboard constant', () => {
    expect(swiftKey('e')).toEqual({ key: '"e"', modifiers: '[]', character: true })
    expect(swiftKey('Mod+d')).toEqual({ key: '"d"', modifiers: '.command', character: true })
    expect(swiftKey('Mod+Enter')).toEqual(swiftKey('Mod+Return'))
    expect(swiftKey('Shift+ArrowLeft')).toEqual({
      key: 'XCUIKeyboardKey.leftArrow',
      modifiers: '.shift',
      character: false,
    })
    expect(swiftKey('Mod+Shift+Tab').modifiers).toBe('[.command, .shift]')
  })
  it('reports the fixture and step for an unknown key instead of failing while destructuring', () => {
    expect(() => swiftKey('ArrowSideways', 'test/portable/menuKeys/steps.json step 7')).toThrow(
      /menuKeys\/steps.json step 7: unsupported Mac keyboard key "ArrowSideways"/,
    )
    expect(() => swiftKey('Super+e', 'fixture step 2')).toThrow(/fixture step 2/)
  })
  it('supports every press and adjustment in the current fixture corpus, including replay sources', () => {
    const directory = resolve(import.meta.dirname, 'portable')
    let count = 0
    const visit = (value: unknown, context: string) => {
      if (Array.isArray(value))
        return value.forEach((step, index) => visit(step, `${context} step ${index}`))
      if (!value || typeof value !== 'object') return
      const step = value as Record<string, unknown>
      if (step.press || step.adjust) {
        expect(() => swiftKey(step.press ?? step.key, context)).not.toThrow()
        count++
      }
      for (const [name, child] of Object.entries(step))
        if (name === 'steps' || name === 'native') visit(child, context)
    }
    for (const name of readdirSync(directory)) {
      const file = resolve(directory, name, 'steps.json')
      visit(JSON.parse(readFileSync(file, 'utf8')), file)
    }
    expect(count).toBeGreaterThan(90)
  })
})
