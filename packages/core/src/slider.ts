/** Convert a semantic range to discrete steps, including a shorter final step at max. */
export function sliderScale(min: number, max: number, step: number) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    throw new RangeError('Slider min must be less than max')
  }
  if (!Number.isFinite(step) || step <= 0) throw new RangeError('Slider step must be positive')
  const count = (max - min) / step
  const rounded = Math.round(count)
  const tolerance = Number.EPSILON * Math.max(1, count) * 4
  const steps = Math.max(1, Math.abs(count - rounded) <= tolerance ? rounded : Math.ceil(count))
  if (!Number.isSafeInteger(steps) || steps > 2147483647) {
    throw new RangeError('Slider range contains too many steps')
  }
  return {
    steps,
    toNative(value: number) {
      if (!Number.isFinite(value)) throw new RangeError('Slider value must be finite')
      if (value >= max) return steps
      if (value <= min) return 0
      // The final interval may be shorter than step; compare its actual distance.
      const previous = min + (steps - 1) * step
      if (value >= previous + (max - previous) / 2) return steps
      return Math.min(steps - 1, Math.max(0, Math.round((value - min) / step)))
    },
    fromNative(value: number) {
      if (!Number.isFinite(value)) throw new RangeError('Slider value must be finite')
      const index = Math.min(steps, Math.max(0, Math.round(value)))
      if (index === steps) return max
      return Number((min + index * step).toPrecision(15))
    },
  }
}
