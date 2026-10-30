import {
  defineComponent,
  h,
  mergeProps,
  ref,
  shallowRef,
  registerElement,
  watch,
  provide,
} from 'nativescript-vue'
import {
  inputProps,
  inputEmits,
  useMavisTheme,
  useDefaultShrink,
  layoutDirection,
} from '@mavis-ui/core/vue'
import { validateInput, nonNegative, resolveDimension, type InputHandle } from '@mavis-ui/core'
import type { EventData, PropertyChangeData, TextField, TextView } from '@nativescript/core'
import { MavisTextField } from '../../native/text-field.js'
import { MavisTextView } from '../../native/text-view.js'
import { MText } from './MText.js'
import { useNativeViewAttrs } from '../accessibility.js'

registerElement('MavisTextField', () => MavisTextField)
registerElement('MavisTextView', () => MavisTextView)

export const MInput = defineComponent({
  name: 'MInput',
  inheritAttrs: false,
  props: inputProps,
  emits: inputEmits,
  setup(props, { attrs, emit, expose }) {
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    provide(layoutDirection, 'column')
    const nativeAttrs = useNativeViewAttrs(props)
    const editor = shallowRef<{ nativeView: TextField | TextView }>()
    const focused = ref(false)
    function blur() {
      const view = editor.value?.nativeView
      view?.dismissSoftInput()
      view?.android?.clearFocus()
    }
    watch(
      () => props.disabled || props.readonly,
      (blocked) => {
        if (blocked) blur()
      },
    )
    expose({
      focus: () => {
        if (!props.disabled && !props.readonly) editor.value?.nativeView.focus()
      },
      blur,
    } satisfies InputHandle)

    return () => {
      validateInput(props)
      const { colors, radius, typography, control, space } = theme.value
      const message = props.error || props.helperText
      const text = props.type === 'text' || props.type === 'search'
      const capitalize = props.autocapitalize ?? (text ? 'sentences' : 'none')
      const border = props.error ? colors.danger : focused.value ? colors.primary : colors.border
      return h(
        'GridLayout',
        mergeProps(
          {
            rows: 'auto,auto,auto',
            accessibilityHidden: nativeAttrs().accessibilityHidden,
            style: {
              width: resolveDimension(props.width),
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              minWidth: 0,
              opacity: props.disabled ? 0.5 : 1,
            },
          },
          attrs,
        ),
        [
          h(MText, {
            text: props.label,
            variant: 'caption',
            accessibilityHidden: true,
            style: { fontWeight: '600' },
          }),
          h(props.multiline ? 'MavisTextView' : 'MavisTextField', {
            ...nativeAttrs(),
            row: 1,
            ref: editor,
            text: props.modelValue,
            hint: props.placeholder,
            editable: !props.disabled && !props.readonly,
            isEnabled: !props.disabled,
            isUserInteractionEnabled: !props.disabled,
            ...(props.multiline
              ? {}
              : {
                  secure: props.type === 'password',
                  closeOnReturn: false,
                  returnKeyType: props.returnKey,
                }),
            keyboardType:
              props.type === 'tel'
                ? 'phone'
                : ['email', 'url'].includes(props.type)
                  ? props.type
                  : undefined,
            autocapitalizationType: capitalize === 'characters' ? 'allcharacters' : capitalize,
            autocorrect: props.autocorrect ?? text,
            maxLength: props.maxLength ?? Infinity,
            updateTextTrigger: 'textChanged',
            iosAccessibilityAdjustsFontSize: true,
            accessibilityLabel: props.label,
            accessibilityHint: message,
            style: {
              flexShrink: 0,
              minWidth: 0,
              minHeight: props.multiline ? props.rows * 24 + 30 : control.md.height,
              padding: 14,
              paddingLeft: 16,
              paddingRight: 16,
              margin: 0,
              marginTop: space.sm,
              fontSize: typography.body.fontSize,
              color: colors.text,
              placeholderColor: colors.muted,
              backgroundColor: props.readonly ? colors.elevated : colors.surface,
              borderColor: border,
              borderWidth: 2,
              borderRadius: radius.md,
            },
            onTextChange: (event: PropertyChangeData) => {
              const value = String(event.value ?? '')
              if (!props.disabled && !props.readonly && value !== props.modelValue)
                emit('update:modelValue', value)
            },
            onFocus: () => {
              focused.value = true
              emit('focus')
            },
            onBlur: () => {
              focused.value = false
              emit('blur')
            },
            onUnloaded: () => {
              focused.value = false
            },
            onReturnPress: (event: EventData) => {
              const field = event.object as TextField
              if (props.multiline || props.disabled || props.readonly || field.ios?.markedTextRange)
                return
              emit('submit', field.text ?? '')
            },
          }),
          message
            ? h(MText, {
                row: 2,
                style: { marginTop: space.sm },
                text: message,
                variant: 'caption',
                tone: props.error ? 'danger' : 'muted',
              })
            : null,
        ],
      )
    }
  },
})
