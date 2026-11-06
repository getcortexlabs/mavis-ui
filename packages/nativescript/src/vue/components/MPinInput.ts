import { defineComponent, h, mergeProps, ref, registerElement, watch } from 'nativescript-vue'
import {
  isIOS,
  isAndroid,
  type TextField,
  type EventData,
  type PropertyChangeData,
} from '@nativescript/core'
import {
  pinInputProps,
  usePinInput,
  useMavisTheme,
  createPinCell,
} from '@getcortexlabs/mavis-core/vue'
import { resolveRadius } from '@getcortexlabs/mavis-core'
import { MavisTextField } from '../../native/text-field'
import { MText } from './MText.js'

registerElement('MavisPinField', () => MavisTextField)
const PinCell = createPinCell(MText)
export const MPinInput = defineComponent({
  name: 'MPinInput',
  inheritAttrs: false,
  props: pinInputProps,
  emits: ['update:modelValue', 'complete', 'focus', 'blur'],
  setup(props, { attrs, emit, expose }) {
    const { theme } = useMavisTheme(),
      state = usePinInput(props, emit)
    const editor = ref<{ nativeView: TextField }>()
    function blur() {
      editor.value?.nativeView.dismissSoftInput()
      editor.value?.nativeView.android?.clearFocus()
    }
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) blur()
      },
    )
    expose({
      focus: () => {
        if (!props.disabled) editor.value?.nativeView.focus()
      },
      blur,
    })
    return () => {
      const { colors, space } = theme.value,
        message = props.error || props.helperText
      return h('StackLayout', mergeProps(attrs, { minWidth: 0 }), [
        h(MText, {
          text: props.label,
          variant: 'caption',
          accessibilityHidden: true,
          marginBottom: space.sm,
        }),
        h('GridLayout', { height: 56 }, [
          h(
            'GridLayout',
            {
              columns: Array(props.length).fill('*').join(','),
              accessibilityHidden: true,
              isUserInteractionEnabled: false,
            },
            Array.from({ length: props.length }, (_, i) =>
              h(PinCell, {
                col: i,
                digit: state.value.value[i] ?? '',
                active: state.focused.value && state.position.value === i,
                textAlignment: 'center',
                verticalAlignment: 'middle',
                height: 52,
                fontSize: 24,
                fontWeight: '600',
                paddingTop: 10,
                marginRight: i < props.length - 1 ? space.xs : 0,
                borderRadius: resolveRadius(theme.value, 'md'),
                borderWidth: 2,
                borderColor: props.error
                  ? colors.danger
                  : state.focused.value && state.position.value === i
                    ? colors.primary
                    : colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
                opacity: props.disabled ? 0.5 : 1,
              }),
            ),
          ),
          h('MavisPinField', {
            ref: editor,
            id: props.id,
            text: state.value.value,
            keyboardType: 'number',
            autocorrect: false,
            autocapitalizationType: 'none',
            closeOnReturn: false,
            editable: !props.disabled && !props.readonly,
            isEnabled: !props.disabled,
            updateTextTrigger: 'textChanged',
            accessibilityLabel: props.label,
            accessibilityHint: message,
            // The native editor retains selection, autofill and accessibility; cells are decorative.
            color: 'transparent',
            backgroundColor: 'transparent',
            borderWidth: 0,
            padding: 0,
            fontSize: 24,
            onLoaded: (event: EventData) => {
              const view = event.object as TextField
              if (isIOS) view.ios.textContentType = 'one-time-code'
              if (isAndroid) {
                view.android?.setLetterSpacing(0.6)
                view.android?.setSelectAllOnFocus(false)
              }
            },
            onTextChange: (event: PropertyChangeData) => {
              const field = event.object as TextField
              if (field.ios?.markedTextRange) return
              const normalized = state.change(String(event.value ?? ''))
              if (field.text !== normalized) field.text = normalized
            },
            onFocus: () => {
              state.focused.value = true
              state.position.value = Math.min(state.value.value.length, props.length - 1)
              emit('focus')
            },
            onBlur: () => {
              state.focused.value = false
              emit('blur')
            },
          }),
        ]),
        message
          ? h(MText, {
              text: message,
              variant: 'caption',
              tone: props.error ? 'danger' : 'muted',
              motionSurface: state.feedback,
              marginTop: space.sm,
            })
          : null,
      ])
    }
  },
})
