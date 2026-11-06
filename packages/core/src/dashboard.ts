import { chartGeometry } from './chart.js'

export interface KanbanColumn {
  id: string
  title: string
  limit?: number
}
export interface KanbanCard {
  id: string
  column: string
  title: string
  description?: string
  disabled?: boolean
}
export interface KanbanMove {
  id: string
  from: string
  to: string
  before: string | null
}
export interface DonutSegment {
  id: string
  label: string
  value: number
  color?: string
}
export interface SparklinePoint {
  id: string
  label: string
  value: number | null
}
export interface DashboardRect {
  x: number
  y: number
  width: number
  height: number
}
export function dashboardNumber(value: number, min: number, max: number, name: string) {
  if (!Number.isFinite(value) || value < min || value > max)
    throw new RangeError(`${name} must be between ${min} and ${max}.`)
  return value
}
function unique(items: readonly { id: string }[], name: string) {
  const keys = new Set<string>()
  for (const item of items) {
    if (!item.id || keys.has(item.id)) throw new TypeError(`${name} requires unique, nonempty IDs.`)
    keys.add(item.id)
  }
}
export function validateKanban(columns: readonly KanbanColumn[], cards: readonly KanbanCard[]) {
  unique(columns, 'Kanban columns')
  unique(cards, 'Kanban cards')
  if (!columns.length || columns.length > 12 || cards.length > 500)
    throw new RangeError('Kanban supports 1–12 columns and at most 500 cards.')
  for (const column of columns) {
    if (!column.title.trim()) throw new TypeError('Kanban columns need a title.')
    if (column.limit !== undefined && (!Number.isInteger(column.limit) || column.limit < 1))
      throw new RangeError('Column limits must be positive integers.')
  }
  for (const card of cards)
    if (!card.title.trim() || !columns.some((c) => c.id === card.column))
      throw new TypeError('Cards require a title and an existing column.')
}
/** Keeps hidden cards and consumer metadata intact; limits apply to all cards, not the filtered view. */
export function moveKanban<T extends KanbanCard>(
  columns: readonly KanbanColumn[],
  cards: readonly T[],
  id: string,
  to: string,
  before: string | null = null,
): { cards: T[]; move: KanbanMove } | null {
  validateKanban(columns, cards)
  const card = cards.find((c) => c.id === id),
    column = columns.find((c) => c.id === to)
  if (!card || card.disabled || !column || before === id) return null
  if (before !== null && !cards.some((c) => c.id === before && c.column === to)) return null
  if (
    card.column !== to &&
    column.limit !== undefined &&
    cards.filter((c) => c.column === to).length >= column.limit
  )
    return null
  const next = cards.filter((c) => c.id !== id)
  const index = before === null ? next.length : next.findIndex((c) => c.id === before)
  next.splice(index, 0, { ...card, column: to })
  const oldOrder = cards
    .filter((c) => c.column === to)
    .map((c) => c.id)
    .join('\0')
  const newOrder = next
    .filter((c) => c.column === to)
    .map((c) => c.id)
    .join('\0')
  if (card.column === to && oldOrder === newOrder) return null
  return { cards: next, move: { id, from: card.column, to, before } }
}
export function donutGeometry(segments: readonly DonutSegment[]) {
  unique(segments, 'Donut segments')
  if (segments.length > 24) throw new RangeError('Donut supports at most 24 segments.')
  let total = 0
  for (const segment of segments) {
    if (!segment.label.trim() || !Number.isFinite(segment.value) || segment.value < 0)
      throw new TypeError('Donut segments require a label and finite nonnegative value.')
    if (segment.color && !/^#[\da-f]{6}$/i.test(segment.color))
      throw new TypeError('Segment colors must be six-digit HEX.')
    total += segment.value
  }
  if (!Number.isFinite(total)) throw new RangeError('Donut total must be finite.')
  let offset = 0
  return {
    total,
    segments: segments.map((segment) => {
      const ratio = total ? segment.value / total : 0,
        start = offset
      offset = Math.min(1, offset + ratio)
      return { ...segment, ratio, start, end: offset }
    }),
  }
}
export const donutPath = 'M 50 10 A 40 40 0 1 1 50 90 A 40 40 0 1 1 50 10'
/** Uses the chart domain/null conventions. A zero-length line is extended for a single point. */
export function sparklineGeometry(
  points: readonly SparklinePoint[],
  domain?: readonly [number, number],
  width = 100,
  height = 40,
) {
  unique(points, 'Sparkline points')
  const geometry = chartGeometry(
    points.map((p) => ({ key: p.id, label: p.label })),
    [{ key: 'sparkline', label: 'Values', values: points.map((p) => p.value) }],
    domain,
  )
  const paths: { id: string; d: string }[] = []
  let d = '',
    id = '',
    count = 0,
    last = ''
  const flush = () => {
    if (d) paths.push({ id, d: count === 1 ? `${d} L${last}` : d })
    d = ''
    count = 0
  }
  for (const point of geometry.series[0]?.points ?? []) {
    if (!point) {
      flush()
      continue
    }
    if (!d) id = points[point.index]!.id
    const x =
      (points.length === 1 ? 0.5 : 0.02 + (point.index / (points.length - 1)) * 0.96) * width
    const y = (0.1 + point.y * 0.8) * height
    last = `${Math.min(width * 0.98, x + 0.01)} ${y}`
    d += `${d ? ' L' : 'M'}${x} ${y}`
    count++
  }
  flush()
  return { ...geometry, paths }
}
export function effectColors(colors: readonly string[]) {
  if (colors.length < 2 || colors.length > 8 || colors.some((c) => !/^#[\da-f]{6}$/i.test(c)))
    throw new TypeError('Effects require 2–8 six-digit HEX colors.')
  return colors
}
