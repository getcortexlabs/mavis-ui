import { choiceKey, type ChoiceValue } from './choice.js'
import type { IconName } from './icon.js'
import { linkDestination, type LinkNavigate } from './link.js'

export interface MenuAction {
  value: ChoiceValue
  label: string
  icon?: IconName
  disabled?: boolean
  destructive?: boolean
}
export type MenuItem =
  MenuAction | { type: 'separator'; key: string } | { type: 'group'; key: string; label: string }
export interface NavigationItem {
  value: ChoiceValue
  label: string
  href: string
  icon?: IconName
  badge?: string | number
  disabled?: boolean
  navigate?: LinkNavigate
}
export function validateMenu(items: readonly MenuItem[]) {
  const keys = new Set<string>()
  for (const item of items) {
    const key = 'type' in item ? `decoration:${item.key}` : choiceKey(item.value)
    if (keys.has(key)) throw new RangeError('Menu items require unique keys.')
    keys.add(key)
    if ((!('type' in item) || item.type === 'group') && !item.label.trim())
      throw new TypeError('Menu actions and groups require labels.')
  }
}
export function validateNavigation(items: readonly NavigationItem[]) {
  validateMenu(items)
  items.forEach((item) => linkDestination(item.href))
}
export type VirtualItemKey<T = unknown> = string | ((item: T) => ChoiceValue)
export interface VirtualItemSlot<T = unknown> {
  item: T
  index: number
  itemKey: ChoiceValue
}
export interface VirtualListHandle {
  scrollToIndex(index: number): void
}
export function virtualKeys<T>(items: readonly T[], itemKey: VirtualItemKey<T>): ChoiceValue[] {
  const seen = new Set<string>()
  return items.map((item) => {
    const key =
      typeof itemKey === 'function' ? itemKey(item) : (item as Record<string, unknown>)?.[itemKey]
    if (
      (typeof key !== 'string' && typeof key !== 'number') ||
      (typeof key === 'number' && !Number.isFinite(key))
    )
      throw new TypeError('Virtual list items require finite number or string keys.')
    const id = choiceKey(key)
    if (seen.has(id)) throw new RangeError('Virtual list keys must be unique.')
    seen.add(id)
    return key
  })
}
/** Preserve the first visible identity and its intra-row offset; removed anchors use the nearest index. */
export function virtualAnchor(
  previous: readonly ChoiceValue[],
  next: readonly ChoiceValue[],
  rowHeight: number,
  height: number,
  offset: number,
): number {
  const before = virtualWindow(previous.length, rowHeight, height, offset, 0).scrollTop
  const index = Math.floor(before / rowHeight)
  const key = previous[index]
  const found = key === undefined ? -1 : next.indexOf(key)
  const destination = found < 0 ? Math.min(index, Math.max(0, next.length - 1)) : found
  return virtualWindow(
    next.length,
    rowHeight,
    height,
    destination * rowHeight + (before % rowHeight),
    0,
  ).scrollTop
}

export function virtualWindow(
  count: number,
  rowHeight: number,
  height: number,
  offset: number,
  overscan = 3,
) {
  if (
    !Number.isInteger(count) ||
    count < 0 ||
    !Number.isFinite(rowHeight) ||
    rowHeight <= 0 ||
    !Number.isFinite(height) ||
    height <= 0 ||
    !Number.isInteger(overscan) ||
    overscan < 0 ||
    !Number.isFinite(offset)
  )
    throw new RangeError(
      'Virtual list requires positive finite dimensions and nonnegative integer overscan.',
    )
  const scrollTop = Math.max(0, Math.min(offset, Math.max(0, count * rowHeight - height)))
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(count, Math.ceil((scrollTop + height) / rowHeight) + overscan)
  return { start, end, scrollTop, totalHeight: count * rowHeight }
}
