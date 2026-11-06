import { collectionKeys } from './discovery.js'
import type { ChoiceValue } from './choice.js'

export interface ChartCategory {
  key: ChoiceValue
  label: string
}
export interface ChartSeries {
  key: ChoiceValue
  label: string
  values: readonly (number | null)[]
  /** A shared CSS/native hex color; the theme supplies defaults. */
  color?: string
}
export interface ChartSelection {
  category: ChoiceValue
  series: ChoiceValue
}
export interface ChartPoint {
  key?: ChoiceValue
  x: number
  y: number
  value: number
  index: number
}
export interface ChartGeometry {
  min: number
  max: number
  zero: number
  ticks: readonly number[]
  series: readonly { key: ChoiceValue; points: readonly (ChartPoint | null)[] }[]
}

/** Hit testing uses normalized plot coordinates, independent of DOM/native geometry. */
export function chartHitTest(geometry: ChartGeometry, type: 'line' | 'bar', x: number, y: number) {
  const count = geometry.series[0]?.points.length ?? 0
  if (!count || !Number.isFinite(x) || !Number.isFinite(y)) return null
  const category = Math.max(0, Math.min(count - 1, Math.floor(x * count)))
  if (type === 'bar') {
    const within = x * count - category
    const series = Math.max(
      0,
      Math.min(
        geometry.series.length - 1,
        Math.floor(((within - 0.15) / 0.7) * geometry.series.length),
      ),
    )
    return geometry.series[series]?.points[category] ? { category, series } : null
  }
  let nearest = -1,
    distance = Infinity
  geometry.series.forEach((series, index) => {
    const point = series.points[category]
    if (point && Math.abs(point.y - y) < distance) {
      nearest = index
      distance = Math.abs(point.y - y)
    }
  })
  return nearest < 0 ? null : { category, series: nearest }
}

/** Category positions and values normalized to [0,1], identical in both renderers. */
export function chartGeometry(
  categories: readonly ChartCategory[],
  series: readonly ChartSeries[],
  domain?: readonly [number, number],
): ChartGeometry {
  collectionKeys(categories, 'key')
  collectionKeys(series, 'key')
  // This first renderer targets small product charts, not unbounded telemetry streams.
  if (categories.length > 100 || series.length > 8)
    throw new RangeError('Chart supports up to 100 categories and 8 series.')
  for (const category of categories)
    if (!category.label.trim()) throw new TypeError('Chart categories require labels.')
  const values: number[] = []
  for (const item of series) {
    if (!item.label.trim() || item.values.length !== categories.length)
      throw new TypeError('Chart series require labels and one value per category.')
    if (item.color && !/^#[\da-f]{6}$/i.test(item.color))
      throw new TypeError('Chart colors must be six digit hex values.')
    for (const value of item.values) {
      if (value !== null && !Number.isFinite(value))
        throw new RangeError('Chart values must be finite numbers or null.')
      if (value !== null) values.push(value)
    }
  }
  let min = Math.min(0, ...values),
    max = Math.max(0, ...values)
  if (domain) {
    if (domain.length !== 2 || !domain.every(Number.isFinite) || domain[0] >= domain[1])
      throw new RangeError('Chart domain requires two increasing finite values.')
    ;[min, max] = domain
    if (values.some((value) => value < min || value > max))
      throw new RangeError('Chart domain must contain every value.')
  } else if (min === max) max = min + 1
  const span = max - min
  if (!Number.isFinite(span)) throw new RangeError('Chart domain span must be finite.')
  const y = (value: number) => 1 - (value - min) / span
  return {
    min,
    max,
    zero: y(Math.max(min, Math.min(max, 0))),
    ticks: Array.from({ length: 5 }, (_, i) => min + span * (i / 4)),
    series: series.map((item) => ({
      key: item.key,
      points: item.values.map((value, index) =>
        value === null
          ? null
          : {
              key: categories[index]!.key,
              value,
              index,
              x: (index + 0.5) / Math.max(1, categories.length),
              y: y(value),
            },
      ),
    })),
  }
}

/** Presentation-only interpolation. Canonical values and hit testing always use the model. */
export function interpolateChart(
  from: ChartGeometry | undefined,
  to: ChartGeometry,
  progress: number,
): ChartGeometry {
  const mix = (a: number, b: number) => a + (b - a) * Math.max(0, Math.min(1, progress))
  const previousSeries = new Map(from?.series.map((series) => [series.key, series]))
  return {
    ...to,
    zero: mix(from?.zero ?? to.zero, to.zero),
    series: to.series.map((series) => {
      const old = previousSeries.get(series.key)
      const previousPoints = new Map(
        old?.points.flatMap((point) => (point ? [[point.key ?? point.index, point] as const] : [])),
      )
      return {
        ...series,
        points: series.points.map((point) => {
          if (!point) return null
          const previous = previousPoints.get(point.key ?? point.index)
          return {
            ...point,
            x: mix(previous?.x ?? point.x, point.x),
            y: mix(previous?.y ?? from?.zero ?? to.zero, point.y),
          }
        }),
      }
    }),
  }
}
