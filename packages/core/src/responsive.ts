import type { Spacing } from './theme/types.js'

export type StackDirection = 'row' | 'column'
export interface StackLayout {
  direction?: StackDirection
  gap?: Spacing
  align?: 'start' | 'end' | 'center' | 'stretch'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around'
  wrap?: boolean
}
export interface StackBreakpoint extends StackLayout {
  /** Content width in CSS pixels on Web and DIPs on NativeScript. */
  at: number
}
export type StackResponsive = StackBreakpoint | readonly StackBreakpoint[]

/** Sorted min-width overrides; the input order never changes the resulting layout. */
export function stackLayout(
  base: StackLayout,
  responsive: StackResponsive | undefined,
  width?: number,
): StackLayout {
  const points =
    responsive === undefined
      ? []
      : Array.isArray(responsive)
        ? [...responsive]
        : [responsive as StackBreakpoint]
  const seen = new Set<number>()
  const result = { ...base }
  for (const point of points.sort((a, b) => a.at - b.at)) {
    if (!Number.isFinite(point.at) || point.at <= 0 || seen.has(point.at))
      throw new RangeError('Stack breakpoints must be distinct positive content widths.')
    seen.add(point.at)
    if (point.direction !== undefined && !['row', 'column'].includes(point.direction))
      throw new TypeError('Unknown responsive stack direction.')
    if (point.align !== undefined && !['start', 'end', 'center', 'stretch'].includes(point.align))
      throw new TypeError('Unknown responsive alignment.')
    if (
      point.justify !== undefined &&
      !['start', 'end', 'center', 'between', 'around'].includes(point.justify)
    )
      throw new TypeError('Unknown responsive distribution.')
    if (point.wrap !== undefined && typeof point.wrap !== 'boolean')
      throw new TypeError('wrap must be boolean.')
    if (width !== undefined && width >= point.at) {
      const { at, ...override } = point
      Object.assign(result, override)
    }
  }
  return result
}

export function stackDirection(
  base: StackDirection,
  responsive: StackResponsive | undefined,
  width?: number,
): StackDirection {
  if (!['row', 'column'].includes(base)) throw new TypeError('Unknown stack direction.')
  return stackLayout({ direction: base }, responsive, width).direction ?? base
}
