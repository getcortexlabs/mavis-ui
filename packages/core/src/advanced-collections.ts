import { addCivilDays, civilDate, civilWeekday, type CivilDate } from './date.js'

export interface TreeSelectNode {
  id: string
  label: string
  disabled?: boolean
  selectable?: boolean
  children?: readonly TreeSelectNode[]
}
export interface TreeSelectRow {
  node: TreeSelectNode
  depth: number
  ancestors: readonly string[]
  disabled: boolean
}
export function treeSelectRows(nodes: readonly TreeSelectNode[]): TreeSelectRow[] {
  const ids = new Set<string>(),
    rows: TreeSelectRow[] = []
  function visit(items: readonly TreeSelectNode[], ancestors: string[], disabled = false) {
    if (ancestors.length > 32) throw new RangeError('TreeSelect supports at most 32 levels.')
    for (const node of items) {
      if (!node.id || ids.has(node.id) || !node.label.trim())
        throw new TypeError(
          'TreeSelect requires unique nonempty IDs and labels; cycles are invalid.',
        )
      ids.add(node.id)
      if (ids.size > 2000) throw new RangeError('TreeSelect supports at most 2000 nodes.')
      const unavailable = disabled || !!node.disabled
      rows.push({ node, depth: ancestors.length, ancestors, disabled: unavailable })
      visit(node.children ?? [], [...ancestors, node.id], unavailable)
    }
  }
  visit(nodes, [])
  return rows
}
export function visibleTreeSelection(
  rows: readonly TreeSelectRow[],
  expanded: readonly string[],
  query: string,
) {
  const text = query.trim().toLocaleLowerCase()
  if (!text) return rows.filter((row) => row.ancestors.every((id) => expanded.includes(id)))
  const visible = new Set<string>()
  for (const row of rows)
    if (row.node.label.toLocaleLowerCase().includes(text)) {
      visible.add(row.node.id)
      row.ancestors.forEach((id) => visible.add(id))
    }
  return rows.filter((row) => visible.has(row.node.id))
}
export function toggleTreeSelection(
  nodes: readonly TreeSelectNode[],
  values: readonly string[],
  id: string,
  multiple: boolean,
) {
  const row = treeSelectRows(nodes).find((row) => row.node.id === id)
  if (!row || row.disabled || row.node.selectable === false) return [...values]
  if (!multiple) return [id]
  return values.includes(id)
    ? values.filter((value) => value !== id)
    : [...new Set([...values, id])]
}
export interface MasonryItem {
  id: string
  estimatedHeight?: number
}
export interface MasonryPlacement {
  id: string
  x: number
  y: number
  width: number
  height: number
  column: number
}
export function masonryLayout(
  items: readonly MasonryItem[],
  width: number,
  minWidth: number,
  gap: number,
  maxColumns: number,
  heights: ReadonlyMap<string, number> = new Map(),
) {
  if (
    ![width, minWidth, gap, maxColumns].every(Number.isFinite) ||
    width < 0 ||
    minWidth < 40 ||
    gap < 0 ||
    !Number.isInteger(maxColumns) ||
    maxColumns < 1 ||
    maxColumns > 12
  )
    throw new RangeError('Masonry needs a nonnegative width/gap, minWidth >= 40 and 1–12 columns.')
  uniqueAdvanced(items, 'Masonry', 500)
  const columns = Math.max(1, Math.min(maxColumns, Math.floor((width + gap) / (minWidth + gap))))
  const itemWidth = Math.max(0, (width - gap * (columns - 1)) / columns),
    bottoms = Array<number>(columns).fill(0)
  const placements = items.map((item) => {
    const height = heights.get(item.id) ?? item.estimatedHeight ?? 180
    if (!Number.isFinite(height) || height < 0)
      throw new RangeError('Masonry heights must be finite and nonnegative.')
    const column = bottoms.indexOf(Math.min(...bottoms)),
      y = bottoms[column]!
    bottoms[column] = y + height + gap
    return { id: item.id, x: column * (itemWidth + gap), y, width: itemWidth, height, column }
  })
  return { columns, placements, height: Math.max(0, ...bottoms) - (items.length ? gap : 0) }
}
export interface HeatmapValue {
  date: CivilDate
  value: number | null
  label?: string
  disabled?: boolean
}
export function heatmapCalendar(
  start: CivilDate,
  end: CivilDate,
  values: readonly HeatmapValue[],
  weekStartsOn: 0 | 1 = 1,
) {
  if (![0, 1].includes(weekStartsOn)) throw new RangeError('Heatmap weekStartsOn must be 0 or 1.')
  civilDate(start)
  civilDate(end)
  if (end < start || end > addCivilDays(start, 365))
    throw new RangeError('Heatmap range must contain 1–366 days.')
  const map = new Map<CivilDate, HeatmapValue>()
  for (const item of values) {
    civilDate(item.date)
    if (
      map.has(item.date) ||
      (item.value !== null && (!Number.isFinite(item.value) || item.value < 0))
    )
      throw new TypeError('Heatmap dates must be unique and values nonnegative, finite or null.')
    map.set(item.date, item)
  }
  const leading = (civilWeekday(start) - weekStartsOn + 7) % 7
  const cells: (HeatmapValue & { index: number; row: number; column: number; missing: boolean })[] =
    []
  for (let day = start, i = 0; ; i++, day = addCivilDays(day, 1)) {
    const entry = map.get(day),
      index = leading + i
    cells.push({
      date: day,
      value: entry?.value ?? null,
      label: entry?.label,
      disabled: entry?.disabled,
      index,
      row: index % 7,
      column: Math.floor(index / 7),
      missing: entry?.value == null,
    })
    if (day === end) break
  }
  const max = Math.max(0, ...cells.map((c) => c.value ?? 0))
  return { cells, columns: cells[cells.length - 1]!.column + 1, max }
}
export function heatmapColor(value: number | null, max: number, colors: readonly string[]) {
  if (
    colors.length < 2 ||
    colors.length > 8 ||
    colors.some((color) => !/^#[\da-f]{6}$/i.test(color))
  )
    throw new TypeError('Heatmap colors require 2–8 six-digit HEX values.')
  if (value === null) return 'transparent'
  return colors[
    Math.min(colors.length - 1, Math.floor((max ? value / max : 0) * (colors.length - 1)))
  ]!
}
export interface MavisNotification {
  id: string
  title: string
  description?: string
  group?: string
  time?: string
  read?: boolean
  disabled?: boolean
  dismissible?: boolean
  actionLabel?: string
}
export function uniqueAdvanced(items: readonly { id: string }[], label: string, limit = 500) {
  const ids = new Set<string>()
  if (items.length > limit) throw new RangeError(`${label} supports at most ${limit} items.`)
  for (const item of items) {
    if (!item.id || ids.has(item.id)) throw new TypeError(`${label} requires unique nonempty IDs.`)
    ids.add(item.id)
  }
}
export function updateNotifications<T extends MavisNotification>(
  items: readonly T[],
  ids: readonly string[],
  action: 'read' | 'unread' | 'dismiss',
) {
  uniqueAdvanced(items, 'NotificationCenter', 1000)
  return items.flatMap((item) => {
    if (!ids.includes(item.id) || item.disabled) return [item]
    if (action === 'dismiss') return item.dismissible === false ? [item] : []
    return [{ ...item, read: action === 'read' }]
  })
}
