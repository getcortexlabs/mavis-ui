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
  type PropType,
} from '@vue/runtime-core'
import { chartGeometry, type ChartGeometry, type ChartSelection } from '../chart.js'
import { choiceKey, type ChoiceValue } from '../choice.js'
import { createMotionSurface } from '../experimental.js'
import { chartProps } from './wayfinding-props.js'
import { useMavisTheme } from './theme.js'

export const chartPlotProps = {
  geometry: { type: Object as PropType<ChartGeometry>, required: true as const },
  colors: { type: Array as PropType<readonly string[]>, required: true as const },
  type: { type: String as PropType<'line' | 'bar'>, required: true as const },
  height: { type: Number, required: true as const },
  selected: {
    type: Object as PropType<{ category: number; series: number } | null>,
    default: null,
  },
  disabled: Boolean,
}
export function createChart(
  ui: {
    Row: Component
    Column: Component
    Box: Component
    Text: Component
    Button: Component
    Reveal: Component
    Select: Component
    Plot: Component
  },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MChart',
    inheritAttrs: false,
    props: chartProps,
    emits: {
      'update:modelValue': (_selection: ChartSelection | null) => true,
      'update:hiddenSeries': (_keys: ChoiceValue[]) => true,
    },
    setup(props, { attrs, emit }) {
      const web = platform === 'web'
      const { theme } = useMavisTheme()
      const dataOpen = ref(props.showData)
      watch(
        () => props.showData,
        (value) => {
          dataOpen.value = value
        },
      )
      const allGeometry = computed(() =>
        chartGeometry(props.categories, props.series, props.domain),
      )
      const visible = computed(() =>
        props.series.filter((series) => !props.hiddenSeries.includes(series.key)),
      )
      const geometry = computed(() => ({
        ...allGeometry.value,
        series: allGeometry.value.series.filter(
          (series) => !props.hiddenSeries.includes(series.key),
        ),
      }))
      const selected = computed(() => {
        if (!props.modelValue) return null
        const category = props.categories.findIndex(
          (item) => item.key === props.modelValue!.category,
        )
        const series = visible.value.findIndex((item) => item.key === props.modelValue!.series)
        return category < 0 || series < 0 ? null : { category, series }
      })
      const format = (value: number | null | undefined) =>
        value == null ? props.missingLabel : (props.formatValue?.(value) ?? String(value))
      const colors = computed(() => {
        const palette = [
          theme.value.colors.primary,
          theme.value.colors.accent,
          theme.value.colors.success,
          theme.value.colors.warning,
          theme.value.colors.danger,
          theme.value.colors.muted,
          theme.value.colors.text,
          theme.value.colors.border,
        ]
        return visible.value.map(
          (series) => series.color ?? palette[props.series.indexOf(series) % palette.length]!,
        )
      })
      const summary = computed(() => {
        const point = selected.value
        if (!point) return props.description ?? props.label
        const series = visible.value[point.series]!
        return `${props.categories[point.category]!.label} · ${series.label}: ${format(series.values[point.category])}`
      })
      function choose(category: number, series: number) {
        if (props.disabled || !props.categories[category] || !visible.value[series]) return
        emit('update:modelValue', {
          category: props.categories[category]!.key,
          series: visible.value[series]!.key,
        })
      }
      const surface = markRaw(createMotionSurface())
      function animate() {
        if (surface.available)
          surface.animate(
            { opacity: [0.35, 1], y: [6, 0] },
            { duration: theme.value.motion.enterDuration, ease: 'easeOut' },
          )
      }
      onScopeDispose(surface.use(animate))
      return () => {
        if (!props.label.trim()) throw new TypeError('Chart requires a label.')
        if (!Number.isFinite(props.height) || props.height < 120 || props.height > 800)
          throw new RangeError('Chart height must be between 120 and 800.')
        if (!['line', 'bar'].includes(props.type))
          throw new TypeError('Chart type must be line or bar.')
        // Validate hidden series too; toggling a legend must never reveal invalid data.
        const domain = allGeometry.value
        const hasData = geometry.value.series.some((series) => series.points.some(Boolean))
        return h(
          ui.Column,
          mergeProps({ id: props.id, gap: 'md' }, attrs, {
            class: 'm-chart',
            ...(web ? { role: 'group', 'aria-label': props.label } : {}),
          }),
          () => [
            h(ui.Column, { gap: 'xs' }, () => [
              h(ui.Text, { text: props.label, as: 'h2', variant: 'heading' }),
              props.description
                ? h(ui.Text, { text: props.description, tone: 'muted', variant: 'caption' })
                : null,
            ]),
            h(ui.Row, { gap: 'xs', wrap: true }, () =>
              props.series.map((series) => {
                const shown = !props.hiddenSeries.includes(series.key)
                return h(
                  ui.Button,
                  {
                    key: choiceKey(series.key),
                    text: series.label,
                    variant: shown ? 'secondary' : 'ghost',
                    size: 'sm',
                    disabled: props.disabled,
                    ...(web
                      ? { 'aria-pressed': shown }
                      : { accessibilityState: shown ? 'selected' : '' }),
                    onClick: () => {
                      if (!props.disabled)
                        emit(
                          'update:hiddenSeries',
                          shown
                            ? [...props.hiddenSeries, series.key]
                            : props.hiddenSeries.filter((key) => key !== series.key),
                        )
                    },
                  },
                  {
                    leading: () =>
                      h(ui.Box, {
                        width: 8,
                        height: 8,
                        radius: 'full',
                        backgroundColor: shown
                          ? colors.value[visible.value.indexOf(series)]
                          : theme.value.colors.border,
                        accessibilityHidden: true,
                      }),
                  },
                )
              }),
            ),
            // An exact native column prevents measured plot shapes from expanding their own viewport.
            h(
              web ? ui.Row : 'GridLayout',
              web ? { gap: 'xs', align: 'stretch' } : { columns: '56, *', height: props.height },
              () => [
                h(
                  ui.Column,
                  { col: 0, justify: 'between', width: 56, shrink: 0, height: props.height },
                  () =>
                    [...domain.ticks].reverse().map((value, index) =>
                      h(ui.Text, {
                        key: index,
                        text: format(value),
                        variant: 'caption',
                        tone: 'muted',
                        align: 'right',
                      }),
                    ),
                ),
                h(
                  ui.Box,
                  { col: 1, grow: 1, shrink: 1, height: props.height, motionSurface: surface },
                  () =>
                    hasData
                      ? h(ui.Plot, {
                          geometry: geometry.value,
                          colors: colors.value,
                          type: props.type,
                          height: props.height,
                          selected: selected.value,
                          disabled: props.disabled,
                          onSelect: choose,
                        })
                      : h(
                          ui.Column,
                          { height: props.height, justify: 'center', align: 'center' },
                          () => h(ui.Text, { text: props.emptyLabel, tone: 'muted' }),
                        ),
                ),
              ],
            ),
            props.categories.length
              ? h(ui.Row, { justify: 'between', gap: 'sm' }, () => [
                  h(ui.Text, {
                    text: props.categories[0]!.label,
                    variant: 'caption',
                    tone: 'muted',
                  }),
                  props.categories.length > 1
                    ? h(ui.Text, {
                        text: props.categories[props.categories.length - 1]!.label,
                        variant: 'caption',
                        tone: 'muted',
                        align: 'right',
                      })
                    : null,
                ])
              : null,
            h(ui.Text, {
              text: summary.value,
              weight: '600',
              ...(web
                ? { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }
                : { accessibilityLiveRegion: 'polite' }),
            }),
            props.categories.length && visible.value.length
              ? h(ui.Row, { gap: 'sm', wrap: true }, () => [
                  h(ui.Select, {
                    label: props.categoryLabel,
                    placeholder: props.categoryLabel,
                    grow: 1,
                    shrink: 1,
                    options: props.categories.map((item) => ({
                      value: item.key,
                      label: item.label,
                    })),
                    modelValue: props.modelValue?.category ?? null,
                    disabled: props.disabled,
                    'onUpdate:modelValue': (key: ChoiceValue) =>
                      choose(
                        props.categories.findIndex((item) => item.key === key),
                        selected.value?.series ?? 0,
                      ),
                  }),
                  h(ui.Select, {
                    label: props.seriesLabel,
                    grow: 1,
                    shrink: 1,
                    options: visible.value.map((item) => ({ value: item.key, label: item.label })),
                    modelValue: visible.value[selected.value?.series ?? 0]!.key,
                    disabled: props.disabled,
                    'onUpdate:modelValue': (key: ChoiceValue) =>
                      choose(
                        selected.value?.category ?? 0,
                        visible.value.findIndex((item) => item.key === key),
                      ),
                  }),
                ])
              : null,
            h(ui.Row, { gap: 'sm', wrap: true }, () => [
              h(ui.Button, {
                text: dataOpen.value ? props.hideDataLabel : props.showDataLabel,
                icon: 'table-2',
                variant: 'ghost',
                ...(web ? { 'aria-expanded': dataOpen.value } : {}),
                onClick: () => {
                  dataOpen.value = !dataOpen.value
                },
              }),
              selected.value
                ? h(ui.Button, {
                    text: props.clearLabel,
                    variant: 'ghost',
                    disabled: props.disabled,
                    onClick: () => {
                      if (!props.disabled) emit('update:modelValue', null)
                    },
                  })
                : null,
            ]),
            h(ui.Reveal, { show: dataOpen.value, gap: 'sm' }, () =>
              h(
                ui.Column,
                { gap: 'sm', ...(web ? { role: 'list', 'aria-label': props.showDataLabel } : {}) },
                () =>
                  props.categories.map((category, index) =>
                    h(
                      ui.Column,
                      {
                        key: choiceKey(category.key),
                        gap: 'xs',
                        padding: 'sm',
                        radius: 'md',
                        backgroundColor: theme.value.colors.surface,
                        ...(web ? { role: 'listitem' } : {}),
                      },
                      () => [
                        h(ui.Text, { text: category.label, weight: '600' }),
                        ...props.series.map((series) =>
                          h(ui.Text, {
                            key: choiceKey(series.key),
                            text: `${series.label}: ${format(series.values[index])}`,
                            variant: 'caption',
                            tone: 'muted',
                          }),
                        ),
                      ],
                    ),
                  ),
              ),
            ),
          ],
        )
      }
    },
  })
}
