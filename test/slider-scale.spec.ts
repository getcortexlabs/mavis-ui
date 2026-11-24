import { expect, it } from 'vitest'
import { sliderScale } from '../packages/core/src/slider'

it('steps like sliderScale in the core, with a shorter last step', () => {
  const scale = sliderScale(0, 10, 3)
  expect(scale.steps).toBe(4)
  expect([0, 1, 2, 3, 4].map((index) => scale.fromNative(index))).toEqual([0, 3, 6, 9, 10])
  expect([9.4, 9.5, 10].map((value) => scale.toNative(value))).toEqual([3, 4, 4])
  expect(sliderScale(0, 1, 0.1).fromNative(3)).toBe(0.3)
})
