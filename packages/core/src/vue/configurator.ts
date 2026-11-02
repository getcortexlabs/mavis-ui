import {
  computed,
  onBeforeUnmount,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  ref,
  watch,
  type Component,
} from '@vue/runtime-core'
import type { InputHandle } from '../input.js'
import type { ChoiceValue } from '../choice.js'
import { choiceKey } from '../choice.js'
import {
  formatNumber,
  parseNumberDraft,
  stepNumber,
  validateNumberConstraints,
  type NumberDraft,
} from '../number-input.js'
import { toggleMultiSelection, validateMultiSelection } from '../multi-select.js'
import { numberInputProps, multiSelectProps } from './configurator-props.js'
import { useButtonAction } from './button-content.js'

interface Primitives {
  Column: Component
  Row: Component
  Text: Component
  Button: Component
  Input: Component
  Chip: Component
  Checkbox: Component
  Sheet: Component
  focusTrigger: (component: unknown) => void
}

/** Shared controls compose the renderer primitives, keeping editing and selection in one place. */
export function createConfiguratorControls(ui: Primitives, platform: 'web' | 'native') {
  const NumberInput = defineComponent({
    name: 'MNumberInput',
    inheritAttrs: false,
    props: numberInputProps,
    emits: {
      'update:modelValue': (_value: number | null) => true,
      'update:draft': (_value: string) => true,
      validityChange: (_value: NumberDraft) => true,
      focus: () => true,
      blur: () => true,
    },
    setup(props, { attrs, emit, expose }) {
      useButtonAction()
      const editor = ref<InputHandle>()
      const local = ref(props.draft ?? formatNumber(props.modelValue, props.locale))
      const draft = computed(() => props.draft ?? local.value)
      const parsed = computed(() => parseNumberDraft(draft.value, props.locale, props))
      let alive = true
      onBeforeUnmount(() => {
        alive = false
      })
      let revision = 0
      let requested: number | null | undefined
      function setDraft(value: string) {
        local.value = value
        emit('update:draft', value)
      }
      watch(
        () => [props.modelValue, props.locale] as const,
        ([value, locale], previous) => {
          if (!Object.is(value, requested) || locale !== previous[1])
            setDraft(formatNumber(value, locale))
          requested = undefined
        },
      )
      watch(
        () => props.draft,
        (value) => {
          if (value !== undefined) local.value = value
        },
      )
      function publish(value: number | null) {
        const current = ++revision
        requested = value
        emit('update:modelValue', value)
        void nextTick(() => {
          if (!alive || current !== revision) return
          if (!Object.is(props.modelValue, value))
            setDraft(formatNumber(props.modelValue, props.locale))
          requested = undefined
        })
      }
      function edit(value: string) {
        if (props.disabled || props.readonly) return
        revision++
        setDraft(value)
        const validation = parseNumberDraft(value, props.locale, props)
        emit('validityChange', validation)
        if (validation.status === 'valid' || validation.status === 'empty')
          publish(validation.value)
      }
      function step(direction: -1 | 1) {
        if (props.disabled || props.readonly) return
        const current = parsed.value.status === 'valid' ? parsed.value.value : props.modelValue
        const value = stepNumber(current, direction, props)
        setDraft(formatNumber(value, props.locale))
        publish(value)
        emit('validityChange', { status: 'valid', value })
      }
      expose({
        focus: () => editor.value?.focus(),
        blur: () => editor.value?.blur(),
      } satisfies InputHandle)
      return () => {
        validateNumberConstraints(props)
        if (!props.label.trim()) throw new TypeError('NumberInput requires a label.')
        const blocked = props.disabled || props.readonly
        const issue = ['invalid', 'range'].includes(parsed.value.status)
        const message = issue
          ? props.locale === 'pt-BR'
            ? 'Informe um número dentro dos limites.'
            : 'Enter a number within the allowed range.'
          : ''
        return h(
          ui.Row,
          {
            gap: 'sm',
            align: 'end',
            width: props.width,
            grow: props.grow,
            shrink: props.shrink,
            accessibilityHidden: props.accessibilityHidden,
          },
          () => [
            h(
              ui.Input,
              mergeProps(attrs, {
                ref: editor,
                id: props.id,
                modelValue: draft.value,
                label: props.label,
                name: props.name,
                placeholder: props.placeholder,
                inputmode: 'decimal',
                disabled: props.disabled,
                readonly: props.readonly,
                helperText: props.helperText,
                error: props.error || message,
                accessibilityHidden: props.accessibilityHidden,
                width: 0,
                grow: 1,
                autocorrect: false,
                autocapitalize: 'none',
                'onUpdate:modelValue': edit,
                onFocus: () => emit('focus'),
                onBlur: () => emit('blur'),
                ...(platform === 'web'
                  ? {
                      onKeydown: (event: {
                        key: string
                        isComposing: boolean
                        preventDefault(): void
                      }) => {
                        if (
                          !blocked &&
                          !event.isComposing &&
                          ['ArrowUp', 'ArrowDown'].includes(event.key)
                        ) {
                          event.preventDefault()
                          step(event.key === 'ArrowUp' ? 1 : -1)
                        }
                      },
                    }
                  : {}),
              }),
            ),
            h(ui.Button, {
              text: '−',
              variant: 'secondary',
              accessibilityLabel: `${props.decrementLabel}: ${props.label}`,
              disabled:
                blocked ||
                (props.min !== undefined &&
                  props.modelValue !== null &&
                  props.modelValue <= props.min),
              onClick: () => step(-1),
            }),
            h(ui.Button, {
              text: '+',
              variant: 'secondary',
              accessibilityLabel: `${props.incrementLabel}: ${props.label}`,
              disabled:
                blocked ||
                (props.max !== undefined &&
                  props.modelValue !== null &&
                  props.modelValue >= props.max),
              onClick: () => step(1),
            }),
          ],
        )
      }
    },
  })
  const MultiSelect = defineComponent({
    name: 'MMultiSelect',
    inheritAttrs: false,
    props: multiSelectProps,
    emits: { 'update:modelValue': (_values: ChoiceValue[]) => true },
    setup(props, { attrs, emit }) {
      useButtonAction()
      const open = ref(false),
        query = ref('')
      const trigger = ref<unknown>()
      let alive = true
      onBeforeUnmount(() => {
        alive = false
      })
      function restoreFocus() {
        void nextTick(() => {
          if (alive) ui.focusTrigger(trigger.value)
        })
      }
      watch(
        () => props.disabled || props.readonly,
        (blocked) => {
          if (blocked) open.value = false
        },
      )
      watch(open, (value) => {
        if (!value && platform === 'native' && !props.disabled) restoreFocus()
      })
      function toggle(value: ChoiceValue) {
        if (props.disabled || props.readonly) return
        const next = toggleMultiSelection(props.options, props.modelValue, value, props.maxSelected)
        if (next) emit('update:modelValue', next)
      }
      return () => {
        validateMultiSelection(props.options, props.modelValue, props.maxSelected)
        if (!props.label.trim()) throw new TypeError('MultiSelect requires a label.')
        const selected = props.modelValue.map((value) =>
          props.options.find((option) => option.value === value)!,
        )
        const filter = query.value.trim().toLocaleLowerCase()
        const options = props.options.filter((option) =>
          option.label.toLocaleLowerCase().includes(filter),
        )
        return h(
          ui.Column,
          mergeProps(attrs, {
            gap: 'sm',
            width: props.width,
            grow: props.grow,
            shrink: props.shrink,
            accessibilityHidden: props.accessibilityHidden,
          }),
          () => [
            h(ui.Text, { text: props.label, variant: 'caption', weight: '600' }),
            h(ui.Button, {
              ref: trigger,
              id: props.id,
              text: selected.length ? `${props.label} · ${selected.length}` : props.placeholder,
              accessibilityLabel: `${props.label}: ${selected.map((option) => option.label).join(', ') || props.placeholder}`,
              variant: 'secondary',
              disabled: props.disabled || props.readonly,
              onClick: () => {
                ui.focusTrigger(trigger.value)
                query.value = ''
                open.value = true
              },
            }),
            selected.length
              ? h(ui.Row, { gap: 'sm', wrap: true }, () =>
                  selected.map((option) =>
                    h(ui.Chip, {
                      key: choiceKey(option.value),
                      label: option.label,
                      removable: true,
                      removeLabel: `${props.removeLabel}: ${option.label}`,
                      disabled: props.disabled || props.readonly || option.disabled,
                      onRemove: () => {
                        toggle(option.value)
                        restoreFocus()
                      },
                    }),
                  ),
                )
              : null,
            props.error || props.helperText
              ? h(ui.Text, {
                  text: props.error || props.helperText,
                  tone: props.error ? 'danger' : 'muted',
                  variant: 'caption',
                })
              : null,
            h(
              ui.Sheet,
              {
                open: open.value,
                title: props.label,
                closeLabel: props.closeLabel,
                'onUpdate:open': (value: boolean) => {
                  open.value = value
                },
              },
              () => [
                h(ui.Column, { gap: 'md' }, () => [
                  h(ui.Input, {
                    modelValue: query.value,
                    label: props.searchLabel,
                    type: 'search',
                    autocorrect: false,
                    'onUpdate:modelValue': (value: string) => {
                      query.value = value
                    },
                  }),
                  ...options.map((option) =>
                    h(ui.Checkbox, {
                      key: choiceKey(option.value),
                      label: option.label,
                      helperText: option.helperText ?? '',
                      modelValue: props.modelValue.includes(option.value),
                      disabled:
                        props.disabled ||
                        props.readonly ||
                        option.disabled ||
                        (!props.modelValue.includes(option.value) &&
                          props.maxSelected !== undefined &&
                          props.modelValue.length >= props.maxSelected),
                      'onUpdate:modelValue': () => toggle(option.value),
                    }),
                  ),
                  !options.length ? h(ui.Text, { text: props.emptyLabel, tone: 'muted' }) : null,
                  h(ui.Button, {
                    text: props.closeLabel,
                    onClick: () => {
                      open.value = false
                    },
                  }),
                ]),
              ],
            ),
          ],
        )
      }
    },
  })
  return {
    MNumberInput: NumberInput as typeof NumberInput & { new (): InputHandle },
    MMultiSelect: MultiSelect,
  }
}
