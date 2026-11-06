import type { SortableListComponent } from './interactive-components.js'
import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  nextTick,
  onScopeDispose,
  ref,
  watch,
  type Component,
  type PropType,
} from '@vue/runtime-core'
import { choiceKey } from '../choice.js'
import { virtualKeys } from '../collections.js'
import { moveItem, positiveSize, type SortableMove } from '../interactive.js'
import {
  createMotionRegion,
  createMotionSurface,
  createMotionScrollSource,
  type MotionSurface,
  type MotionReorder,
} from '../experimental.js'
import { sortableListProps } from './interactive-props.js'
import { useMavisTheme } from './theme.js'

export const sortableScrollProps = {
  source: {
    type: Object as PropType<ReturnType<typeof createMotionScrollSource>>,
    required: true as const,
  },
  height: { type: Number, required: true as const },
}
export function createSortableList(
  ui: {
    Box: Component
    Column: Component
    Row: Component
    Text: Component
    Button: Component
    Scroll: Component
    ListBody: Component
    input?: (fresh: () => void) => Record<string, unknown>
  },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MSortableList',
    inheritAttrs: false,
    props: sortableListProps,
    emits: {
      'update:modelValue': (_items: unknown[]) => true,
      reorder: (_move: SortableMove) => true,
    },
    setup(props, { attrs, slots, emit }) {
      const { theme } = useMavisTheme()
      const keys = computed(() => virtualKeys(props.modelValue, props.itemKey))
      const region = markRaw(createMotionRegion())
      const container = markRaw(createMotionSurface())
      const scroll = markRaw(createMotionScrollSource())
      const rows = new Map<
        string,
        { target: MotionSurface; handle: MotionSurface; release: () => void }
      >()
      const announcement = ref('')
      let control: MotionReorder | undefined
      let afterDrop = false
      let disposed = false
      let queued = false
      const dispose = () => {
        control?.dispose()
        control = undefined
      }
      function commit(id: string, before: string | null) {
        if (props.disabled) return
        const key = keys.value.find((key) => choiceKey(key) === id)
        const beforeKey =
          before === null ? null : keys.value.find((key) => choiceKey(key) === before)
        if (key === undefined || beforeKey === undefined) return
        const result = moveItem(props.modelValue, props.itemKey, key, beforeKey)
        if (!result) return
        emit('update:modelValue', result.items)
        emit('reorder', result.move)
        void nextTick(() => {
          const index = keys.value.indexOf(key)
          if (index >= 0)
            announcement.value = `${labelAt(index)} · ${index + 1} / ${keys.value.length}`
          control?.refresh()
        })
      }
      function schedule() {
        if (queued || disposed) return
        queued = true
        void nextTick(() => {
          queued = false
          if (disposed || !region.available || !container.available || !scroll.available) return
          if (
            !keys.value.every((key) => {
              const row = rows.get(choiceKey(key))
              return row?.target.available && row.handle.available
            })
          )
            return
          if (!control)
            control = region.reorder({
              container,
              scroll,
              items: () =>
                keys.value.map((key) => ({ key: choiceKey(key), ...rows.get(choiceKey(key))! })),
              onCommit: (move) => {
                afterDrop = true
                commit(move.key, move.beforeKey)
              },
              accessibility: {
                moveUp: props.moveUpLabel,
                moveDown: props.moveDownLabel,
                label: (id) => labelAt(keys.value.findIndex((key) => choiceKey(key) === id)),
              },
            })
          else control.refresh()
          if (props.disabled) control.pause()
          else control.play()
        })
      }
      for (const owner of [region, container, scroll])
        onScopeDispose(
          owner.onAvailable(() => {
            schedule()
            return dispose
          }),
        )
      watch(
        keys,
        (next) => {
          for (const key of next) {
            const id = choiceKey(key)
            if (rows.has(id)) continue
            const target = markRaw(createMotionSurface()),
              handle = markRaw(createMotionSurface())
            const a = target.onAvailable(schedule),
              b = handle.onAvailable(schedule)
            rows.set(id, {
              target,
              handle,
              release: () => {
                a()
                b()
              },
            })
          }
          for (const [id, row] of rows)
            if (!next.some((key) => choiceKey(key) === id)) {
              row.release()
              rows.delete(id)
            }
          schedule()
        },
        { immediate: true, flush: 'sync' },
      )
      watch(() => props.modelValue, schedule, { deep: true, flush: 'post' })
      watch(
        () => props.disabled,
        () => {
          if (props.disabled) {
            control?.cancel()
            control?.pause()
          } else schedule()
        },
      )
      onScopeDispose(() => {
        disposed = true
        dispose()
        for (const row of rows.values()) row.release()
      })
      function labelAt(index: number) {
        return index < 0
          ? ''
          : (props.itemLabel?.(props.modelValue[index]) ?? String(keys.value[index]))
      }
      function move(index: number, delta: number) {
        const key = keys.value[index]
        if (key === undefined || index + delta < 0 || index + delta >= keys.value.length) return
        const before = delta < 0 ? keys.value[index - 1] : keys.value[index + 2]
        const beforeId = before === undefined ? null : choiceKey(before)
        if (control) control.move(choiceKey(key), beforeId)
        else commit(choiceKey(key), beforeId)
      }
      const input =
        ui.input?.(() => {
          // Jolt suppresses the click synthesized by a completed drag. A distinct
          // pointer sequence on another control must be usable immediately.
          if (afterDrop && !control?.activeKey) {
            afterDrop = false
            dispose()
            schedule()
          }
        }) ?? {}
      return () =>
        h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            motionRegion: region,
            ...(platform === 'web'
              ? { class: 'm-sortable-list', role: 'group', 'aria-label': props.label }
              : { accessibilityLabel: props.label }),
          }),
          () => [
            h(ui.Scroll, { source: scroll, height: positiveSize(props.height, 'height') }, () =>
              h(
                ui.ListBody,
                {
                  ...input,
                  motionSurface: container,
                  ...(platform === 'web'
                    ? {
                        role: 'list',
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          padding: '6px',
                        },
                      }
                    : {}),
                },
                () =>
                  keys.value.length
                    ? keys.value.map((key, index) => {
                        const row = rows.get(choiceKey(key))!
                        const label = labelAt(index)
                        return h(
                          ui.Box,
                          {
                            key: choiceKey(key),
                            motionSurface: row.target,
                            radius: 'md',
                            padding: 'sm',
                            backgroundColor: theme.value.colors.surface,
                            ...(platform === 'web'
                              ? {
                                  role: 'listitem',
                                  'data-key': String(key),
                                  style: { border: `1px solid ${theme.value.colors.border}` },
                                }
                              : { marginBottom: 8 }),
                          },
                          () =>
                            h(ui.Row, { gap: 'sm', align: 'center' }, () => [
                              h(ui.Button, {
                                text: '⋮⋮',
                                variant: 'ghost',
                                reorderHandle: true,
                                ...(platform === 'web' ? { 'data-sort-handle': '' } : {}),
                                motionSurface: row.handle,
                                disabled: props.disabled,
                                accessibilityLabel: `${props.handleLabel}: ${label}`,
                              }),
                              h(
                                ui.Column,
                                { grow: 1, shrink: 1 },
                                () =>
                                  slots.default?.({
                                    item: props.modelValue[index],
                                    index,
                                    itemKey: key,
                                  }) ?? h(ui.Text, { text: label }),
                              ),
                              h(ui.Column, { gap: 'xs' }, () => [
                                h(ui.Button, {
                                  icon: 'chevron-up',
                                  variant: 'ghost',
                                  disabled: props.disabled || index === 0,
                                  accessibilityLabel: `${props.moveUpLabel}: ${label}`,
                                  onClick: () => move(index, -1),
                                }),
                                h(ui.Button, {
                                  icon: 'chevron-down',
                                  variant: 'ghost',
                                  disabled: props.disabled || index === keys.value.length - 1,
                                  accessibilityLabel: `${props.moveDownLabel}: ${label}`,
                                  onClick: () => move(index, 1),
                                }),
                              ]),
                            ]),
                        )
                      })
                    : (slots.empty?.() ?? h(ui.Text, { text: props.emptyLabel, tone: 'muted' })),
              ),
            ),
            h(ui.Text, {
              text: announcement.value,
              variant: 'caption',
              ...(platform === 'web'
                ? {
                    class: 'm-sr-only',
                    role: 'status',
                    'aria-live': 'polite',
                    'aria-atomic': 'true',
                  }
                : { accessibilityLiveRegion: 'polite' }),
            }),
          ],
        )
    },
  }) as unknown as SortableListComponent
}
