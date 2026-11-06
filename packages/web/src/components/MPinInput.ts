import { MText } from './MText.js'
import { defineComponent, h, mergeProps, ref, useId, onMounted, watch } from 'vue'
import {
  pinInputProps,
  usePinInput,
  useMavisTheme,
  createPinCell,
} from '@getcortexlabs/mavis-core/vue'
import { fontFamily, resolveRadius } from '@getcortexlabs/mavis-core'
import { useMotionSurface } from '../use-motion-surface.js'

const PinCell = createPinCell(MText)
export const MPinInput = defineComponent({
  name: 'MPinInput',
  inheritAttrs: false,
  props: pinInputProps,
  emits: ['update:modelValue', 'complete', 'focus', 'blur'],
  setup(props, { attrs, emit, expose }) {
    const { theme } = useMavisTheme()
    const state = usePinInput(props, emit),
      input = ref<HTMLInputElement>()
    const id = `m-pin-${useId()}`
    const feedback = useMotionSurface(() => state.feedback)
    let composing = false
    const update = () => {
      const el = input.value
      if (!el || composing) return
      const normalized = state.change(el.value)
      if (el.value !== normalized) el.value = normalized
    }
    const selection = () => {
      state.position.value = Math.min(
        input.value?.selectionStart ?? state.value.value.length,
        props.length - 1,
      )
    }
    onMounted(() => {
      if (input.value && input.value.value !== state.value.value) update()
    })
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) input.value?.blur()
      },
    )
    expose({
      focus: () => {
        if (!props.disabled) input.value?.focus()
      },
      blur: () => input.value?.blur(),
    })
    return () => {
      const { colors, space } = theme.value
      const message = props.error || props.helperText,
        fieldId = props.id ?? id
      return h(
        'div',
        mergeProps(attrs, {
          class: 'm-pin-input',
          style: {
            minWidth: 0,
            fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
          },
        }),
        [
          h(
            'label',
            {
              for: fieldId,
              style: {
                display: 'block',
                fontWeight: 600,
                marginBottom: `${space.sm}px`,
                color: colors.text,
              },
            },
            props.label,
          ),
          h(
            'div',
            {
              class: 'm-pin-field',
              style: { position: 'relative', maxWidth: `${props.length * 56}px` },
            },
            [
              h(
                'div',
                {
                  'aria-hidden': 'true',
                  style: {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${props.length}, minmax(0, 1fr))`,
                    gap: `${space.xs}px`,
                  },
                },
                Array.from({ length: props.length }, (_, i) =>
                  h(
                    PinCell,
                    {
                      class: 'm-pin-cell',
                      digit: state.value.value[i] ?? '',
                      active: state.focused.value && state.position.value === i,
                      'data-active':
                        state.focused.value && state.position.value === i ? '' : undefined,
                      style: {
                        height: '52px',
                        display: 'grid',
                        placeItems: 'center',
                        boxSizing: 'border-box',
                        fontSize: '24px',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        border: `2px solid ${props.error ? colors.danger : state.focused.value && state.position.value === i ? colors.primary : colors.border}`,
                        borderRadius: `${resolveRadius(theme.value, 'md')}px`,
                        background: colors.surface,
                        color: colors.text,
                        opacity: props.disabled ? 0.5 : 1,
                      },
                    },
                    state.value.value[i] ?? '',
                  ),
                ),
              ),
              h('input', {
                ref: input,
                id: fieldId,
                name: props.name,
                form: props.form,
                type: 'text',
                inputmode: 'numeric',
                autocomplete: 'one-time-code',
                pattern: `[0-9]{${props.length}}`,
                required: props.required,
                disabled: props.disabled,
                readonly: props.readonly,
                value: state.value.value,
                'aria-invalid': props.error ? 'true' : undefined,
                'aria-describedby': message ? `${fieldId}-message` : undefined,
                spellcheck: false,
                autocapitalize: 'off',
                class: 'm-pin-editor',
                style: {
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box',
                  opacity: 0.02,
                  fontSize: '24px',
                  cursor: props.disabled ? 'default' : 'text',
                },
                onInput: update,
                onCompositionstart: () => {
                  composing = true
                },
                onCompositionend: () => {
                  composing = false
                  update()
                },
                onFocus: () => {
                  state.focused.value = true
                  selection()
                  emit('focus')
                },
                onBlur: () => {
                  state.focused.value = false
                  emit('blur')
                },
                onSelect: selection,
                onKeyup: selection,
                onClick: selection,
              }),
            ],
          ),
          message
            ? h(
                'p',
                {
                  ...feedback,
                  id: `${fieldId}-message`,
                  style: {
                    color: props.error ? colors.danger : colors.muted,
                    margin: `${space.sm}px 0 0`,
                    fontSize: `${theme.value.typography.caption.fontSize}px`,
                  },
                },
                message,
              )
            : null,
        ],
      )
    }
  },
})
