import { describe, expect, it } from 'vitest'
import {
  defineTheme,
  mavis,
  midnight,
  resolveSpace,
  badgeColors,
} from '../packages/nativescript/src/index.js'

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
    expect(midnight.typography.title.fontSize).toBe(34)
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
        // Slider thumb/track and focus indicators must be distinguishable on each surface.
        expect(contrast(c.primary, background)).toBeGreaterThanOrEqual(3)
      }
      for (const tone of [
        'neutral',
        'primary',
        'accent',
        'success',
        'warning',
        'danger',
      ] as const) {
        const badge = badgeColors(c, tone)
        expect(contrast(badge.color, badge.backgroundColor)).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrast(c.warning, c.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c.primary, c.primarySoft)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c.accent, c.accentSoft)).toBeGreaterThanOrEqual(4.5)
    })
  }
})

describe('typography and component tokens', () => {
  it('derives immutable nested defaults and platform font names', () => {
    const family = { web: 'Georgia, serif', ios: 'Georgia', android: 'serif' }
    const brand = defineTheme({
      name: 'brand',
      typography: { title: { fontFamily: family, lineHeight: 1.4 } },
      components: { input: { fontSize: 19 }, card: { elevation: 'md' } },
      elevation: { md: { blur: 18 } },
    })
    expect(brand.typography.title.fontFamily).toEqual(family)
    expect(Object.isFrozen(brand.typography.title.fontFamily)).toBe(true)
    expect(brand.components.input.paddingX).toBe(16)
    expect(brand.components.input.fontSize).toBe(19)
    expect(brand.elevation.md.blur).toBe(18)
    expect(mavis.elevation.md.blur).toBe(24)
    expect(mavis.components.input.fontSize).toBeUndefined()
    expect(Object.isFrozen(brand.components.card)).toBe(true)
  })
  it('rejects invalid typography, shadows and component geometry', () => {
    for (const options of [
      { typography: { body: { fontSize: 0 } } },
      { typography: { body: { lineHeight: 0.8 } } },
      { typography: { body: { letterSpacing: NaN } } },
      { typography: { body: { fontWeight: 'heavy' } } },
      { typography: { body: { fontFamily: '' } } },
      { elevation: { md: { blur: -1 } } },
      { components: { input: { paddingX: -1 } } },
      { components: { button: { elevation: 'huge' } } },
    ])
      expect(() => defineTheme({ name: 'invalid', ...options } as never)).toThrow()
  })
})
