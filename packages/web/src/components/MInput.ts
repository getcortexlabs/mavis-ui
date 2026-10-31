import {
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useId,
  watch,
} from 'vue'
import {
  inputProps,
  inputEmits,
  useMavisTheme,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import {
  nonNegative,
  resolveDimension,
  validateInput,
  iconSizes,
  type InputHandle,
} from '@getcortexlabs/mavis-core'
import { length, webAttrs } from '../style.js'
import { MIcon } from './MIcon.js'

export const MInput = defineComponent({
  name: 'MInput',
  inheritAttrs: false,
  props: inputProps,
  emits: inputEmits,
  setup(props, { attrs, emit, expose }) {
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    const generatedId = `m-input-${useId()}`
    const editor = ref<HTMLInputElement | HTMLTextAreaElement>()
    const focused = ref(false)
    let observer: ResizeObserver | undefined
    let observed: HTMLElement | undefined
    let width = 0
    let measured = ''

    function resize() {
      const field = editor.value
      if (!field || field.tagName !== 'TEXTAREA') return
      const key = JSON.stringify([
        field.value,
        field.clientWidth,
        props.rows,
        theme.value.typography.body.fontSize,
      ])
      // Resetting height can move Safari's scroll position while a pointer is
      // down. Focus/blur renders do not need to measure unchanged content.
      if (key === measured) return
      measured = key
      field.style.height = 'auto'
      field.style.height = `${field.scrollHeight + 2}px`
    }
    function observe() {
      if (editor.value !== observed) {
        observer?.disconnect()
        observed = editor.value
        measured = ''
        width = 0
        if (observed && props.multiline) observer?.observe(observed)
      }
      resize()
    }
    onMounted(() => {
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(([entry]) => {
          if (entry && entry.contentRect.width !== width) {
            width = entry.contentRect.width
            resize()
          }
        })
      }
      observe()
    })
    onUpdated(observe)
    onBeforeUnmount(() => observer?.disconnect())
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) editor.value?.blur()
      },
    )
    expose({
      focus: () => {
        if (!props.disabled) editor.value?.focus()
      },
      blur: () => editor.value?.blur(),
    } satisfies InputHandle)

    return () => {
      validateInput(props)
      const { colors, radius, typography, control, space } = theme.value
      const id = props.id ?? generatedId
      const message = props.error || props.helperText
      const text = props.type === 'text' || props.type === 'search'
      const border = props.error ? colors.danger : focused.value ? colors.primary : colors.border
      const inset = 16 + iconSizes.md + 10
      const icon = (name: typeof props.icon, trailing: boolean) =>
        name
          ? h(MIcon, {
              name,
              size: 'md',
              tone: props.error ? 'danger' : 'muted',
              style: {
                position: 'absolute',
                [trailing ? 'right' : 'left']: '16px',
                top: props.multiline ? '16px' : '50%',
                transform: props.multiline ? undefined : 'translateY(-50%)',
                pointerEvents: 'none',
              },
            })
          : null
      return h(
        'div',
        mergeProps(
          {
            class: 'm-input',
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: `${space.sm}px`,
              minWidth: 0,
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              width: length(resolveDimension(props.width)),
              opacity: props.disabled ? 0.5 : 1,
              '--m-input-placeholder': colors.muted,
            },
          },
          webAttrs({ ...attrs, accessibilityHidden: props.accessibilityHidden }),
        ),
        [
          h(
            'label',
            {
              for: id,
              style: {
                color: colors.text,
                fontSize: `${typography.caption.fontSize}px`,
                fontWeight: '600',
                lineHeight: 1.4,
              },
            },
            props.label,
          ),
          h('div', { class: 'm-input-field', style: { position: 'relative', display: 'flex' } }, [
            h(props.multiline ? 'textarea' : 'input', {
              ref: editor,
              id,
              class: 'm-input-editor',
              type: props.multiline ? undefined : props.type,
              rows: props.multiline ? props.rows : undefined,
              value: props.modelValue,
              placeholder: props.placeholder,
              disabled: props.disabled,
              readonly: props.readonly,
              maxlength: props.maxLength,
              autocapitalize: props.autocapitalize ?? (text ? 'sentences' : 'none'),
              autocorrect: (props.autocorrect ?? text) ? 'on' : 'off',
              spellcheck: props.autocorrect ?? text,
              enterkeyhint: props.multiline ? 'enter' : props.returnKey,
              'aria-invalid': props.error ? 'true' : undefined,
              'aria-describedby': message ? `${id}-message` : undefined,
              style: {
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0,
                minHeight: `${props.multiline ? props.rows * typography.body.fontSize * 1.5 + 30 : control.md.height}px`,
                margin: 0,
                padding: '14px 16px',
                paddingLeft: props.icon ? `${inset}px` : undefined,
                paddingRight: props.trailingIcon ? `${inset}px` : undefined,
                border: `1px solid ${border}`,
                borderRadius: `${radius.md}px`,
                outline: 'none',
                boxShadow: focused.value ? `0 0 0 2px ${border}` : 'none',
                fontFamily: 'inherit',
                fontSize: `${typography.body.fontSize}px`,
                lineHeight: '1.5',
                backgroundColor: props.readonly ? colors.elevated : colors.surface,
                color: colors.text,
                caretColor: colors.primary,
                resize: 'none',
                overflow: props.multiline ? 'hidden' : undefined,
              },
              onInput: (event: Event) => {
                if (props.disabled || props.readonly) return
                const value = (event.target as HTMLInputElement).value
                if (value !== props.modelValue) emit('update:modelValue', value)
                resize()
              },
              onFocus: () => {
                focused.value = true
                emit('focus')
              },
              onBlur: () => {
                focused.value = false
                emit('blur')
              },
              onKeydown: (event: KeyboardEvent) => {
                if (
                  event.key !== 'Enter' ||
                  event.isComposing ||
                  event.keyCode === 229 ||
                  props.multiline
                )
                  return
                event.preventDefault()
                if (!props.disabled && !props.readonly)
                  emit('submit', (event.target as HTMLInputElement).value)
              },
            }),
            icon(props.icon, false),
            icon(props.trailingIcon, true),
          ]),
          message
            ? h(
                'p',
                {
                  id: `${id}-message`,
                  style: {
                    margin: 0,
                    fontSize: `${typography.caption.fontSize}px`,
                    lineHeight: 1.4,
                    color: props.error ? colors.danger : colors.muted,
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
