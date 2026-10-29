/** Convert a semantic range to discrete steps, including a shorter final step at max. */
export function sliderScale(min: number, max: number, step: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    throw new RangeError('Slider min must be less than max')
  }
  if (!Number.isFinite(step) || step <= 0) throw new RangeError('Slider step must be positive')
  const steps = Math.ceil((max - min) / step)
  if (!Number.isSafeInteger(steps) || steps > 2147483647) {
    throw new RangeError('Slider range contains too many steps')
  }
  return {
    steps,
    toNative(value: number) {
      if (!Number.isFinite(value)) throw new RangeError('Slider value must be finite')
      if (value >= max) return steps
      return Math.min(steps, Math.max(0, Math.round((value - min) / step)))
    },
    fromNative(value: number) {
      if (!Number.isFinite(value)) throw new RangeError('Slider value must be finite')
      const index = Math.min(steps, Math.max(0, Math.round(value)))
      if (index === steps) return max
      return Number((min + index * step).toPrecision(15))
    },
  }
}
