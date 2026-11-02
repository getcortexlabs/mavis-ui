import {
  defineComponent,
  getCurrentInstance,
  nextTick,
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
  useButtonAction,
  inputProps,
  inputEmits,
  useMavisTheme,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import {
  fontFamily,
  resolveRadius,
  nonNegative,
  resolveDimension,
  validateInput,
  iconSizes,
  inputActionSize,
  type InputHandle,
} from '@getcortexlabs/mavis-core'
import { length, webAttrs } from '../style.js'
import { MIcon } from './MIcon.js'
import { MButton } from './MButton.js'
import { inputAttrs, describedBy, type InputEditorAttributes } from '../input-attrs.js'

const Input = defineComponent({
  name: 'MInput',
  inheritAttrs: false,
  props: inputProps,
  emits: inputEmits,
  setup(props, { attrs, emit, expose }) {
    useButtonAction()
    const instance = getCurrentInstance()!
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    const generatedId = `m-input-${useId()}`
    const editor = ref<HTMLInputElement | HTMLTextAreaElement>()
    const focused = ref(false)
    watch(
      () => props.type,
      () => {
        const field = editor.value
        if (!field || document.activeElement !== field || field.selectionStart === null) return
        const start = field.selectionStart,
          end = field.selectionEnd!,
          direction = field.selectionDirection
        void nextTick(() => {
          if (
            editor.value !== field ||
            document.activeElement !== field ||
            field.selectionStart === null
          )
            return
          field.setSelectionRange(start, end, direction ?? undefined)
        })
      },
      { flush: 'pre' },
    )
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
        theme.value.components.input,
      ])
      // Resetting height can move Safari's scroll position while a pointer is
      // down. Focus/blur renders do not need to measure unchanged content.
      if (key === measured) return
      measured = key
      field.style.height = 'auto'
      field.style.height = `${field.scrollHeight + 2}px`
    }
    function observe() {
      // HTML reset must not replace a controlled value behind the application's back.
      // Applications reset their models in @reset.prevent; ordinary reset keeps them intact.
      if (editor.value) editor.value.defaultValue = props.modelValue
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
      const forwarded = inputAttrs(attrs)
      const text = props.type === 'text' || props.type === 'search'
      const border = props.error ? colors.danger : focused.value ? colors.primary : colors.border
      const tokens = theme.value.components.input
      const fontSize = tokens.fontSize ?? typography.body.fontSize
      const family = fontFamily(tokens.fontFamily ?? typography.body.fontFamily, 'web')
      const action = props.trailingAction
      const icon = (name: typeof props.icon, trailing: boolean) =>
        name
          ? h(MIcon, {
              name,
              size: 'md',
              tone: props.error ? 'danger' : 'muted',
              style: {
                position: 'absolute',
                [trailing ? 'right' : 'left']: `var(--m-input-padding-x, ${tokens.paddingX}px)`,
                top: props.multiline ? `var(--m-input-padding-y, ${tokens.paddingY}px)` : '50%',
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
              fontFamily: fontFamily(typography.body.fontFamily, 'web'),
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              width: length(resolveDimension(props.width)),
              opacity: props.disabled ? 0.5 : 1,
              '--m-input-placeholder': colors.muted,
            },
          },
          webAttrs({ ...forwarded.wrapper, accessibilityHidden: props.accessibilityHidden }),
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
            h(
              props.multiline ? 'textarea' : 'input',
              mergeProps(forwarded.editor, {
                ref: editor,
                id,
                class: 'm-input-editor',
                type: props.multiline ? undefined : props.type,
                rows: props.multiline ? props.rows : undefined,
                value: props.modelValue,
                name: props.name,
                autocomplete: props.autocomplete,
                required: props.required,
                inputmode: props.inputmode,
                form: props.form,
                placeholder: props.placeholder,
                disabled: props.disabled,
                readonly: props.readonly,
                maxlength: props.maxLength,
                autocapitalize: props.autocapitalize ?? (text ? 'sentences' : 'none'),
                autocorrect: (props.autocorrect ?? text) ? 'on' : 'off',
                spellcheck: props.autocorrect ?? text,
                enterkeyhint: props.multiline ? 'enter' : props.returnKey,
                'aria-invalid': props.error ? 'true' : forwarded.editor['aria-invalid'],
                'aria-describedby': describedBy(
                  forwarded.editor['aria-describedby'],
                  message ? `${id}-message` : undefined,
                ),
                style: {
                  boxSizing: 'border-box',
                  width: '100%',
                  minWidth: 0,
                  minHeight: `${props.multiline ? props.rows * fontSize * tokens.lineHeight + tokens.paddingY * 2 + 2 : Math.max(control.md.height, action ? inputActionSize + 8 : 0)}px`,
                  margin: 0,
                  paddingTop: `var(--m-input-padding-y, ${tokens.paddingY}px)`,
                  paddingBottom: `var(--m-input-padding-y, ${tokens.paddingY}px)`,
                  paddingLeft: props.icon
                    ? `calc(var(--m-input-padding-x, ${tokens.paddingX}px) + ${iconSizes.md + 10}px)`
                    : `var(--m-input-padding-x, ${tokens.paddingX}px)`,
                  paddingRight: action
                    ? `max(var(--m-input-padding-x, ${tokens.paddingX}px), ${inputActionSize + 12}px)`
                    : props.trailingIcon
                      ? `calc(var(--m-input-padding-x, ${tokens.paddingX}px) + ${iconSizes.md + 10}px)`
                      : `var(--m-input-padding-x, ${tokens.paddingX}px)`,
                  border: `1px solid ${border}`,
                  borderRadius: `var(--m-input-radius, ${resolveRadius(theme.value, tokens.radius)}px)`,
                  outline: 'none',
                  boxShadow: focused.value ? `0 0 0 2px ${border}` : 'none',
                  fontFamily: `var(--m-input-font-family, ${family})`,
                  fontSize: `var(--m-input-font-size, ${fontSize}px)`,
                  fontWeight: `var(--m-input-font-weight, ${tokens.fontWeight})`,
                  lineHeight: `var(--m-input-line-height, ${tokens.lineHeight})`,
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
                    event.defaultPrevented ||
                    event.isComposing ||
                    event.keyCode === 229 ||
                    props.multiline
                  )
                    return
                  // An existing component handler owns this action (for example, focus next).
                  // Without one, leave implicit submission and validation to the HTML form.
                  const listeners = instance.vnode.props
                  if (!listeners?.onSubmit && !listeners?.onSubmitOnce && editor.value?.form) return
                  event.preventDefault()
                  if (!props.disabled && !props.readonly)
                    emit('submit', (event.target as HTMLInputElement).value)
                },
              }),
            ),
            icon(props.icon, false),
            icon(props.trailingIcon, true),
            action
              ? h(MButton, {
                  class: 'm-input-action',
                  type: 'button',
                  icon: action.icon,
                  accessibilityLabel: action.label,
                  variant: 'ghost',
                  disabled: props.disabled || props.readonly || action.disabled,
                  style: {
                    position: 'absolute',
                    right: '4px',
                    top: props.multiline ? '4px' : '50%',
                    transform: props.multiline ? undefined : 'translateY(-50%)',
                    width: `${inputActionSize}px`,
                    minHeight: `${inputActionSize}px`,
                    padding: 0,
                  },
                  onPointerdown: (event: PointerEvent) => {
                    if (event.button === 0 && document.activeElement === editor.value)
                      event.preventDefault()
                  },
                  onClick: () => {
                    if (!props.disabled && !props.readonly && !action.disabled) emit('action')
                  },
                })
              : null,
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

// Vue's options overload does not infer setupContext.expose() in its constructor type.
export const MInput = Input as typeof Input & {
  new (): InstanceType<typeof Input> & InputHandle & { $props: InputEditorAttributes }
}
