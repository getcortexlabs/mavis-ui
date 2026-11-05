import { choiceKey, type ChoiceValue } from './choice.js'
import { virtualKeys, type VirtualItemKey } from './collections.js'
import { sliderScale } from './slider.js'

export type RangeValue = readonly [number, number]
export function rangeValue(
  value: RangeValue,
  min: number,
  max: number,
  step: number,
): [number, number] {
  const scale = sliderScale(min, max, step)
  if (!Array.isArray(value) || value.length !== 2 || value[0]! > value[1]!)
    throw new RangeError('RangeSlider requires an ordered pair.')
  return [scale.fromNative(scale.toNative(value[0]!)), scale.fromNative(scale.toNative(value[1]!))]
}
export function moveRange(
  value: RangeValue,
  thumb: 0 | 1,
  next: number,
  min: number,
  max: number,
  step: number,
): [number, number] {
  const pair = rangeValue(value, min, max, step)
  const scale = sliderScale(min, max, step)
  const snapped = scale.fromNative(scale.toNative(next))
  pair[thumb] = thumb === 0 ? Math.min(snapped, pair[1]) : Math.max(snapped, pair[0])
  return pair
}

export interface DataColumn<T = Record<string, unknown>> {
  key: string
  label: string
  /** Display text; sorting remains an application-owned operation. */
  value?: (item: T) => string | number | null | undefined
  sortable?: boolean
  width?: number
  align?: 'start' | 'end'
}
export interface DataSort {
  key: string
  direction: 'ascending' | 'descending'
}
export interface DataCellSlot<T = Record<string, unknown>> {
  item: T
  itemKey: ChoiceValue
  column: DataColumn<T>
  value: string | number | null | undefined
  index: number
}
export function validateColumns(columns: readonly DataColumn[]) {
  const seen = new Set<string>()
  if (!columns.length) throw new RangeError('DataTable requires at least one column.')
  for (const column of columns) {
    if (!column.key || !column.label.trim() || seen.has(column.key))
      throw new TypeError('DataTable columns require unique keys and nonempty labels.')
    if (column.width !== undefined && (!Number.isFinite(column.width) || column.width < 44))
      throw new RangeError('Column width must be at least 44.')
    seen.add(column.key)
  }
}
export function nextDataSort(current: DataSort | null, key: string): DataSort | null {
  return current?.key !== key
    ? { key, direction: 'ascending' }
    : current.direction === 'ascending'
      ? { key, direction: 'descending' }
      : null
}
/** Page selection preserves keys from other pages and does not mutate the input. */
export function selectPage(
  selected: readonly ChoiceValue[],
  page: readonly ChoiceValue[],
  checked: boolean,
) {
  const pageIds = new Set(page.map(choiceKey))
  const result = selected.filter((key) => !pageIds.has(choiceKey(key)))
  return checked ? [...result, ...page] : result
}
export function collectionKeys<T>(items: readonly T[], itemKey: VirtualItemKey<T>) {
  return virtualKeys(items, itemKey)
}

export interface TreeNode {
  key: ChoiceValue
  label: string
  disabled?: boolean
  children?: readonly TreeNode[]
  /** True with undefined children requests loading on expansion. An empty array is loaded. */
  hasChildren?: boolean
}
export interface TreeEntry {
  node: TreeNode
  parent: ChoiceValue | null
  level: number
  position: number
  siblings: number
}
export function treeEntries(
  nodes: readonly TreeNode[],
  expanded: readonly ChoiceValue[],
): TreeEntry[] {
  const seen = new Set<string>()
  const open = new Set(expanded.map(choiceKey))
  const visible: TreeEntry[] = []
  function visit(
    children: readonly TreeNode[],
    parent: ChoiceValue | null,
    level: number,
    show: boolean,
  ) {
    if (level > 100) throw new RangeError('TreeView depth exceeds 100 levels.')
    for (const [index, node] of children.entries()) {
      if (
        (typeof node.key !== 'string' && typeof node.key !== 'number') ||
        (typeof node.key === 'number' && !Number.isFinite(node.key)) ||
        !node.label.trim()
      )
        throw new TypeError('Tree nodes require a finite key and label.')
      const id = choiceKey(node.key)
      if (seen.has(id)) throw new RangeError('Tree keys must be unique; cycles are not allowed.')
      seen.add(id)
      if (show)
        visible.push({ node, parent, level, position: index + 1, siblings: children.length })
      if (node.children) visit(node.children, node.key, level + 1, show && open.has(id))
    }
  }
  visit(nodes, null, 1, true)
  return visible
}
export function treeBranch(node: TreeNode) {
  return node.children === undefined ? !!node.hasChildren : node.children.length > 0
}
export function ratingValue(value: number, max: number, step: number) {
  if (!Number.isInteger(max) || max < 1 || max > 10 || (step !== 1 && step !== 0.5))
    throw new RangeError('Rating requires max 1–10 and step 1 or 0.5.')
  if (!Number.isFinite(value)) throw new RangeError('Rating must be finite.')
  return Math.max(0, Math.min(max, Math.round(value / step) * step))
}
