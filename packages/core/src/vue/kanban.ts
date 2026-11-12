import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  provide,
  ref,
  watch,
  type Component,
  type InjectionKey,
  type Ref,
} from '@vue/runtime-core'
import {
  moveKanban,
  validateKanban,
  type DashboardRect,
  type KanbanCard,
  type KanbanMove,
} from '../dashboard.js'
import { kanbanProps } from './dashboard-props.js'
import { useMavisTheme } from './theme.js'
import type { DashboardUI } from './dashboard-charts.js'

export interface KanbanDrop {
  column: string
  before: string | null
}
/** Extra room below a column that still drops into it, in CSS pixels or DIPs. */
export const kanbanDropAllowance = 60
export interface KanbanTarget<T = unknown> {
  id: string
  target: T
  padding: { bottom: number }
  accept: () => boolean
}
export interface KanbanRegistry<T = unknown> {
  zones: Map<string, T>
  cards: Map<string, () => DashboardRect | undefined>
  focus: Map<string, () => void>
  /** Changes when a column mounts, unmounts or swaps its element or view. */
  revision: Ref<number>
  /** Mounted columns as drop targets for the card, in column order. */
  targets(id: string): KanbanTarget<T>[]
  begin(id: string, cancel: () => void): boolean
  /** The dragged card's bounds and the target under it, in the targets' coordinates. */
  move(target: string | undefined, bounds: DashboardRect): void
  leave(): void
  drop(): void
  finish(id: string): void
  keyboard(id: string, direction: 'up' | 'down' | 'left' | 'right'): void
}
export const kanbanRegistryKey: InjectionKey<KanbanRegistry> = Symbol('Mavis Kanban registry')
export const kanbanZoneProps = {
  column: { type: String, required: true as const },
  raised: Boolean,
}
export const kanbanDragProps = {
  cardId: { type: String, required: true as const },
  label: String,
  disabled: Boolean,
  animated: Boolean,
}

