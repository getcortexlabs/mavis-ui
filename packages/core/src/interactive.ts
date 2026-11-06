import { choiceKey, type ChoiceValue } from './choice.js'
import { virtualKeys, type VirtualItemKey } from './collections.js'
import type { IconName } from './icon.js'

export interface SwipeAction {
  value: ChoiceValue
  label: string
  icon?: IconName
  destructive?: boolean
  disabled?: boolean
}
export type SwipeSide = 'start' | 'end' | null
export interface ViewerImage {
  key: ChoiceValue
  src: string
  thumbnail?: string
  alt: string
  caption?: string
  aspectRatio?: number
}
export interface SortableMove {
  key: ChoiceValue
  beforeKey: ChoiceValue | null
  fromIndex: number
  toIndex: number
}

export function finiteRange(value: number, min: number, max: number) {
  if (![value, min, max].every(Number.isFinite) || min > max)
    throw new RangeError('Expected a finite value and ordered bounds.')
  return Math.max(min, Math.min(max, value))
}
export function positiveSize(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive.`)
  return value
}
export function moveItem<T>(
  items: readonly T[],
  itemKey: VirtualItemKey<T>,
  key: ChoiceValue,
  beforeKey: ChoiceValue | null,
): { items: T[]; move: SortableMove } | null {
  const keys = virtualKeys(items, itemKey)
  const fromIndex = keys.indexOf(key)
  if (fromIndex < 0 || beforeKey === key || (beforeKey !== null && !keys.includes(beforeKey)))
    return null
  const remaining = items.filter((_, index) => index !== fromIndex)
  const remainingKeys = keys.filter((_, index) => index !== fromIndex)
  const toIndex = beforeKey === null ? remaining.length : remainingKeys.indexOf(beforeKey)
  if (toIndex === fromIndex) return null
  remaining.splice(toIndex, 0, items[fromIndex]!)
  return { items: remaining, move: { key, beforeKey, fromIndex, toIndex } }
}
export function validateActions(start: readonly SwipeAction[], end: readonly SwipeAction[]) {
  const keys = new Set<string>()
  for (const action of [...start, ...end]) {
    const key = choiceKey(action.value)
    if (keys.has(key)) throw new RangeError('Swipe actions require unique keys across both sides.')
    if (!action.label.trim()) throw new TypeError('Swipe actions require visible labels.')
    keys.add(key)
  }
}
export function swipeDestination(
  x: number,
  velocity: number,
  startWidth: number,
  endWidth: number,
  direction = 1,
): SwipeSide {
  const projected = (x + velocity * 0.12) * direction
  return projected > startWidth * 0.45 && startWidth > 0
    ? 'start'
    : projected < -endWidth * 0.45 && endWidth > 0
      ? 'end'
      : null
}
export function panelValue(value: number, min: number, max: number, collapsible: boolean) {
  finiteRange(min, 0, 100)
  finiteRange(max, 0, 100)
  if (min < 0 || max > 100 || min >= max)
    throw new RangeError('Panel bounds must satisfy 0 <= min < max <= 100.')
  return collapsible && value === 0 ? 0 : finiteRange(value, min, max)
}
export function validateViewer(images: readonly ViewerImage[]) {
  virtualKeys(images, 'key')
  for (const image of images) {
    if (!image.src.trim() || !image.alt.trim())
      throw new TypeError('Viewer images require src and descriptive alt text.')
    if (image.aspectRatio !== undefined) positiveSize(image.aspectRatio, 'aspectRatio')
  }
}
