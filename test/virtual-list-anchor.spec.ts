import { describe, expect, it } from 'vitest'
import { virtualAnchor, virtualKeys } from '../packages/core/src/collections.js'

const keys = Array.from({ length: 200 }, (_, id) => id)
describe('fixed-row key anchoring', () => {
  it('keeps identity and intra-row offset across inserts, sorts and filtering', () => {
    const offset = 50 * 56 + 17
    expect(virtualAnchor(keys, [-1, ...keys], 56, 224, offset)).toBe(51 * 56 + 17)
    expect(virtualAnchor(keys, [...keys].reverse(), 56, 224, offset)).toBe(149 * 56 + 17)
    expect(
      virtualAnchor(
        keys,
        keys.filter((id) => id % 2 === 0),
        56,
        224,
        offset,
      ),
    ).toBe(25 * 56 + 17)
  })
  it('uses the nearest surviving index when the anchor is deleted, then clamps to the viewport', () => {
    expect(
      virtualAnchor(
        keys,
        keys.filter((id) => id !== 50),
        56,
        224,
        50 * 56 + 17,
      ),
    ).toBe(50 * 56 + 17)
    expect(virtualAnchor(keys, [199, 198], 56, 224, 50 * 56 + 17)).toBe(0)
    expect(virtualAnchor(keys, [], 56, 224, 50 * 56 + 17)).toBe(0)
  })
  it('keeps numeric and textual identities distinct and validates before any commit', () => {
    const before = [1, '1', 2, 3, 4, 5]
    expect(virtualAnchor(before, ['1', 1, 2, 3, 4, 5], 56, 56, 56 + 9)).toBe(9)
    expect(() => virtualKeys([{ id: 1 }, { id: 1 }], 'id')).toThrow(/unique/)
    expect(() => virtualAnchor(keys, keys, 0, 224, 0)).toThrow(/dimensions/)
  })
})
