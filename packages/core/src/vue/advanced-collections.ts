import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  nextTick,
  onScopeDispose,
  ref,
  useId,
  watch,
  type Component,
} from '@vue/runtime-core'
import {
  treeSelectRows,
  visibleTreeSelection,
  toggleTreeSelection,
  masonryLayout,
  heatmapCalendar,
  heatmapColor,
  updateNotifications,
  uniqueAdvanced,
  type MavisNotification,
} from '../advanced-collections.js'
import { createMotionSurface, type MotionGradient } from '../experimental.js'
import { componentMotion } from '../motion.js'
import { resolveSpace } from '../theme/resolve.js'
import type { CivilDate } from '../date.js'
import {
  treeSelectProps,
  masonryProps,
  heatmapProps,
  notificationCenterProps,
} from './advanced-props.js'
import { useComponentLayout } from './component-motion.js'
import { useMavisTheme } from './theme.js'
export interface AdvancedUI {
  Box: Component
  Column: Component
  Row: Component
  Stack: Component
  Card: Component
  Text: Component
  Button: Component
  Input: Component
  Checkbox: Component
  Slider: Component
  Popover: Component
  Segmented: Component
  Image: Component
  Host: Component
  Measure: Component
  Canvas: Component
  Cell: Component
  Scroll: Component
  Gesture: Component
}
export interface AdvancedFocus {
  focus(id?: string): void
}
const web = (platform: string, attrs: Record<string, unknown>) => (platform === 'web' ? attrs : {})
export function createAdvancedPaint(ui: AdvancedUI) {
  return defineComponent({
    props: { color: { type: String, required: true }, animated: Boolean },
    setup(props, { slots }) {
      const surface = markRaw(createMotionSurface()),
        { theme } = useMavisTheme()
      onScopeDispose(
        surface.use((owner) => {
          let paint: MotionGradient | undefined
          const stop = watch(
            () => [props.color, props.animated],
            () => {
              if (!/^#[\da-f]{6}$/i.test(props.color)) {
                paint?.dispose()
                paint = undefined
                return
              }
              if (!owner.supports('gradient')) return
              const colors = [props.color, props.color]
              if (!paint) paint = owner.gradient({ type: 'linear', colors, angle: 0 })
              else if (props.animated)
                paint.animate({ colors }, componentMotion(theme.value, 'data'))
              else {
                paint.stop()
                paint.set({ colors })
              }
            },
            { immediate: true },
          )
          return () => {
            stop()
            paint?.dispose()
          }
        }),
      )
      return () =>
        h(
          ui.Box,
          {
            motionSurface: surface,
            backgroundColor: props.color,
            radius: 'sm',
            width: '100%',
            height: '100%',
          },
          slots,
        )
    },
  })
}
export function createTreeSelect(ui: AdvancedUI, platform: 'web' | 'native') {
  const Row = defineComponent({
    name: 'MTreeSelectRow',
    props: { animated: Boolean },
    setup(props, { slots }) {
      const { theme } = useMavisTheme()
      const surface = markRaw(createMotionSurface())
      onScopeDispose(
        surface.use((owner) => {
          // Moving existing options across newly inserted ones lets a different control
          // intercept a click mid-expansion. Fade new rows in their final layout boxes.
          const entry = props.animated
            ? owner.animate({ opacity: [0, 1] }, componentMotion(theme.value, 'overlay'))
            : undefined
          return watch(
            () => props.animated,
            (animated) => {
              if (!animated) {
                entry?.stop()
                owner.set({ opacity: 1 })
              }
            },
          )
        }),
      )
      return () => h(ui.Row, { gap: 'xs', align: 'center', motionSurface: surface }, slots)
    },
  })
  return defineComponent({
    name: 'MTreeSelect',
    inheritAttrs: false,
    props: treeSelectProps,
    emits: {
      'update:modelValue': (_v: string[]) => true,
      'update:expanded': (_v: string[]) => true,
    },
    setup(props, { attrs, emit }) {
      const open = ref(false),
        query = ref(''),
        rows = computed(() => treeSelectRows(props.nodes)),
        visible = computed(() => visibleTreeSelection(rows.value, props.expanded, query.value))
      const mutable = (id: string) =>
        rows.value.some((r) => r.node.id === id && !r.disabled && r.node.selectable !== false)
      function choose(id: string) {
        if (props.disabled) return
        emit(
          'update:modelValue',
          toggleTreeSelection(props.nodes, props.modelValue, id, props.multiple),
        )
        if (!props.multiple) open.value = false
      }
      watch(
        () => props.disabled,
        (v) => {
          if (v) open.value = false
        },
      )
      return () => {
        if (!props.multiple && props.modelValue.length > 1)
          throw new RangeError('Single TreeSelect accepts at most one selected ID.')
        const selected = props.modelValue.map(
          (id) => rows.value.find((r) => r.node.id === id)?.node.label ?? id,
        )
        return h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'sm',
            ...web(platform, { class: 'm-tree-select' }),
          }),
          () => [
            h(ui.Text, { text: props.label, variant: 'body', weight: '600' }),
            h(
              ui.Popover,
              {
                open: open.value,
                'onUpdate:open': (v: boolean) => (open.value = v),
                label: props.label,
                triggerLabel: selected.join(', ') || props.placeholder,
                disabled: props.disabled,
                width: 360,
              },
              () =>
                h(ui.Column, { gap: 'sm' }, () => [
                  h(ui.Input, {
                    label: props.searchLabel,
                    modelValue: query.value,
                    'onUpdate:modelValue': (v: string) => (query.value = v),
                    disabled: props.disabled,
                  }),
                  ...visible.value.map((row) =>
                    h(Row, { key: row.node.id, animated: props.animated }, () => [
                      row.depth
                        ? h(ui.Box, { width: row.depth * 16, accessibilityHidden: true })
                        : null,
                      row.node.children?.length
                        ? h(ui.Button, {
                            text: query.value || props.expanded.includes(row.node.id) ? '−' : '+',
                            variant: 'ghost',
                            size: 'sm',
                            accessibilityLabel: `${query.value || props.expanded.includes(row.node.id) ? props.collapseLabel : props.expandLabel}: ${row.node.label}`,
                            disabled: props.disabled || !!query.value,
                            ...web(platform, {
                              'aria-expanded':
                                !!query.value || props.expanded.includes(row.node.id),
                            }),
                            onClick: () => {
                              if (props.disabled) return
                              emit(
                                'update:expanded',
                                props.expanded.includes(row.node.id)
                                  ? props.expanded.filter((id) => id !== row.node.id)
                                  : [...props.expanded, row.node.id],
                              )
                            },
                          })
                        : h(ui.Box, { width: 24 }),
                      props.multiple
                        ? h(ui.Checkbox, {
                            label: row.node.label,
                            modelValue: props.modelValue.includes(row.node.id),
                            disabled:
                              props.disabled || row.disabled || row.node.selectable === false,
                            'onUpdate:modelValue': () => choose(row.node.id),
                          })
                        : h(ui.Button, {
                            text: row.node.label,
                            variant: props.modelValue.includes(row.node.id) ? 'secondary' : 'ghost',
                            disabled:
                              props.disabled || row.disabled || row.node.selectable === false,
                            ...(platform === 'native'
                              ? {
                                  accessibilityState: props.modelValue.includes(row.node.id)
                                    ? 'selected'
                                    : '',
                                }
                              : {}),
                            ...web(platform, {
                              'aria-pressed': props.modelValue.includes(row.node.id),
                            }),
                            onClick: () => choose(row.node.id),
                          }),
                    ]),
                  ),
                  !visible.value.length
                    ? h(ui.Text, { text: props.emptyLabel, tone: 'muted' })
                    : null,
                  h(ui.Button, {
                    text: props.clearLabel,
                    variant: 'ghost',
                    disabled: props.disabled || !props.modelValue.some(mutable),
                    onClick: () => {
                      if (!props.disabled)
                        emit(
                          'update:modelValue',
                          props.modelValue.filter((id) => !mutable(id)),
                        )
                    },
                  }),
                ]),
            ),
          ],
        )
      }
    },
  })
}
export function createMasonry(ui: AdvancedUI, platform: 'web' | 'native') {
  return defineComponent({
    name: 'MMasonry',
    inheritAttrs: false,
    props: masonryProps,
    setup(props, { attrs, slots }) {
      const width = ref(props.minColumnWidth),
        heights = ref(new Map<string, number>()),
        { theme } = useMavisTheme()
      const layout = computed(() =>
        masonryLayout(
          props.items,
          width.value,
          props.minColumnWidth,
          resolveSpace(theme.value, props.gap),
          props.columns,
          heights.value,
        ),
      )
      let measured = false
      const region = useComponentLayout(
        () => [props.items, layout.value],
        false,
        () => props.animated && measured,
      )
      watch(
        width,
        () => {
          measured = width.value > 0
        },
        { flush: 'post' },
      )
      watch(
        () => props.items,
        () => {
          const next = new Map(heights.value)
          for (const id of next.keys())
            if (!props.items.some((item) => item.id === id)) next.delete(id)
          heights.value = next
        },
      )
      function measure(id: string, height: number) {
        if (
          height >= 0 &&
          Number.isFinite(height) &&
          Math.abs((heights.value.get(id) ?? -1) - height) > 0.5
        )
          heights.value = new Map(heights.value).set(id, height)
      }
      return () =>
        h(
          ui.Host,
          mergeProps(attrs, {
            id: props.id,
            label: props.label,
            ...web(platform, { class: 'm-masonry' }),
          }),
          () =>
            h(
              ui.Measure,
              {
                onWidth: (v: number) => {
                  if (Math.abs(width.value - v) > 0.5) width.value = v
                },
              },
              () =>
                h(ui.Box, { motionRegion: region }, () => [
                  !props.items.length
                    ? h(ui.Text, { text: props.emptyLabel, tone: 'muted' })
                    : h(ui.Canvas, { height: layout.value.height }, () =>
                        layout.value.placements.map((item, index) =>
                          h(
                            ui.Cell,
                            {
                              ...item,
                              key: item.id,
                              measure: true,
                              height: undefined,
                              onHeight: (height: number) => measure(item.id, height),
                            },
                            () =>
                              slots.item?.({
                                item: props.items[index],
                                index,
                                width: item.width,
                              }) ?? h(ui.Text, { text: item.id }),
                          ),
                        ),
                      ),
                ]),
            ),
        )
    },
  })
}
export function createHeatmap(ui: AdvancedUI, platform: 'web' | 'native') {
  const Paint = createAdvancedPaint(ui)
  return defineComponent({
    name: 'MHeatmap',
    inheritAttrs: false,
    props: heatmapProps,
    emits: { 'update:modelValue': (_v: CivilDate) => true },
    setup(props, { attrs, emit }) {
      const uid = useId(),
        host = ref<AdvancedFocus>(),
        showData = ref(false)
      const geometry = computed(() =>
        heatmapCalendar(props.start, props.end, props.values, props.weekStartsOn),
      )
      function choose(date: CivilDate) {
        const cell = geometry.value.cells.find((c) => c.date === date)
        if (!props.disabled && cell && !cell.disabled) emit('update:modelValue', date)
      }
      const title = (cell: (typeof geometry.value.cells)[number]) =>
        `${cell.label ?? cell.date}: ${cell.value === null ? props.missingLabel : (props.formatValue?.(cell.value) ?? String(cell.value))}`
      function key(event: { key: string; preventDefault(): void }, index: number) {
        const delta: Record<string, number> = {
          ArrowUp: -1,
          ArrowDown: 1,
          ArrowLeft: -7,
          ArrowRight: 7,
          Home: -index,
          End: geometry.value.cells.length - 1 - index,
        }
        if (event.key in delta) {
          event.preventDefault()
          const cell =
            geometry.value.cells[
              Math.max(0, Math.min(geometry.value.cells.length - 1, index + delta[event.key]!))
            ]
          if (cell && !cell.disabled) host.value?.focus(`${uid}-${cell.date}`)
        }
      }
      return () => {
        if (!Number.isFinite(props.cellSize) || props.cellSize < 28 || props.cellSize > 80)
          throw new RangeError('Heatmap cellSize must be 28–80.')
        const g = geometry.value,
          step = props.cellSize + 4
        return h(
          ui.Host,
          mergeProps(attrs, {
            id: props.id,
            label: props.label,
            ref: host,
            ...web(platform, { class: 'm-heatmap' }),
          }),
          () =>
            h(ui.Column, { gap: 'md' }, () => [
              h(ui.Text, { text: props.label, variant: 'heading' }),
              h(ui.Scroll, {}, () =>
                h(ui.Canvas, { width: g.columns * step, height: 7 * step }, () =>
                  g.cells.map((cell, index) =>
                    h(
                      ui.Cell,
                      {
                        key: cell.date,
                        x: cell.column * step,
                        y: cell.row * step,
                        width: props.cellSize,
                        height: props.cellSize,
                      },
                      () =>
                        h(
                          Paint,
                          {
                            color: heatmapColor(cell.value, g.max, props.colors),
                            animated: props.animated,
                          },
                          () =>
                            h(ui.Button, {
                              id: `${uid}-${cell.date}`,
                              text: cell.missing ? '·' : props.modelValue === cell.date ? '✓' : ' ',
                              accessibilityLabel: title(cell),
                              variant: 'ghost',
                              size: 'sm',
                              height: props.cellSize,
                              width: props.cellSize,
                              disabled: props.disabled || cell.disabled,
                              ...(platform === 'native'
                                ? {
                                    accessibilityState:
                                      props.modelValue === cell.date ? 'selected' : '',
                                  }
                                : {}),
                              ...web(platform, {
                                'aria-pressed': props.modelValue === cell.date,
                                onKeydown: (e: { key: string; preventDefault(): void }) =>
                                  key(e, index),
                                style: {
                                  padding: 0,
                                  color: (() => {
                                    const color = heatmapColor(cell.value, g.max, props.colors)
                                    if (color === 'transparent') return undefined
                                    const rgb = [1, 3, 5]
                                      .map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
                                      .map((v) =>
                                        v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
                                      )
                                    return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]! >
                                      0.179
                                      ? '#000000'
                                      : '#FFFFFF'
                                  })(),
                                  border:
                                    props.modelValue === cell.date
                                      ? '2px solid currentColor'
                                      : undefined,
                                },
                              }),
                              onClick: () => choose(cell.date),
                            }),
                        ),
                    ),
                  ),
                ),
              ),
              h(ui.Row, { gap: 'xs', align: 'center' }, () => [
                h(ui.Text, { text: props.lessLabel, variant: 'caption' }),
                ...props.colors.map((color) =>
                  h(ui.Box, {
                    key: color,
                    width: 16,
                    height: 16,
                    radius: 'sm',
                    backgroundColor: color,
                    accessibilityHidden: true,
                  }),
                ),
                h(ui.Text, { text: props.moreLabel, variant: 'caption' }),
              ]),
              h(ui.Button, {
                text: props.dataLabel,
                variant: 'ghost',
                ...web(platform, { 'aria-expanded': showData.value }),
                onClick: () => (showData.value = !showData.value),
              }),
              showData.value
                ? h(ui.Column, { gap: 'xs' }, () =>
                    g.cells.map((cell) =>
                      h(ui.Button, {
                        key: cell.date,
                        text: title(cell),
                        variant: props.modelValue === cell.date ? 'secondary' : 'ghost',
                        disabled: props.disabled || cell.disabled,
                        onClick: () => choose(cell.date),
                      }),
                    ),
                  )
                : null,
            ]),
        )
      }
    },
  })
}
export function createNotificationCenter(ui: AdvancedUI, platform: 'web' | 'native') {
  return defineComponent({
    name: 'MNotificationCenter',
    inheritAttrs: false,
    props: notificationCenterProps,
    emits: {
      'update:modelValue': (_v: MavisNotification[]) => true,
      'update:filter': (_v: 'all' | 'unread') => true,
      action: (_id: string) => true,
    },
    setup(props, { attrs, emit }) {
      const uid = useId(),
        host = ref<AdvancedFocus>(),
        { theme } = useMavisTheme()
      const visible = computed(() =>
        props.modelValue.filter((item) => props.filter === 'all' || !item.read),
      )
      const region = useComponentLayout(
        () => [props.modelValue, props.filter],
        true,
        () => props.animated,
      )
      function change(ids: string[], action: 'read' | 'unread' | 'dismiss') {
        if (props.disabled) return
        emit('update:modelValue', updateNotifications(props.modelValue, ids, action))
        if (action === 'dismiss' || (action === 'read' && props.filter === 'unread'))
          void nextTick(() => host.value?.focus(`${uid}-filter`))
      }
      return () => {
        uniqueAdvanced(props.modelValue, 'NotificationCenter', 1000)
        if (props.modelValue.some((item) => !item.title.trim()))
          throw new TypeError('Notifications require a title.')
        const groups = [...new Set(visible.value.map((item) => item.group ?? props.ungroupedLabel))]
        return h(
          ui.Host,
          mergeProps(attrs, {
            id: props.id,
            label: props.label,
            ref: host,
            ...web(platform, { class: 'm-notification-center' }),
          }),
          () =>
            h(ui.Column, { gap: 'md', motionRegion: region }, () => [
              h(ui.Row, { gap: 'sm', align: 'center' }, () => [
                h(ui.Text, { text: props.label, variant: 'heading', grow: 1 }),
                h(ui.Text, {
                  text: String(props.modelValue.filter((item) => !item.read).length),
                  variant: 'body',
                  weight: '600',
                  accessibilityLabel: props.unreadLabel,
                }),
              ]),
              h(ui.Row, { gap: 'sm', wrap: true }, () => [
                h(ui.Button, {
                  id: `uid-${uid}-all`,
                  text: props.allLabel,
                  variant: props.filter === 'all' ? 'secondary' : 'ghost',
                  disabled: props.disabled,
                  ...(platform === 'native'
                    ? { accessibilityState: props.filter === 'all' ? 'selected' : '' }
                    : {}),
                  ...web(platform, { 'aria-pressed': props.filter === 'all' }),
                  onClick: () => {
                    if (!props.disabled) emit('update:filter', 'all')
                  },
                }),
                h(ui.Button, {
                  id: `${uid}-filter`,
                  text: props.unreadLabel,
                  variant: props.filter === 'unread' ? 'secondary' : 'ghost',
                  disabled: props.disabled,
                  ...(platform === 'native'
                    ? { accessibilityState: props.filter === 'unread' ? 'selected' : '' }
                    : {}),
                  ...web(platform, { 'aria-pressed': props.filter === 'unread' }),
                  onClick: () => {
                    if (!props.disabled) emit('update:filter', 'unread')
                  },
                }),
                h(ui.Button, {
                  text: props.readAllLabel,
                  variant: 'ghost',
                  disabled:
                    props.disabled ||
                    !props.modelValue.some((item) => !item.read && !item.disabled),
                  onClick: () =>
                    change(
                      props.modelValue.map((item) => item.id),
                      'read',
                    ),
                }),
              ]),
              !visible.value.length
                ? h(ui.Card, { padding: 'lg' }, () =>
                    h(ui.Text, { text: props.emptyLabel, tone: 'muted' }),
                  )
                : null,
              ...groups.map((group) =>
                h(ui.Column, { key: group, gap: 'sm' }, () => [
                  h(ui.Text, { text: group, variant: 'body', weight: '600', tone: 'muted' }),
                  ...visible.value
                    .filter((item) => (item.group ?? props.ungroupedLabel) === group)
                    .map((item) =>
                      h(
                        ui.Card,
                        {
                          key: item.id,
                          padding: 'md',
                          borderColor: item.read
                            ? theme.value.colors.border
                            : theme.value.colors.primary,
                        },
                        () =>
                          h(ui.Column, { gap: 'sm' }, () => [
                            h(ui.Text, { text: item.title, variant: 'heading' }),
                            item.description
                              ? h(ui.Text, { text: item.description, tone: 'muted' })
                              : null,
                            item.time
                              ? h(ui.Text, { text: item.time, variant: 'caption', tone: 'muted' })
                              : null,
                            h(
                              ui.Stack,
                              {
                                direction: 'column',
                                responsive: { at: 520, direction: 'row' },
                                gap: 'xs',
                              },
                              () => [
                                item.actionLabel
                                  ? h(ui.Button, {
                                      text: item.actionLabel,
                                      disabled: props.disabled || item.disabled,
                                      onClick: () => {
                                        if (!props.disabled && !item.disabled)
                                          emit('action', item.id)
                                      },
                                    })
                                  : null,
                                h(ui.Button, {
                                  text: item.read ? props.unreadActionLabel : props.readLabel,
                                  variant: 'ghost',
                                  disabled: props.disabled || item.disabled,
                                  accessibilityLabel: `${item.read ? props.unreadActionLabel : props.readLabel}: ${item.title}`,
                                  onClick: () => change([item.id], item.read ? 'unread' : 'read'),
                                }),
                                item.dismissible !== false
                                  ? h(ui.Button, {
                                      text: props.dismissLabel,
                                      variant: 'ghost',
                                      disabled: props.disabled || item.disabled,
                                      accessibilityLabel: `${props.dismissLabel}: ${item.title}`,
                                      onClick: () => change([item.id], 'dismiss'),
                                    })
                                  : null,
                              ],
                            ),
                          ]),
                      ),
                    ),
                ]),
              ),
            ]),
        )
      }
    },
  })
}
