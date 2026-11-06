import {
  computed,
  defineComponent,
  h,
  markRaw,
  mergeProps,
  onScopeDispose,
  ref,
  watch,
  type Component,
} from '@vue/runtime-core'
import { dashboardNumber, donutGeometry, donutPath, sparklineGeometry } from '../dashboard.js'
import { createMotionSurface, type MotionShape } from '../experimental.js'
import { componentMotion } from '../motion.js'
import { dashboardShapeProps, donutChartProps, sparklineProps } from './dashboard-props.js'
import { useMavisTheme } from './theme.js'

export interface DashboardUI {
  Box: Component
  Column: Component
  Row: Component
  Stack: Component
  Text: Component
  Button: Component
  NumberFlow: Component
  Shape: Component
  Environment: Component
  Plot: Component
}
/** Same Jolt shape presentation on SVG and native layers, with canonical SSR fallback. */
export function createDashboardShape(
  Box: Component,
  Fallback: Component,
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MDashboardShape',
    inheritAttrs: false,
    props: dashboardShapeProps,
    setup(props, { attrs }) {
      const { theme } = useMavisTheme(),
        surface = markRaw(createMotionSurface()),
        ready = ref(false)
      let shape: MotionShape | undefined
      onScopeDispose(
        surface.use((owner) => {
          const stop = watch(
            () => [...props.viewBox, props.color, props.strokeWidth].join('|'),
            () => {
              shape?.dispose()
              shape = undefined
              ready.value = false
              if (!owner.supports('shape')) return
              shape = owner.shape({
                d: props.d,
                viewBox: props.viewBox,
                stroke: props.color,
                fill: 'transparent',
                strokeWidth: props.strokeWidth,
                lineCap: 'round',
                lineJoin: 'round',
                strokeStart: props.start,
                strokeEnd: props.animated ? props.start : props.end,
              })
              ready.value = true
              if (props.animated)
                shape.animate({ strokeEnd: props.end }, componentMotion(theme.value, 'data'))
            },
            { immediate: true },
          )
          return () => {
            stop()
            shape?.dispose()
            shape = undefined
            ready.value = false
          }
        }),
      )
      watch(
        () => [props.d, props.start, props.end, props.animated] as const,
        (next, previous) => {
          if (!shape) return
          const values = { d: props.d, strokeStart: props.start, strokeEnd: props.end }
          // Different null gaps/point counts cannot be interpolated as one path.
          const compatible =
            previous?.[0].replace(/[^MLAZ]/g, '') === next[0].replace(/[^MLAZ]/g, '')
          if (props.animated && compatible)
            shape.animate(values, componentMotion(theme.value, 'data'))
          else {
            shape.stop()
            shape.set(values)
          }
        },
      )
      return () =>
        h(
          Box,
          mergeProps(attrs, {
            motionSurface: surface,
            width: '100%',
            height: '100%',
            accessibilityHidden: true,
            ...(platform === 'web'
              ? {
                  style: {
                    gridArea: '1 / 1',
                    pointerEvents: 'none',
                    minWidth: 0,
                    minHeight: 0,
                    position: 'relative',
                    overflow: 'hidden',
                  },
                }
              : { isUserInteractionEnabled: false }),
          }),
          () => h(Fallback, { ...props, hidden: ready.value }),
        )
    },
  })
}
export function createDonutChart(ui: DashboardUI, platform: 'web' | 'native') {
  return defineComponent({
    name: 'MDonutChart',
    inheritAttrs: false,
    props: donutChartProps,
    emits: { 'update:modelValue': (_value: string | null) => true },
    setup(props, { attrs, emit }) {
      const { theme } = useMavisTheme(),
        geometry = computed(() => donutGeometry(props.segments))
      const format = (n: number) => props.formatValue?.(n) ?? String(Math.round(n * 100) / 100)
      return () => {
        dashboardNumber(props.size, 100, 800, 'size')
        dashboardNumber(props.strokeWidth, 1, 20, 'strokeWidth')
        const selected = geometry.value.segments.find((s) => s.id === props.modelValue)
        const palette = [
          theme.value.colors.primary,
          '#51847B',
          '#BF733E',
          '#6366A4',
          '#B75959',
          '#527F9C',
        ]
        return h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'md',
            ...(platform === 'web'
              ? { class: 'm-donut-chart', role: 'group', 'aria-label': props.label }
              : { accessibilityLabel: props.label }),
          }),
          () => [
            h(ui.Text, { text: props.label, variant: 'heading' }),
            h(
              ui.Box,
              {
                width: props.size,
                height: props.size,
                ...(platform === 'web'
                  ? {
                      style: {
                        display: 'grid',
                        maxWidth: '100%',
                        aspectRatio: '1',
                        height: 'auto',
                      },
                    }
                  : {}),
                accessibilityHidden: true,
              },
              () => [
                h(ui.Shape, {
                  d: donutPath,
                  viewBox: [0, 0, 100, 100],
                  color: theme.value.colors.border,
                  strokeWidth: props.strokeWidth,
                  animated: false,
                }),
                ...geometry.value.segments
                  .filter((s) => s.ratio > 0)
                  .map((s) => {
                    const index = props.segments.findIndex((v) => v.id === s.id),
                      gap = Math.min(s.ratio / 4, 0.008)
                    return h(ui.Shape, {
                      key: s.id,
                      d: donutPath,
                      viewBox: [0, 0, 100, 100],
                      color: s.color ?? palette[index % palette.length],
                      strokeWidth: props.strokeWidth + (selected?.id === s.id ? 2 : 0),
                      start: s.start + gap,
                      end: s.end - gap,
                      animated: props.animated,
                      ...(platform === 'web'
                        ? { style: { opacity: selected && selected.id !== s.id ? 0.35 : 1 } }
                        : { opacity: selected && selected.id !== s.id ? 0.35 : 1 }),
                    })
                  }),
                h(
                  ui.Column,
                  {
                    align: 'center',
                    justify: 'center',
                    ...(platform === 'web'
                      ? { style: { gridArea: '1 / 1', pointerEvents: 'none' } }
                      : { verticalAlignment: 'middle' }),
                  },
                  () => [
                    h(ui.NumberFlow, {
                      value: selected?.value ?? geometry.value.total,
                      animated: props.animated && props.animateNumber,
                      formatValue: format,
                      variant: 'display',
                    }),
                    h(ui.Text, {
                      text: selected?.label ?? props.totalLabel,
                      variant: 'caption',
                      tone: 'muted',
                    }),
                  ],
                ),
              ],
            ),
            h(ui.Text, {
              text: `${props.totalLabel}: ${format(geometry.value.total)}`,
              variant: 'caption',
              ...(platform === 'web' ? { 'aria-live': 'polite', class: 'm-sr-only' } : {}),
            }),
            geometry.value.total === 0
              ? h(ui.Text, { text: props.emptyLabel, tone: 'muted' })
              : null,
            ...geometry.value.segments.map((s, index) =>
              h(
                ui.Button,
                {
                  key: s.id,
                  text: `${s.label} · ${format(s.value)} · ${Math.round(s.ratio * 100)}%`,
                  variant: selected?.id === s.id ? 'secondary' : 'ghost',
                  disabled: props.disabled,
                  ...(platform === 'web'
                    ? { 'aria-pressed': selected?.id === s.id }
                    : { accessibilityState: { selected: selected?.id === s.id } }),
                  onClick: () => {
                    if (!props.disabled)
                      emit('update:modelValue', selected?.id === s.id ? null : s.id)
                  },
                },
                {
                  leading: () =>
                    h(ui.Box, {
                      width: 10,
                      height: 10,
                      radius: 'full',
                      backgroundColor: s.color ?? palette[index % palette.length],
                      accessibilityHidden: true,
                    }),
                },
              ),
            ),
          ],
        )
      }
    },
  })
}
export function createSparkline(ui: DashboardUI, platform: 'web' | 'native') {
  return defineComponent({
    name: 'MSparkline',
    inheritAttrs: false,
    props: sparklineProps,
    setup(props, { attrs }) {
      const { theme } = useMavisTheme(),
        open = ref(false),
        width = ref(100)
      const geometry = computed(() =>
        sparklineGeometry(props.points, props.domain, width.value, props.height),
      )
      return () => {
        dashboardNumber(props.height, 24, 240, 'height')
        const data = props.points.filter((p) => p.value !== null),
          last = data.at(-1),
          first = data[0]
        const format = (n: number) => props.formatValue?.(n) ?? String(n)
        const summary =
          last && first
            ? `${props.label}: ${format(last.value!)} (${first.label}: ${format(first.value!)}, ${last.label}: ${format(last.value!)})`
            : `${props.label}: ${props.emptyLabel}`
        return h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'xs',
            ...(platform === 'web'
              ? { class: 'm-sparkline', role: 'group', 'aria-label': props.label }
              : { accessibilityLabel: props.label }),
          }),
          () => [
            h(
              ui.Plot,
              {
                height: props.height,
                onWidth: (value: number) => {
                  if (Number.isFinite(value) && value > 0) width.value = value
                },
                width: '100%',
                accessibilityHidden: true,
                ...(platform === 'web' ? { style: { display: 'grid', minWidth: 0 } } : {}),
              },
              () =>
                geometry.value.paths.map((path) =>
                  h(ui.Shape, {
                    key: path.id,
                    d: path.d,
                    viewBox: [0, 0, width.value, props.height],
                    color: props.color ?? theme.value.colors.primary,
                    strokeWidth: 2.5,
                    animated: props.animated,
                  }),
                ),
            ),
            h(ui.Text, { text: summary, variant: 'caption', tone: 'muted' }),
            h(ui.Button, {
              text: props.dataLabel,
              size: 'sm',
              variant: 'ghost',
              ...(platform === 'web' ? { 'aria-expanded': open.value || props.showData } : {}),
              onClick: () => {
                open.value = !open.value
              },
            }),
            open.value || props.showData
              ? h(ui.Column, { gap: 'xs' }, () =>
                  props.points.map((p) =>
                    h(ui.Text, {
                      key: p.id,
                      text: `${p.label}: ${p.value === null ? '—' : format(p.value)}`,
                      variant: 'caption',
                    }),
                  ),
                )
              : null,
          ],
        )
      }
    },
  })
}
