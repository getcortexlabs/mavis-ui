import {
  computed,
  defineComponent,
  h,
  mergeProps,
  ref,
  watch,
  type Component,
} from '@vue/runtime-core'
import { calendarProps, ratingProps } from './discovery-props.js'
import { ratingValue } from '../discovery.js'
import {
  civilDate,
  dateAvailability,
  validateDateConstraints,
  validateDateRangeDraft,
  type CivilDate,
  type DateRange,
} from '../date.js'
import { useMavisTheme } from './theme.js'

interface Primitives {
  Column: Component
  Row: Component
  Text: Component
  Button: Component
  Icon: Component
  Slider: Component
  Calendar: Component
}
function initialCalendarDate(
  value: CivilDate | null,
  props: { min?: CivilDate; max?: CivilDate; initialMonth: string },
) {
  let date = value ?? props.min ?? civilDate(`${props.initialMonth}-01`)
  if (props.min && date < props.min) date = props.min
  if (props.max && date > props.max) date = props.max
  return date
}
export function createDiscoveryControls(ui: Primitives, platform: 'web' | 'native') {
  const MCalendar = defineComponent({
    name: 'MCalendar',
    inheritAttrs: false,
    props: calendarProps,
    emits: {
      'update:modelValue': (_value: CivilDate | DateRange | null) => true,
      invalid: () => true,
    },
    setup(props, { attrs, emit, slots }) {
      const { theme } = useMavisTheme()
      const selected = computed(() =>
        typeof props.modelValue === 'string' ? civilDate(props.modelValue) : null,
      )
      const range = computed(() =>
        typeof props.modelValue === 'object' && props.modelValue !== null
          ? props.modelValue
          : { start: null, end: null },
      )
      const active = ref<CivilDate>(initialCalendarDate(selected.value ?? range.value.start, props))
      const invalid = ref(false)
      watch(
        () => [props.modelValue, props.initialMonth],
        () => {
          active.value = initialCalendarDate(
            selected.value ?? range.value.end ?? range.value.start,
            props,
          )
          invalid.value = false
        },
      )
      function select(date: CivilDate) {
        if (props.disabled || props.readonly || dateAvailability(date, props)) return
        invalid.value = false
        if (props.mode === 'single') emit('update:modelValue', date)
        else if (!range.value.start || range.value.end)
          emit('update:modelValue', { start: date, end: null })
        else {
          const next =
            date < range.value.start
              ? { start: date, end: range.value.start }
              : { start: range.value.start, end: date }
          if (!validateDateRangeDraft({ start: next.start, end: next.end }, props).valid) {
            invalid.value = true
            emit('invalid')
          } else emit('update:modelValue', next)
        }
      }
      return () => {
        validateDateConstraints(props)
        if (
          props.mode === 'single' &&
          props.modelValue !== null &&
          typeof props.modelValue !== 'string'
        )
          throw new TypeError('Single calendars require a civil date.')
        if (props.mode === 'range' && typeof props.modelValue === 'string')
          throw new TypeError('Range calendars require start and end.')
        for (const date of [range.value.start, range.value.end]) if (date !== null) civilDate(date)
        return h(
          ui.Column,
          mergeProps(
            {
              id: props.id,
              gap: 'md',
              padding: 'sm',
              radius: 'lg',
              backgroundColor: theme.value.colors.surface,
            },
            attrs,
            platform === 'web'
              ? { role: 'group', 'aria-label': props.label, class: 'm-calendar' }
              : {},
          ),
          () => [
            h(ui.Text, { as: 'h2', variant: 'heading', text: props.label }),
            h(ui.Calendar, {
              ...props,
              autofocus: false,
              activeDate: active.value,
              selected: selected.value,
              rangeStart: range.value.start,
              rangeEnd: range.value.end,
              'onUpdate:activeDate': (date: CivilDate) => {
                active.value = date
              },
              onSelect: select,
            }),
            invalid.value
              ? h(ui.Text, {
                  text: props.invalidRangeLabel,
                  tone: 'danger',
                  ...(platform === 'web'
                    ? { role: 'alert' }
                    : { accessibilityLiveRegion: 'assertive' }),
                })
              : null,
            slots.footer?.(),
          ],
        )
      }
    },
  })
  const MRating = defineComponent({
    name: 'MRating',
    inheritAttrs: false,
    props: ratingProps,
    emits: { 'update:modelValue': (_value: number) => true },
    setup(props, { attrs, emit }) {
      const value = computed(() => ratingValue(props.modelValue, props.max, props.step))
      const label = (next: number) =>
        props.formatValue?.(next, props.max) ?? `${next} / ${props.max}`
      function choose(next: number) {
        if (!props.readonly && !props.disabled && next !== value.value)
          emit('update:modelValue', ratingValue(next, props.max, props.step))
      }
      return () =>
        h(
          ui.Column,
          mergeProps(
            { id: props.id, gap: 'sm' },
            attrs,
            platform === 'web'
              ? { class: 'm-rating', role: 'group', 'aria-label': props.label }
              : {},
          ),
          () => [
            h(ui.Row, { justify: 'between', gap: 'sm', wrap: true }, () => [
              h(ui.Text, { text: props.label, weight: '600' }),
              h(ui.Text, { text: label(value.value), tone: 'muted', variant: 'caption' }),
            ]),
            h(ui.Row, { gap: 'xs', wrap: true }, () =>
              Array.from({ length: props.max }, (_, index) => {
                const filled = value.value >= index + 1
                const half = value.value > index && !filled
                const icon = half ? 'star-half' : 'star'
                return props.readonly
                  ? h(ui.Icon, {
                      key: index,
                      name: icon,
                      size: 28,
                      tone: filled || half ? 'primary' : 'muted',
                      accessibilityHidden: true,
                    })
                  : h(ui.Button, {
                      key: index,
                      icon,
                      variant: filled || half ? 'primary' : 'secondary',
                      disabled: props.disabled,
                      accessibilityLabel: `${props.label}: ${label(index + 1)}`,
                      onClick: () => choose(index + 1),
                    })
              }),
            ),
            !props.readonly && props.step === 0.5
              ? h(ui.Slider, {
                  modelValue: value.value,
                  min: 0,
                  max: props.max,
                  step: props.step,
                  label: props.label,
                  disabled: props.disabled,
                  'onUpdate:modelValue': choose,
                })
              : null,
            props.clearable && !props.readonly
              ? h(ui.Button, {
                  text: props.clearLabel,
                  variant: 'ghost',
                  disabled: props.disabled || value.value === 0,
                  onClick: () => choose(0),
                })
              : null,
          ],
        )
    },
  })
  return { MCalendar, MRating }
}
