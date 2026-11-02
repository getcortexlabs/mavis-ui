import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
  type Component,
  type ExtractPropTypes,
} from '@vue/runtime-core'
import {
  civilDate,
  dateLocales,
  dateValidationMessage,
  isCivilDate,
  validateDateConstraints,
  validateDateDraft,
  validateDateRangeDraft,
  type CivilDate,
  type DateRange,
  type DateRangeDraft,
  type DateValidation,
} from '../date.js'
import type { InputHandle } from '../input.js'
import {
  datePickerProps,
  datePickerEmits,
  dateRangePickerProps,
  dateRangePickerEmits,
} from './date-props.js'
import { useButtonAction } from './button-content.js'

type EntryProps = Omit<ExtractPropTypes<typeof dateRangePickerProps>, 'modelValue'> & {
  modelValue: CivilDate | null | DateRange
  name?: string
}
interface DatePrimitives {
  Input: Component
  Button: Component
  Column: Component
  Row: Component
  Sheet: Component
  Calendar: Component
  /** Internal adapter boundary: capture a focusable opener and dismiss the native keyboard. */
  beforeOpen(opener: unknown): void
  afterClose(opener: unknown): void
}
interface EntryEvents {
  model(value: CivilDate | null | DateRange): void
  draft(value: string | DateRangeDraft): void
  validity(value: DateValidation): void
  focus(): void
  blur(): void
}

