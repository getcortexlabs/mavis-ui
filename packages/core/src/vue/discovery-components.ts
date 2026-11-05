import type { PublicProps, VNode, VNodeChild } from '@vue/runtime-core'
import type { ComponentProps } from './component-props.js'
import type { ChoiceValue } from '../choice.js'
import type { VirtualItemSlot } from '../collections.js'
import type { DataColumn, DataCellSlot, DataSort } from '../discovery.js'

type Key<T> = Extract<keyof T, string> | ((item: T) => ChoiceValue)
interface Context<P, S> {
  props: P
  attrs: Record<string, unknown>
  emit: (event: string, ...args: unknown[]) => void
  slots: S
}
type CarouselProps<T> = PublicProps &
  Omit<ComponentProps['MCarousel'], 'items' | 'itemKey'> & {
    items: readonly T[]
    itemKey?: Key<T>
    'onUpdate:modelValue'?: (key: ChoiceValue) => void
  }
type CarouselContext<T> = Context<
  CarouselProps<T>,
  { default?: (scope: VirtualItemSlot<T>) => VNodeChild; empty?: () => VNodeChild }
>
export interface CarouselComponent {
  <T>(
    props: NonNullable<Awaited<typeof setup>>['props'],
    context?: Pick<NonNullable<Awaited<typeof setup>>, 'attrs' | 'emit' | 'slots'>,
    exposed?: undefined,
    setup?: Promise<CarouselContext<T>>,
  ): VNode & { __ctx?: NonNullable<Awaited<typeof setup>> }
}
type TableProps<T> = PublicProps &
  Omit<
    ComponentProps['MDataTable'],
    'items' | 'itemKey' | 'columns' | 'rowLabel' | 'rowDisabled'
  > & {
    items: readonly T[]
    itemKey?: Key<T>
    columns: readonly DataColumn<T>[]
    rowLabel?: (item: T) => string
    rowDisabled?: (item: T) => boolean
    'onUpdate:sort'?: (sort: DataSort | null) => void
    'onUpdate:selected'?: (keys: ChoiceValue[]) => void
  }
type TableSlots<T> = {
  cell?: (scope: DataCellSlot<T>) => VNodeChild
  actions?: () => VNodeChild
  footer?: () => VNodeChild
  empty?: () => VNodeChild
} & {
  [name: `cell:${string}`]: ((scope: DataCellSlot<T>) => VNodeChild) | undefined
}
export interface DataTableComponent {
  <T>(
    props: NonNullable<Awaited<typeof setup>>['props'],
    context?: Pick<NonNullable<Awaited<typeof setup>>, 'attrs' | 'emit' | 'slots'>,
    exposed?: undefined,
    setup?: Promise<Context<TableProps<T>, TableSlots<T>>>,
  ): VNode & { __ctx?: NonNullable<Awaited<typeof setup>> }
}
