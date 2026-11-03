import type { MotionBinding, MotionSurface, MotionScrollSource } from './experimental.js'

export interface MotionCollectionItem<T = MotionSurface> {
  key: string
  target: T
  handle?: T
}
export interface MotionRefreshContext {
  readonly cancelled: boolean
  commit(change: () => void | Promise<void>): Promise<boolean>
}
export interface MotionHeaderOptions<T = MotionSurface> {
  header: T
  artwork: T
  title: T
  toolbar: T
  toolbarTitle: T
  section: T
  items(): readonly MotionCollectionItem<T>[]
  expanded?: number
  minimum?: number
  parallax?: number
  titleFade?: readonly [number, number]
  toolbarFade?: readonly [number, number]
  onRefresh?: (context: MotionRefreshContext) => void | Promise<void>
  onRefreshError?: (error: unknown) => void
  refreshThreshold?: number
}
export interface MotionHeader extends MotionBinding {
  readonly ready: boolean
  readonly state: { readonly offset: number; readonly refreshing: boolean }
  refresh(): Promise<boolean>
  cancelRefresh(): void
  remeasure(): Promise<void>
  preserveAnchor(change: () => void | Promise<void>): Promise<void>
  scrollToItem(key: string, animated?: boolean): boolean
  scrollToTop(animated?: boolean): void
  pause(): void
  play(): void
}
export interface MotionReorderMove {
  key: string
  beforeKey: string | null
  fromIndex: number
  toIndex: number
}
export interface MotionReorderOptions<T = MotionSurface, S = MotionScrollSource> {
  container: T
  items(): readonly MotionCollectionItem<T>[]
  scroll: S
  onCommit(move: MotionReorderMove): void
  onStart?: (key: string) => void
  onCancel?: (event: { key: string; reason: string }) => void
  longPress?: number
  edge?: { size?: number; speed?: number }
  accessibility?: {
    moveUp?: string
    moveDown?: string
    label?: (key: string) => string
    announcement?: (
      key: string,
      position: number,
      total: number,
      phase: 'picked-up' | 'moved' | 'dropped' | 'cancelled',
    ) => string
  }
}
export interface MotionReorder extends MotionBinding {
  readonly activeKey: string | undefined
  move(key: string, beforeKey: string | null): boolean
  moveUp(key: string): boolean
  moveDown(key: string): boolean
  refresh(): void
  cancel(): void
  pause(): void
  play(): void
}
export function mapMotionItems<T, R>(
  items: readonly MotionCollectionItem<T>[],
  resolve: (target: T) => R,
): MotionCollectionItem<R>[] {
  return items.map((item) => ({
    key: item.key,
    target: resolve(item.target),
    ...(item.handle ? { handle: resolve(item.handle) } : {}),
  }))
}