/** @internal One Vue editing contract, composed with each renderer's existing primitives. */
export function createDatePickers(primitives: DatePrimitives) {
  const { Input, Button, Column, Row, Sheet, Calendar } = primitives
  function useEntry(props: EntryProps, range: boolean, events: EntryEvents) {
    useButtonAction()
    const start = ref('')
    const end = ref('')
    const touched = ref(false)
    const open = ref(false)
    const endpoint = ref<'start' | 'end'>('start')
    const activeDate = ref<CivilDate>('2000-01-01')
    const first = ref<InputHandle>()
    const second = ref<InputHandle>()
    const firstOpener = ref<unknown>()
    const secondOpener = ref<unknown>()
    let alive = true
    let revision = 0
    let returnFocus = true
    const words = computed(() => {
      if (!Object.hasOwn(dateLocales, props.locale))
        throw new RangeError('Date locale must be en-US or pt-BR')
      return dateLocales[props.locale]
    })
    function snapshot(): DateRangeDraft {
      if (range) {
        const value = props.modelValue as DateRange
        if (!value || typeof value !== 'object')
          throw new RangeError('A date range needs start and end endpoints')
        for (const date of [value.start, value.end]) if (date !== null) civilDate(date)
        return { start: value.start ?? '', end: value.end ?? '' }
      }
      if (props.modelValue !== null) civilDate(props.modelValue as string)
      return { start: (props.modelValue as CivilDate | null) ?? '', end: '' }
    }
    function restore() {
      const value = snapshot()
      start.value = value.start
      end.value = value.end
    }
    restore()
    watch(
      () => props.modelValue,
      () => {
        revision++
        restore()
      },
      { deep: true },
    )
    const validity = computed(() => {
      validateDateConstraints(props)
      return range
        ? validateDateRangeDraft({ start: start.value, end: end.value }, props)
        : validateDateDraft(start.value, props)
    })
    watch(validity, (value, previous) => {
      if (JSON.stringify(value) !== JSON.stringify(previous)) events.validity(value)
    })
    watch(
      () => props.disabled || props.readonly,
      (blocked) => {
        if (blocked) close(false)
      },
    )
    onBeforeUnmount(() => {
      alive = false
      revision++
    })
    function close(restoreFocus = true) {
      if (!open.value) return
      open.value = false
      returnFocus = restoreFocus
    }
    function edit(which: 'start' | 'end', value: string) {
      if (props.disabled || props.readonly) return
      if (which === 'start') start.value = value
      else end.value = value
      propose()
    }
    function propose() {
      const current = ++revision
      const draft = { start: start.value, end: end.value }
      events.draft(range ? { ...draft } : draft.start)
      if (!validity.value.valid) return
      const previous = snapshot()
      if (previous.start === draft.start && previous.end === draft.end) return
      events.model(
        range
          ? {
              start: draft.start ? civilDate(draft.start) : null,
              end: draft.end ? civilDate(draft.end) : null,
            }
          : draft.start
            ? civilDate(draft.start)
            : null,
      )
      // A model proposal is controlled. Invalid/incomplete drafts remain local; a rejected
      // valid proposal returns to the parent's value without manufacturing another edit.
      void nextTick(() => {
        if (alive && revision === current) restore()
      })
    }
    function show(which: 'start' | 'end') {
      if (props.disabled || props.readonly || open.value) return
      endpoint.value = which
      const draft = which === 'end' ? end.value : start.value
      let target = isCivilDate(draft) ? draft : (props.min ?? civilDate(`${props.initialMonth}-01`))
      if (props.min && target < props.min) target = props.min
      if (props.max && target > props.max) target = props.max
      activeDate.value = target
      primitives.beforeOpen(which === 'end' ? secondOpener.value : firstOpener.value)
      open.value = true
    }
    const handle: InputHandle = {
      focus: () => {
        if (!props.disabled) first.value?.focus()
      },
      blur: () => {
        first.value?.blur()
        second.value?.blur()
      },
    }
    function render(attrs: Record<string, unknown>) {
      if (!props.label.trim()) throw new RangeError('A date picker needs a visible label')
      for (const name of [
        'calendarLabel',
        'clearLabel',
        'closeLabel',
        'startLabel',
        'endLabel',
      ] as const) {
        if (props[name] !== undefined && !props[name]!.trim())
          throw new RangeError(`${name} must not be blank`)
      }
      civilDate(`${props.initialMonth}-01`)
      if (
        props.firstDayOfWeek !== undefined &&
        (!Number.isInteger(props.firstDayOfWeek) ||
          props.firstDayOfWeek < 0 ||
          props.firstDayOfWeek > 6)
      )
        throw new RangeError('firstDayOfWeek must be an integer from 0 to 6')
      const translations = words.value
      const label = (which: 'start' | 'end') =>
        range
          ? `${props.label} · ${which === 'start' ? (props.startLabel ?? translations.start) : (props.endLabel ?? translations.end)}`
          : props.label
      const startValidation = validateDateDraft(start.value, props)
      const endValidation = validateDateDraft(end.value, props)
      const startError =
        touched.value || start.value.length >= 10
          ? dateValidationMessage(startValidation, props.locale)
          : ''
      const endError =
        touched.value || end.value.length >= 10
          ? dateValidationMessage(endValidation, props.locale)
          : ''
      const rangeError =
        startValidation.valid && endValidation.valid
          ? dateValidationMessage(validity.value, props.locale)
          : ''
      const field = (which: 'start' | 'end') =>
        h(
          Row,
          { gap: 'sm', align: 'end' },
          {
            default: () => [
              h(Input, {
                ref: which === 'start' ? first : second,
                id: props.id ? `${props.id}${range ? `-${which}` : ''}` : undefined,
                grow: 1,
                shrink: 1,
                label: label(which),
                modelValue: which === 'start' ? start.value : end.value,
                name: range ? (which === 'start' ? props.startName : props.endName) : props.name,
                type: 'text',
                placeholder: translations.format,
                autocapitalize: 'none',
                autocorrect: false,
                disabled: props.disabled,
                readonly: props.readonly,
                helperText: !range || which === 'end' ? props.helperText : '',
                error: !range
                  ? props.error || startError
                  : which === 'start'
                    ? startError
                    : props.error || endError || rangeError,
                'onUpdate:modelValue': (value: string) => edit(which, value),
                onFocus: events.focus,
                onBlur: () => {
                  touched.value = true
                  events.blur()
                },
              }),
              h(Button, {
                ref: which === 'start' ? firstOpener : secondOpener,
                icon: 'calendar-days',
                variant: 'secondary',
                accessibilityLabel: `${props.calendarLabel ?? translations.calendar}: ${label(which)}`,
                disabled: props.disabled || props.readonly,
                onClick: () => show(which),
              }),
            ],
          },
        )
      return h(
        Column,
        mergeProps(attrs, {
          gap: 'sm',
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          accessibilityHidden: props.accessibilityHidden,
          onUnloaded: () => close(false),
        }),
        {
          default: () => [
            field('start'),
            range ? field('end') : null,
            props.clearable
              ? h(Button, {
                  text: props.clearLabel ?? `${translations.clear}: ${props.label}`,
                  variant: 'ghost',
                  size: 'sm',
                  disabled: props.disabled || props.readonly || (!start.value && !end.value),
                  onClick: () => {
                    if (props.disabled || props.readonly) return
                    start.value = ''
                    end.value = ''
                    touched.value = false
                    propose()
                  },
                })
              : null,
            h(
              Sheet,
              {
                open: open.value,
                title: label(endpoint.value),
                closeLabel: props.closeLabel ?? translations.close,
                'onUpdate:open': (value: boolean) => {
                  if (!value) close()
                },
              },
              {
                default: () =>
                  h(Calendar, {
                    activeDate: activeDate.value,
                    onVnodeUnmounted: () => {
                      if (alive && returnFocus && !props.disabled && !open.value)
                        primitives.afterClose(
                          endpoint.value === 'end' ? secondOpener.value : firstOpener.value,
                        )
                    },
                    selected: isCivilDate(endpoint.value === 'end' ? end.value : start.value)
                      ? endpoint.value === 'end'
                        ? end.value
                        : start.value
                      : null,
                    rangeStart: range && isCivilDate(start.value) ? start.value : null,
                    rangeEnd: range && isCivilDate(end.value) ? end.value : null,
                    min: props.min,
                    max: props.max,
                    unavailableDates: props.unavailableDates,
                    locale: props.locale,
                    firstDayOfWeek: props.firstDayOfWeek,
                    'onUpdate:activeDate': (value: CivilDate) => {
                      activeDate.value = value
                    },
                    onSelect: (value: CivilDate) => {
                      if (
                        !open.value ||
                        props.disabled ||
                        props.readonly ||
                        !validateDateDraft(value, props).valid
                      )
                        return
                      touched.value = true
                      edit(endpoint.value, value)
                      close()
                    },
                  }),
              },
            ),
          ],
        },
      )
    }
    return { handle, render }
  }
  const Picker = defineComponent({
    name: 'MDatePicker',
    inheritAttrs: false,
    props: datePickerProps,
    emits: datePickerEmits,
    setup(props, { attrs, emit, expose }) {
      const entry = useEntry(props as EntryProps, false, {
        model: (value) => emit('update:modelValue', value as CivilDate | null),
        draft: (value) => emit('update:draft', value as string),
        validity: (value) => emit('validityChange', value),
        focus: () => emit('focus'),
        blur: () => emit('blur'),
      })
      expose(entry.handle)
      return () => entry.render(attrs)
    },
  })
  const RangePicker = defineComponent({
    name: 'MDateRangePicker',
    inheritAttrs: false,
    props: dateRangePickerProps,
    emits: dateRangePickerEmits,
    setup(props, { attrs, emit, expose }) {
      const entry = useEntry(props, true, {
        model: (value) => emit('update:modelValue', value as DateRange),
        draft: (value) => emit('update:draft', value as DateRangeDraft),
        validity: (value) => emit('validityChange', value),
        focus: () => emit('focus'),
        blur: () => emit('blur'),
      })
      expose(entry.handle)
      return () => entry.render(attrs)
    },
  })
  return {
    MDatePicker: Picker as typeof Picker & { new (): InstanceType<typeof Picker> & InputHandle },
    MDateRangePicker: RangePicker as typeof RangePicker & {
      new (): InstanceType<typeof RangePicker> & InputHandle
    },
  }
}
