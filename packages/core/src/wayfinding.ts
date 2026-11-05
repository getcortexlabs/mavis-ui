import { collectionKeys } from './discovery.js'
import type { ChoiceValue } from './choice.js'
import type { IconName } from './icon.js'
import { linkDestination, type LinkNavigate } from './link.js'
import { validateNavigation, type NavigationItem } from './collections.js'

export interface CommandItem {
  value: ChoiceValue
  label: string
  description?: string
  keywords?: readonly string[]
  group?: string
  icon?: IconName
  /** Display hint only. Applications own action-specific keyboard shortcuts. */
  shortcut?: string
  disabled?: boolean
}
const searchable = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
export function filterCommands(items: readonly CommandItem[], query: string) {
  collectionKeys(items, 'value')
  for (const item of items) if (!item.label.trim()) throw new TypeError('Commands require labels.')
  const terms = searchable(query.trim()).split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    const haystack = searchable(
      [item.label, item.description, item.group, ...(item.keywords ?? [])]
        .filter(Boolean)
        .join(' '),
    )
    return terms.every((term) => haystack.includes(term))
  })
}
export interface NavigationGroup {
  key: string
  label: string
  items: readonly NavigationItem[]
}
export function validateRail(groups: readonly NavigationGroup[]) {
  collectionKeys(groups, 'key')
  for (const group of groups)
    if (!group.label.trim()) throw new TypeError('Navigation groups require labels.')
  validateNavigation(groups.flatMap((group) => group.items))
}
export interface BreadcrumbItem {
  key: ChoiceValue
  label: string
  /** All ancestors require a destination. The last entry is the current page. */
  href?: string
  navigate?: LinkNavigate
}
export function breadcrumbParts(items: readonly BreadcrumbItem[], maxItems: number) {
  collectionKeys(items, 'key')
  if (!Number.isInteger(maxItems) || maxItems < 2)
    throw new RangeError('Breadcrumb maxItems must be an integer of at least 2.')
  items.forEach((item, index) => {
    if (!item.label.trim()) throw new TypeError('Breadcrumb entries require labels.')
    if (index < items.length - 1 && !item.href)
      throw new TypeError('Breadcrumb ancestors require destinations.')
    if (item.href !== undefined) linkDestination(item.href)
  })
  if (items.length <= maxItems) return { before: items, hidden: [], after: [] }
  const split = items.length - maxItems + 1
  return { before: items.slice(0, 1), hidden: items.slice(1, split), after: items.slice(split) }
}
export type TimelineStatus = 'complete' | 'current' | 'upcoming' | 'error'
export interface TimelineItem {
  key: ChoiceValue
  title: string
  description?: string
  /** Application-formatted text: no implicit timezone or date parsing. */
  time?: string
  status?: TimelineStatus
  icon?: IconName
}
export function validateTimeline(items: readonly TimelineItem[]) {
  collectionKeys(items, 'key')
  for (const item of items) {
    if (!item.title.trim()) throw new TypeError('Timeline entries require titles.')
    if (item.status && !['complete', 'current', 'upcoming', 'error'].includes(item.status))
      throw new TypeError('Unknown timeline status.')
  }
}
