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
} from '@vue/runtime-core'
import {
  formatTime,
  localTime,
  parseTime,
  timeOptions,
  validateTime,
  type LocalTime,
  type TimeValidation,
} from '../time.js'
import type { InputActionHandle, InputHandle } from '../input.js'
import { timePickerProps } from './navigation-props.js'
import { useButtonAction } from './button-content.js'

export function createTimePicker(
  ui: {
    Input: Component
    Column: Component
    Row: Component
    Button: Component
    Text: Component
    Sheet: Component
    Picker: Component
    beforeOpen?: () => void
  },
  platform: 'web' | 'native',
) {
  const TimePicker = defineComponent({
    name: 'MTimePicker',
    inheritAttrs: false,
    props: timePickerProps,
    emits: {
      'update:modelValue': (_value: LocalTime | null) => true,
      'update:draft': (_value: string) => true,
      validityChange: (_value: TimeValidation) => true,
      focus: () => true,
      blur: () => true,
    },
    setup(props, { attrs, emit, expose }) {
      useButtonAction()
      const editor = ref<InputActionHandle>()
      const local = ref(props.draft ?? formatTime(props.modelValue, props))
      const draft = computed(() => props.draft ?? local.value)
      const validation = computed(() => parseTime(draft.value, props))
      watch(validation, (value) => emit('validityChange', value), { immediate: true })
      const open = ref(false)
      const picked = ref<LocalTime>('00:00')
      const touched = ref(false)
      let alive = true
      let revision = 0
      let requested: LocalTime | null | undefined
      onBeforeUnmount(() => {
        alive = false
      })
      const setDraft = (value: string) => {
        local.value = value
        emit('update:draft', value)
      }
      watch(
        () => [props.modelValue, props.locale, props.hourCycle] as const,
        (value, previous) => {
          if (value[0] !== requested || value[1] !== previous[1] || value[2] !== previous[2])
            setDraft(formatTime(value[0], props))
          requested = undefined
        },
      )
      watch(
        () => props.draft,
        (value) => {
          if (value !== undefined) local.value = value
        },
      )
      watch(
        () => props.disabled || props.readonly,
        (blocked) => {
          if (blocked) open.value = false
        },
      )
      function publish(value: LocalTime | null) {
        const current = ++revision
        requested = value
        emit('update:modelValue', value)
        void nextTick(() => {
          if (!alive || current !== revision) return
          if (props.modelValue !== value) setDraft(formatTime(props.modelValue, props))
          requested = undefined
        })
      }
      function edit(value: string) {
        if (props.disabled || props.readonly) return
        revision++
        setDraft(value)
        const next = parseTime(value, props)
        if (next.status === 'valid' || next.status === 'empty') publish(next.value)
      }
      function close() {
        open.value = false
        if (platform === 'native')
          void nextTick(() => {
            if (alive && !props.disabled) editor.value?.focusAction()
          })
      }
      function choose() {
        if (props.disabled || props.readonly) return
        const options = timeOptions(props)
        const value =
          validation.value.status === 'valid' ? validation.value.value : props.modelValue
        picked.value =
          validateTime(value, props).status === 'valid'
            ? value!
            : localTime(Math.ceil(options.min / options.step) * options.step)
        ui.beforeOpen?.()
        editor.value?.focusAction()
        open.value = true
      }
      expose({
        focus: () => editor.value?.focus(),
        blur: () => editor.value?.blur(),
      } satisfies InputHandle)
      return () => {
        const options = timeOptions(props)
        if (!props.label.trim()) throw new TypeError('TimePicker requires a label.')
        const issue =
          !['valid', 'empty'].includes(validation.value.status) &&
          (validation.value.status !== 'incomplete' || touched.value)
        const selected = validateTime(picked.value, props)
        return h(ui.Column, { width: props.width, grow: props.grow, shrink: props.shrink }, () => [
          h(
            ui.Input,
            mergeProps(attrs, {
              ref: editor,
              id: props.id,
              label: props.label,
              modelValue: draft.value,
              placeholder: props.placeholder ?? (options.cycle === 'h23' ? 'HH:mm' : 'h:mm AM/PM'),
              disabled: props.disabled,
              readonly: props.readonly,
              required: props.required,
              helperText: props.helperText,
              error: props.error || (issue ? props.invalidLabel : ''),
              autocapitalize: 'none',
              autocorrect: false,
              trailingAction: {
                icon: 'clock',
                label: props.chooseLabel,
                disabled: props.disabled || props.readonly,
              },
              'onUpdate:modelValue': edit,
              onAction: choose,
              onFocus: () => emit('focus'),
              onBlur: () => {
                touched.value = true
                emit('blur')
              },
            }),
          ),
          platform === 'web' && props.name
            ? h('input', {
                type: 'hidden',
                name: props.name,
                disabled: props.disabled,
                value: props.modelValue ?? '',
              })
            : null,
          h(
            ui.Sheet,
            {
              open: open.value,
              title: props.label,
              closeLabel: props.cancelLabel,
              'onUpdate:open': (value: boolean) => {
                if (!value) close()
              },
            },
            () => [
              h(ui.Picker, {
                ...props,
                modelValue: picked.value,
                'onUpdate:modelValue': (value: LocalTime) => {
                  picked.value = value
                },
              }),
              selected.status !== 'valid'
                ? h(ui.Text, { text: props.invalidLabel, tone: 'danger' })
                : null,
              h(ui.Row, { gap: 'sm', wrap: true }, () => [
                h(ui.Button, {
                  text: props.confirmLabel,
                  disabled: selected.status !== 'valid' || props.disabled || props.readonly,
                  onClick: () => {
                    const next = validateTime(picked.value, props)
                    if (props.disabled || props.readonly || next.status !== 'valid') return
                    setDraft(formatTime(next.value, props))
                    publish(next.value)
                    close()
                  },
                }),
                h(ui.Button, {
                  text: props.clearLabel,
                  variant: 'ghost',
                  disabled: props.disabled || props.readonly || props.required,
                  onClick: () => {
                    if (props.disabled || props.readonly || props.required) return
                    setDraft('')
                    publish(null)
                    close()
                  },
                }),
              ]),
            ],
          ),
        ])
      }
    },
  })
  return TimePicker as typeof TimePicker & { new (): InstanceType<typeof TimePicker> & InputHandle }
}
