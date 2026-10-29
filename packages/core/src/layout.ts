import type { MavisTheme, Radius } from './theme/types.js'

export type Dimension = number | 'auto' | `${number}%`

export function nonNegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite, non-negative number`)
  }
  return value
}

export function resolveRadius(theme: MavisTheme, value: Radius | number = 'none'): number {
  return nonNegative(typeof value === 'number' ? value : theme.radius[value], 'radius')
}

/** The portable subset; platform-specific units belong in renderer-specific styles. */
export function resolveDimension(value: Dimension | undefined): Dimension | undefined {
  if (value === undefined || value === 'auto') return value
  if (typeof value === 'number') return nonNegative(value, 'dimension')
  if (typeof value === 'string' && /^(?:\d+(?:\.\d+)?|\.\d+)%$/.test(value)) {
    nonNegative(Number(value.slice(0, -1)), 'percentage')
    return value
  }
  throw new RangeError('Dimensions accept a non-negative number, a percentage, or auto')
}
