import type { PublicProps, VNode, VNodeChild } from '@vue/runtime-core'
import type { ChoiceValue } from '../choice.js'
import type { SortableMove } from '../interactive.js'
import type { ComponentProps } from './component-props.js'
type SortableProps<T> = PublicProps &
  Omit<ComponentProps['MSortableList'], 'modelValue' | 'itemKey' | 'itemLabel'> & {
    modelValue: readonly T[]
    itemKey?: Extract<keyof T, string> | ((item: T) => ChoiceValue)
    itemLabel?: (item: T) => string
    'onUpdate:modelValue'?: (items: T[]) => void
    onReorder?: (move: SortableMove) => void
  }
interface SortableContext<T> {
  props: SortableProps<T>
  attrs: Record<string, unknown>
  emit: (event: string, ...args: unknown[]) => void
  slots: {
    default?: (scope: { item: T; index: number; itemKey: ChoiceValue }) => VNodeChild
    empty?: () => VNodeChild
  }
}
export interface SortableListComponent {
  <T>(
    props: NonNullable<Awaited<typeof setup>>['props'],
    context?: Pick<NonNullable<Awaited<typeof setup>>, 'attrs' | 'emit' | 'slots'>,
    exposed?: undefined,
    setup?: Promise<SortableContext<T>>,
  ): VNode & { __ctx?: NonNullable<Awaited<typeof setup>> }
}
