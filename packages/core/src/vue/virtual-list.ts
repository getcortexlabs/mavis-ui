import type { VNode, VNodeChild, PublicProps } from '@vue/runtime-core'
import type { ChoiceValue } from '../choice.js'
import type { VirtualItemSlot, VirtualListHandle } from '../collections.js'
import type { ComponentProps } from './component-props.js'

/** Both renderers expose the same item type to template slots and key callbacks. */
type VirtualListProps<T> = PublicProps &
  Omit<ComponentProps['MVirtualList'], 'items' | 'itemKey'> & {
    items: readonly T[]
    itemKey?: Extract<keyof T, string> | ((item: T) => ChoiceValue)
  }
type VirtualListContext<T> = {
  props: VirtualListProps<T>
  attrs: Record<string, unknown>
  emit: (event: string, ...args: unknown[]) => void
  slots: { default?: (scope: VirtualItemSlot<T>) => VNodeChild; empty?: () => VNodeChild }
  expose(exposed: VirtualListHandle): void
}
export interface VirtualListComponent {
  <T>(
    props: NonNullable<Awaited<typeof setup>>['props'],
    context?: Pick<NonNullable<Awaited<typeof setup>>, 'attrs' | 'emit' | 'slots'>,
    exposed?: NonNullable<Awaited<typeof setup>>['expose'],
    setup?: Promise<VirtualListContext<T>>,
  ): VNode & {
    __ctx?: NonNullable<Awaited<typeof setup>>
  }
}
