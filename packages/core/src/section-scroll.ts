export type ScrollEdge = 'start' | 'center' | 'end'
export interface SectionScrollOptions {
  /** [section edge, viewport edge]. Default: ['start', 'end']. */
  start?: readonly [ScrollEdge, ScrollEdge]
  /** [section edge, viewport edge]. Default: ['end', 'start']. */
  end?: readonly [ScrollEdge, ScrollEdge]
}
const edge = { start: 0, center: 0.5, end: 1 } as const
export function validateSectionScroll(options: SectionScrollOptions) {
  for (const value of [options.start, options.end])
    if (
      value !== undefined &&
      (!Array.isArray(value) ||
        value.length !== 2 ||
        value.some((part) => !Object.hasOwn(edge, part)))
    )
      throw new TypeError(
        'Section points must pair start, center or end for the section and viewport.',
      )
}
/** Renderer geometry only; Jolt owns interpolation, scheduling and reduced motion. */
export function sectionScrollRange(
  top: number,
  height: number,
  viewport: number,
  maximum: number,
  options: SectionScrollOptions,
) {
  validateSectionScroll(options)
  if (
    ![top, height, viewport, maximum].every(Number.isFinite) ||
    height < 0 ||
    viewport < 0 ||
    maximum < 0
  )
    throw new RangeError('Section geometry must be finite.')
  const position = ([section, screen]: readonly [ScrollEdge, ScrollEdge]) =>
    top + height * edge[section] - viewport * edge[screen]
  const start = position(options.start ?? ['start', 'end'])
  const end = position(options.end ?? ['end', 'start'])
  if (end < start) throw new RangeError('Section end must follow its start.')
  const clamp = (value: number) => Math.max(0, Math.min(maximum, value))
  const range = [clamp(start), clamp(end)] as const
  // A section with no traversable range settles; never divide by zero or add a clock.
  return { range: range[1] > range[0] ? range : ([0, 1] as const), settled: range[1] <= range[0] }
}