export function createKanban(
  ui: DashboardUI & { Zone: Component; Drag: Component; Menu: Component },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MKanban',
    inheritAttrs: false,
    props: kanbanProps,
    emits: {
      'update:modelValue': (_cards: KanbanCard[]) => true,
      move: (_move: KanbanMove) => true,
    },
    setup(props, { attrs, slots, emit }) {
      const menuOpen = ref<string | null>(null)
      const { theme } = useMavisTheme(),
        announcement = ref(''),
        active = ref<string | null>(null),
        destination = ref<KanbanDrop | null>(null)
      const visible = computed(() =>
        props.modelValue.filter((c) =>
          `${c.title} ${c.description ?? ''}`
            .toLowerCase()
            .includes(props.query.trim().toLowerCase()),
        ),
      )
      const revision = ref(0)
      let session:
        | {
            id: string
            cancel: () => void
            cards: { id: string; column: string; rect: DashboardRect }[]
            drop: KanbanDrop | null
          }
        | undefined
      function place(target: string | undefined, bounds: DashboardRect) {
        const column = target === undefined ? undefined : props.columns[Number(target.slice(1))]?.id
        if (!session || column === undefined) return null
        const id = session.id,
          y = bounds.y + bounds.height / 2
        const before =
          session.cards
            .filter((c) => c.column === column && c.id !== id)
            .sort((a, b) => a.rect.y - b.rect.y)
            .find((c) => y < c.rect.y + c.rect.height / 2)?.id ?? null
        return moveKanban(props.columns, props.modelValue, id, column, before)
          ? { column, before }
          : null
      }
      function commit(id: string, drop: KanbanDrop) {
        if (props.disabled) return
        const result = moveKanban(props.columns, props.modelValue, id, drop.column, drop.before)
        if (!result) return
        emit('update:modelValue', result.cards)
        emit('move', result.move)
        void nextTick(() => {
          const card = props.modelValue.find((c) => c.id === id),
            column = props.columns.find((c) => c.id === card?.column)
          if (card && column) announcement.value = `${card.title} · ${column.title}`
          registry.focus.get(id)?.()
        })
      }
      function keyboard(id: string, direction: 'up' | 'down' | 'left' | 'right') {
        const card = props.modelValue.find((c) => c.id === id)
        if (!card || props.disabled) return
        const list = visible.value.filter((c) => c.column === card.column),
          index = list.findIndex((c) => c.id === id)
        if (direction === 'up' && index > 0)
          commit(id, { column: card.column, before: list[index - 1]!.id })
        if (direction === 'down' && index < list.length - 1)
          commit(id, { column: card.column, before: list[index + 2]?.id ?? null })
        if (direction === 'left' || direction === 'right') {
          const column =
            props.columns[
              props.columns.findIndex((c) => c.id === card.column) + (direction === 'left' ? -1 : 1)
            ]
          if (column) commit(id, { column: column.id, before: null })
        }
      }
      const registry: KanbanRegistry = {
        zones: new Map(),
        cards: new Map(),
        focus: new Map(),
        revision,
        keyboard,
        targets: (id) =>
          props.columns.flatMap((column, index) => {
            const target = registry.zones.get(column.id)
            return target === undefined
              ? []
              : [
                  {
                    id: `c${index}`,
                    target,
                    padding: { bottom: kanbanDropAllowance },
                    accept: () => session?.id === id && session.drop?.column === column.id,
                  },
                ]
          }),
        begin(id, cancel) {
          if (
            props.disabled ||
            !props.draggable ||
            props.modelValue.find((c) => c.id === id)?.disabled
          )
            return false
          session?.cancel()
          session = {
            id,
            cancel,
            drop: null,
            cards: visible.value.flatMap((card) => {
              const rect = registry.cards.get(card.id)?.()
              return rect ? [{ id: card.id, column: card.column, rect }] : []
            }),
          }
          active.value = id
          destination.value = null
          return true
        },
        move(target, bounds) {
          if (!session) return
          const next = place(target, bounds)
          session.drop = next
          if (
            destination.value?.column !== next?.column ||
            destination.value?.before !== next?.before
          )
            destination.value = next
        },
        leave() {
          destination.value = null
        },
        drop() {
          const current = session
          if (!current) return
          registry.finish(current.id)
          if (current.drop) commit(current.id, current.drop)
        },
        finish(id) {
          if (session?.id !== id) return
          session = undefined
          active.value = null
          destination.value = null
        },
      }
      provide(kanbanRegistryKey, registry)
      watch(
        () => [props.modelValue, props.columns, props.query, props.disabled, props.draggable],
        () => {
          menuOpen.value = null
          const current = session
          current?.cancel()
          if (current) registry.finish(current.id)
        },
        { deep: true, flush: 'sync' },
      )
      return () => {
        validateKanban(props.columns, props.modelValue)
        const gap = (column: string, before: string | null) =>
          destination.value?.column === column && destination.value.before === before
            ? h(ui.Box, {
                key: `drop:${before}`,
                height: 40,
                radius: 'md',
                backgroundColor: theme.value.colors.primary,
                ...(platform === 'web'
                  ? { style: { opacity: 0.2 }, 'data-kanban-gap': '' }
                  : { opacity: 0.2 }),
                accessibilityHidden: true,
              })
            : null
        return h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'md',
            ...(platform === 'web'
              ? { class: 'm-kanban', role: 'region', 'aria-label': props.label }
              : { accessibilityLabel: props.label }),
          }),
          () => [
            h(ui.Text, { text: props.label, variant: 'heading' }),
            h(
              ui.Stack,
              {
                direction: 'column',
                gap: 'md',
                align: 'stretch',
                responsive: { at: 760, direction: 'row' },
              },
              () =>
                props.columns.map((column) => {
                  const list = visible.value.filter((c) => c.column === column.id),
                    all = props.modelValue.filter((c) => c.column === column.id),
                    full = column.limit !== undefined && all.length >= column.limit
                  return h(
                    ui.Zone,
                    {
                      key: column.id,
                      column: column.id,
                      raised:
                        active.value !== null &&
                        props.modelValue.some(
                          (c) => c.id === active.value && c.column === column.id,
                        ),
                      ...(platform === 'web'
                        ? { style: { flex: '1 1 0', minWidth: 0 } }
                        : { flexGrow: 1 }),
                    },
                    () =>
                      h(
                        ui.Column,
                        {
                          gap: 'sm',
                          padding: 'sm',
                          radius: 'lg',
                          backgroundColor: theme.value.colors.elevated,
                          minHeight: 180,
                        },
                        () => [
                          h(ui.Text, {
                            text: `${column.title} · ${all.length}${column.limit ? ` / ${column.limit}` : ''}`,
                            variant: 'heading',
                          }),
                          full
                            ? h(ui.Text, {
                                text: props.fullLabel,
                                variant: 'caption',
                                tone: 'muted',
                              })
                            : null,
                          ...list.flatMap((card, index) => [
                            gap(column.id, card.id),
                            h(
                              ui.Drag,
                              {
                                key: card.id,
                                cardId: card.id,
                                label: `${props.moveLabel}: ${card.title}`,
                                disabled: props.disabled || card.disabled || !props.draggable,
                                animated: props.animated,
                              },
                              () =>
                                h(
                                  ui.Column,
                                  {
                                    gap: 'sm',
                                    padding: 'md',
                                    radius: 'md',
                                    backgroundColor: theme.value.colors.surface,
                                  },
                                  () => [
                                    ...(slots.card?.({ card, column }) ?? [
                                      h(ui.Text, { text: card.title, variant: 'heading' }),
                                      card.description
                                        ? h(ui.Text, {
                                            text: card.description,
                                            tone: 'muted',
                                            variant: 'caption',
                                          })
                                        : null,
                                    ]),
                                    h(ui.Row, { gap: 'xs', wrap: true }, () => [
                                      h(ui.Menu, {
                                        label: `${props.moveLabel}: ${card.title}`,
                                        open: menuOpen.value === card.id,
                                        'onUpdate:open': (open: boolean) => {
                                          menuOpen.value = open ? card.id : null
                                        },
                                        triggerLabel: props.moveLabel,
                                        disabled: props.disabled || card.disabled,
                                        items: props.columns
                                          .filter((c) => c.id !== card.column)
                                          .map((c) => ({
                                            value: c.id,
                                            label: c.title,
                                            disabled:
                                              props.disabled ||
                                              card.disabled ||
                                              (c.limit !== undefined &&
                                                props.modelValue.filter((v) => v.column === c.id)
                                                  .length >= c.limit),
                                          })),
                                        onSelect: (to: string) =>
                                          commit(card.id, { column: to, before: null }),
                                      }),
                                      h(ui.Button, {
                                        icon: 'chevron-up',
                                        variant: 'ghost',
                                        size: 'sm',
                                        accessibilityLabel: `${props.upLabel}: ${card.title}`,
                                        disabled: props.disabled || card.disabled || index === 0,
                                        onClick: () => keyboard(card.id, 'up'),
                                      }),
                                      h(ui.Button, {
                                        icon: 'chevron-down',
                                        variant: 'ghost',
                                        size: 'sm',
                                        accessibilityLabel: `${props.downLabel}: ${card.title}`,
                                        disabled:
                                          props.disabled ||
                                          card.disabled ||
                                          index === list.length - 1,
                                        onClick: () => keyboard(card.id, 'down'),
                                      }),
                                    ]),
                                  ],
                                ),
                            ),
                          ]),
                          gap(column.id, null),
                          !list.length
                            ? h(ui.Text, {
                                text: props.emptyLabel,
                                tone: 'muted',
                                variant: 'caption',
                              })
                            : null,
                        ],
                      ),
                  )
                }),
            ),
            h(ui.Text, {
              text: announcement.value,
              variant: 'caption',
              ...(platform === 'web'
                ? { class: 'm-sr-only', role: 'status', 'aria-live': 'polite' }
                : { accessibilityLiveRegion: 'polite' }),
            }),
          ],
        )
      }
    },
  })
}
