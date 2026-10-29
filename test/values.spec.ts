import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import {
  mavis,
  resolveDimension,
  resolveRadius,
  nonNegative,
  sliderScale,
} from '../packages/core/src/index.js'
import { textContent } from '../packages/core/src/vue/text-content.js'

describe('portable values', () => {
  it('does not invent an extra slider step from floating point rounding', () => {
    const scale = sliderScale(0, 0.14, 0.01)
    expect(scale.steps).toBe(14)
    expect(scale.fromNative(13)).toBe(0.13)
    expect(scale.fromNative(14)).toBe(0.14)
    expect(scale.toNative(0.14)).toBe(14)
  })
  it('snaps to the closest value in a shorter final interval', () => {
    const scale = sliderScale(0, 1, 0.3)
    expect(scale.toNative(0.94)).toBe(3)
    expect(scale.toNative(0.95)).toBe(4)
    expect(scale.toNative(0.96)).toBe(4)
    expect(sliderScale(0, 1, 2).toNative(0.8)).toBe(1)
    expect(sliderScale(-1, 0, 0.3).fromNative(3)).toBe(-0.1)
  })
  it('rejects invalid numeric input instead of passing it to a platform', () => {
    for (const value of [-1, Infinity, NaN]) {
      expect(() => nonNegative(value, 'grow')).toThrow(RangeError)
      expect(() => resolveRadius(mavis, value)).toThrow(RangeError)
      expect(() => resolveDimension(value)).toThrow(RangeError)
    }
    for (const [min, max, step] of [
      [0, 0, 1],
      [0, 1, 0],
      [0, Infinity, 1],
      [0, 1, Number.MIN_VALUE],
    ]) {
      expect(() => sliderScale(min!, max!, step!)).toThrow(RangeError)
    }
    expect(() => sliderScale(0, 1, 0.1).toNative(NaN)).toThrow(RangeError)
  })
  it('accepts the documented dimensions and rejects renderer-specific units', () => {
    expect(resolveDimension(0)).toBe(0)
    expect(resolveDimension('auto')).toBe('auto')
    expect(resolveDimension('50%')).toBe('50%')
    expect(resolveDimension(undefined)).toBeUndefined()
    expect(resolveRadius(mavis, 'lg')).toBe(mavis.radius.lg)
    // Simulates an untyped JavaScript consumer.
    expect(() => resolveDimension('2rem' as never)).toThrow(RangeError)
    expect(() => resolveDimension('-10%')).toThrow(RangeError)
    expect(() => resolveRadius(mavis, 'missing' as never)).toThrow(RangeError)
  })
  it('rejects rich child nodes in native-compatible text slots', () => {
    expect(() => textContent([h('strong', 'Hello')])).toThrow(/accept text/)
  })
})
