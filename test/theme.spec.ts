import { describe, expect, it } from 'vitest'
import { defineTheme, mavis, midnight, resolveSpace } from '../packages/nativescript/src/index.js'

function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map((start) => {
      const value = parseInt(hex.slice(start, start + 2), 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722
  }
  const first = luminance(a),
    second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

describe('themes', () => {
  it('derives nested tokens without changing an existing theme', () => {
    const custom = defineTheme(
      { name: 'studio', colors: { primary: '#7C3AED' }, typography: { title: { fontSize: 36 } } },
      midnight,
    )
    expect(custom.colors.primary).toBe('#7C3AED')
    expect(custom.colors.background).toBe(midnight.colors.background)
    expect(custom.typography.title.fontWeight).toBe(midnight.typography.title.fontWeight)
    expect(midnight.typography.title.fontSize).toBe(32)
    expect(Object.isFrozen(custom.colors)).toBe(true)
  })

  it('resolves tokens and explicit device-independent sizes', () => {
    expect(resolveSpace(mavis, 'lg')).toBe(24)
    expect(resolveSpace(mavis, 13)).toBe(13)
    expect(() => resolveSpace(mavis, -1)).toThrow(RangeError)
    expect(() => resolveSpace(mavis, Number.NaN)).toThrow(RangeError)
    expect(() => defineTheme({ name: 'invalid', space: { lg: -1 } })).toThrow(RangeError)
  })

  for (const theme of [mavis, midnight]) {
    it(`${theme.name} keeps normal text, secondary text and button labels at 4.5:1 contrast`, () => {
      const c = theme.colors
      for (const background of [c.background, c.surface, c.elevated]) {
        expect(contrast(c.text, background)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(c.muted, background)).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5)
    })
  }
})
