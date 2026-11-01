export const progressSizes = { sm: 4, md: 8, lg: 12 } as const
export type ProgressSize = keyof typeof progressSizes
export type ProgressTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger'

export const progressMotion = Object.freeze({ segment: 0.32, duration: 1600 })

/** A bounded reading; task ownership and completion stay with the application. */
export function progressState(value: number, max: number) {
  if (!Number.isFinite(max) || max <= 0)
    throw new RangeError('Progress max must be positive and finite')
  if (!Number.isFinite(value)) throw new RangeError('Progress value must be finite')
  const current = Math.min(max, Math.max(0, value))
  const ratio = current / max
  return { value: current, ratio, text: `${Number((ratio * 100).toFixed(1))}%` }
}

export function checkProgressLabels(label: string, indeterminateLabel: string) {
  if (typeof label !== 'string' || !label.trim())
    throw new TypeError('Progress label must be a non-empty string')
  if (typeof indeterminateLabel !== 'string' || !indeterminateLabel.trim())
    throw new TypeError('Progress indeterminateLabel must be a non-empty string')
}
