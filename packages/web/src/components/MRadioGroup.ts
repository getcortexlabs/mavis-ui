import { computed, defineComponent, h, mergeProps, nextTick, onBeforeUnmount, useId } from 'vue'
import { choiceKey, validateChoices, canChoose, type ChoiceOption } from '@getcortexlabs/mavis-core'
import { radioGroupProps, radioGroupEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { MText } from './MText.js'

export const MRadioGroup = defineComponent({
  name: 'MRadioGroup',
  inheritAttrs: false,
  props: radioGroupProps,
  emits: radioGroupEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const generatedId = `m-radio-${useId()}`
    const controls = new Map<string, HTMLInputElement>()
    let alive = true
    onBeforeUnmount(() => {
      alive = false
      controls.clear()
    })
    const options = computed(() => {
      validateChoices(props.options, props.modelValue)
      return props.options
    })
    function request(option: ChoiceOption) {
      if (canChoose(option, props.modelValue, props.disabled))
        emit('update:modelValue', option.value)
      // A radio click changes the entire browser group before Vue updates.
      void nextTick(() => {
        if (!alive) return
        for (const item of props.options) {
          const input = controls.get(choiceKey(item.value))
          if (input) input.checked = item.value === props.modelValue
        }
      })
    }
    function keydown(event: KeyboardEvent, option: ChoiceOption) {
      if (props.disabled || option.disabled || event.altKey || event.ctrlKey || event.metaKey)
        return
      const direction = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
      if (!direction && event.key !== 'Home' && event.key !== 'End') return
      event.preventDefault()
      const enabled = options.value.filter((item) => !item.disabled)
      const current = enabled.findIndex((item) => item.value === option.value)
      const index =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? enabled.length - 1
            : (current + direction! + enabled.length) % enabled.length
      const next = enabled[index]
      if (!next) return
      controls.get(choiceKey(next.value))?.focus()
      request(next)
    }
    return () => {
      const { colors, typography, space } = theme.value
      const id = props.id ?? generatedId
      const enabled = options.value.filter((option) => !option.disabled)
      const tabValue =
        enabled.find((option) => option.value === props.modelValue)?.value ?? enabled[0]?.value
      return h(
        MColumn,
        mergeProps(attrs, {
          id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          gap: 'sm',
          accessibilityHidden: props.accessibilityHidden,
          role: 'radiogroup',
          'aria-labelledby': `${id}-label`,
          'aria-describedby': props.helperText ? `${id}-help` : undefined,
          'aria-disabled': props.disabled || undefined,
        }),
        {
          default: () => [
            h(MText, { id: `${id}-label`, text: props.label, style: { fontWeight: 600 } }),
            props.helperText
              ? h(MText, {
                  id: `${id}-help`,
                  text: props.helperText,
                  variant: 'caption',
                  tone: 'muted',
                })
              : null,
            ...options.value.map((option) => {
              const key = choiceKey(option.value)
              const optionId = `${id}-${encodeURIComponent(key)}`
              const disabled = props.disabled || option.disabled
              const selected = option.value === props.modelValue
              return h(
                'label',
                {
                  key,
                  class: 'm-radio-option',
                  style: {
                    position: 'relative',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    minWidth: 0,
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    borderRadius: '10px',
                    gap: `${space.md}px`,
                    padding: `${space.sm}px 2px`,
                    color: colors.text,
                    opacity: disabled ? 0.45 : 1,
                    fontSize: `${typography.body.fontSize}px`,
                    lineHeight: 1.5,
                    '--m-focus': colors.primary,
                    '--m-radio-border': colors.muted,
                    '--m-radio-fill': colors.primary,
                  },
                },
                [
                  h('input', {
                    ref: (element: unknown) => {
                      if (element) controls.set(key, element as HTMLInputElement)
                      else controls.delete(key)
                    },
                    id: optionId,
                    name: generatedId,
                    type: 'radio',
                    class: 'm-radio-input',
                    checked: selected,
                    disabled,
                    tabindex: !disabled && option.value === tabValue ? 0 : -1,
                    'aria-label': option.label,
                    'aria-checked': selected,
                    'aria-describedby': option.helperText ? `${optionId}-help` : undefined,
                    onChange: () => request(option),
                    onKeydown: (event: KeyboardEvent) => keydown(event, option),
                  }),
                  h('span', { class: 'm-radio-indicator', 'aria-hidden': 'true' }, [
                    h('span', { class: 'm-radio-dot' }),
                  ]),
                  h(
                    'span',
                    {
                      style: {
                        flex: '1 1 min-content',
                        minWidth: 0,
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                      },
                    },
                    [
                      h('span', { style: { display: 'block', fontWeight: 600 } }, option.label),
                      option.helperText
                        ? h(
                            'span',
                            {
                              id: `${optionId}-help`,
                              style: {
                                display: 'block',
                                color: colors.muted,
                                fontSize: `${typography.caption.fontSize}px`,
                                marginTop: `${space.xs}px`,
                              },
                            },
                            option.helperText,
                          )
                        : null,
                    ],
                  ),
                ],
              )
            }),
          ],
        },
      )
    }
  },
})
