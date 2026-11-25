import { defineComponent, h, nextTick, ref, type Component, type PropType } from '@vue/runtime-core'
import type { InputHandle } from '../input.js'
import { avatarSizes, type AvatarMember } from '../avatar.js'
import { avatarProps } from './props.js'
import { useMavisTheme } from './theme.js'

const editorProps = {
  id: String,
  label: { type: String, required: true as const },
  placeholder: String,
  disabled: Boolean,
}
export const searchBarProps = {
  ...editorProps,
  modelValue: { type: String, default: '' },
  clearLabel: { type: String, default: 'Clear search' },
  cancelLabel: { type: String, default: 'Cancel' },
  showCancel: Boolean,
}
export const tagInputProps = {
  ...editorProps,
  modelValue: { type: Array as PropType<readonly string[]>, default: () => [] },
  addLabel: { type: String, default: 'Add tag' },
  removeLabel: { type: String, default: 'Remove' },
  maxTags: Number,
}
export const avatarGroupProps = {
  id: String,
  members: { type: Array as PropType<readonly AvatarMember[]>, required: true as const },
  maxVisible: { type: Number, default: 4 },
  size: avatarProps.size,
}

export function createEditorControls(
  ui: {
    Row: Component
    Column: Component
    Input: Component
    Chip: Component
    Button: Component
    Avatar: Component
  },
  platform: 'web' | 'native',
) {
  const web = platform === 'web'
  const MSearchBar = defineComponent({
    name: 'MSearchBar',
    props: searchBarProps,
    emits: {
      'update:modelValue': (_v: string) => true,
      submit: (_v: string) => true,
      clear: () => true,
      cancel: () => true,
    },
    setup(props, { emit, expose }) {
      const editor = ref<InputHandle>()
      const focus = () => editor.value?.focus()
      const blur = () => editor.value?.blur()
      expose({ focus, blur })
      return () =>
        h(
          ui.Row,
          { gap: 'sm', align: 'center' },
          {
            default: () => [
              h(ui.Input, {
                ref: editor,
                id: props.id,
                label: props.label,
                placeholder: props.placeholder,
                width: 0,
                grow: 1,
                modelValue: props.modelValue,
                disabled: props.disabled,
                icon: 'search',
                inputmode: 'search',
                returnKey: 'search',
                trailingAction: props.modelValue
                  ? { icon: 'x', label: props.clearLabel }
                  : undefined,
                'onUpdate:modelValue': (value: string) => {
                  if (!props.disabled) emit('update:modelValue', value)
                },
                onSubmit: (value: string) => {
                  if (!props.disabled) emit('submit', value)
                },
                onAction: () => {
                  if (props.disabled || !props.modelValue) return
                  emit('update:modelValue', '')
                  emit('clear')
                  void nextTick(focus)
                },
              }),
              props.showCancel
                ? h(ui.Button, {
                    text: props.cancelLabel,
                    variant: 'ghost',
                    disabled: props.disabled,
                    onClick: () => {
                      if (!props.disabled) {
                        blur()
                        emit('cancel')
                      }
                    },
                  })
                : null,
            ],
          },
        )
    },
  })
  const MTagInput = defineComponent({
    name: 'MTagInput',
    props: tagInputProps,
    emits: { 'update:modelValue': (_v: string[]) => true },
    setup(props, { emit, expose }) {
      const draft = ref('')
      const editor = ref<InputHandle>()
      let composing = false
      let editVersion = 0
      const focus = () => editor.value?.focus()
      expose({ focus, blur: () => editor.value?.blur() })
      function add(value: string, finish: boolean, fromEditor = false) {
        if (props.disabled) return
        const parts = value.split(/[,\r\n]+/)
        const tail = finish ? '' : (parts.pop() ?? '')
        const result = [...props.modelValue]
        const seen = new Set(result.map((tag) => tag.trim().toLowerCase()))
        const remaining: string[] = []
        for (const part of parts) {
          const tag = part.trim()
          const key = tag.toLowerCase()
          if (!tag || seen.has(key)) continue
          seen.add(key)
          if (result.length < (props.maxTags ?? Infinity)) result.push(tag)
          else remaining.push(tag)
        }
        const nextDraft = [...remaining, tail].filter(Boolean).join(', ')
        const version = ++editVersion
        // A native paste can add whole tags to an already-empty editor. Give the
        // controlled field the input echo before clearing it, even if the final draft is unchanged.
        if (fromEditor && nextDraft !== value) {
          draft.value = value
          void nextTick(() => {
            if (version === editVersion) draft.value = nextDraft
          })
        } else draft.value = nextDraft
        if (result.length !== props.modelValue.length) emit('update:modelValue', result)
      }
      function remove(index: number) {
        if (!props.disabled && index >= 0)
          emit(
            'update:modelValue',
            props.modelValue.filter((_, i) => i !== index),
          )
      }
      return () => {
        if (props.maxTags !== undefined && (!Number.isInteger(props.maxTags) || props.maxTags < 0))
          throw new RangeError('maxTags must be a nonnegative integer.')
        const webEvents = web
          ? {
              onCompositionstart: () => {
                composing = true
              },
              onCompositionend: (e: CompositionEvent) => {
                composing = false
                add((e.target as HTMLInputElement).value, false)
              },
              onKeydown: (e: KeyboardEvent) => {
                if (
                  e.key === 'Backspace' &&
                  !e.repeat &&
                  !composing &&
                  !e.isComposing &&
                  !draft.value &&
                  (e.target as HTMLElement).tagName === 'INPUT' &&
                  props.modelValue.length &&
                  !props.disabled
                ) {
                  e.preventDefault()
                  remove(props.modelValue.length - 1)
                }
              },
              onPaste: (e: ClipboardEvent) => {
                const field = e.target as HTMLInputElement
                const text = e.clipboardData?.getData('text/plain')
                if (
                  field.tagName !== 'INPUT' ||
                  !text ||
                  !/[,\r\n]/.test(text) ||
                  props.disabled ||
                  composing
                )
                  return
                e.preventDefault()
                add(
                  field.value.slice(0, field.selectionStart ?? 0) +
                    text +
                    field.value.slice(field.selectionEnd ?? field.value.length),
                  true,
                )
              },
            }
          : {}
        return h(
          ui.Column,
          { gap: 'sm', ...webEvents },
          {
            default: () => [
              h(ui.Input, {
                ref: editor,
                id: props.id,
                label: props.label,
                placeholder: props.placeholder,
                modelValue: draft.value,
                disabled: props.disabled,
                returnKey: 'done',
                trailingAction: draft.value.trim()
                  ? { icon: 'plus', label: props.addLabel }
                  : undefined,
                'onUpdate:modelValue': (text: string) => {
                  if (composing) {
                    editVersion++
                    draft.value = text
                  } else
                    add(
                      text,
                      !web && /[,\r\n]/.test(text) && text.length > draft.value.length + 1,
                      true,
                    )
                },
                onSubmit: (text: string) => add(text, true),
                onAction: () => {
                  add(draft.value, true)
                  void nextTick(focus)
                },
              }),
              props.modelValue.length
                ? h(
                    ui.Row,
                    { wrap: true, gap: 'xs' },
                    {
                      default: () =>
                        props.modelValue.map((tag, i) =>
                          h(ui.Chip, {
                            key: tag,
                            label: tag,
                            removable: true,
                            removeLabel: props.removeLabel + ' ' + tag,
                            disabled: props.disabled,
                            onRemove: () => remove(i),
                          }),
                        ),
                    },
                  )
                : null,
            ],
          },
        )
      }
    },
  })
  const MAvatarGroup = defineComponent({
    name: 'MAvatarGroup',
    props: avatarGroupProps,
    setup(props) {
      const { theme } = useMavisTheme()
      return () => {
        if (!Number.isInteger(props.maxVisible) || props.maxVisible < 1)
          throw new RangeError('maxVisible must be a positive integer.')
        const seen = new Set<string>()
        for (const person of props.members) {
          if (!person.id || seen.has(person.id))
            throw new TypeError('Avatar members require unique ids.')
          seen.add(person.id)
        }
        const visible = props.members.slice(0, props.maxVisible)
        const extra = props.members.length - visible.length
        const size = avatarSizes[props.size]
        const stride = Math.ceil(size * 0.82)
        const count = visible.length + Number(extra > 0)
        const width = count ? size + (count - 1) * stride : 0
        const colors = theme.value.colors
        const cell = (index: number) =>
          web
            ? {
                position: 'absolute',
                left: index * stride + 'px',
                top: 0,
                width: size + 'px',
                height: size + 'px',
                borderRadius: '50%',
                boxShadow: '0 0 0 2px ' + colors.surface,
              }
            : {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 2,
                borderColor: colors.surface,
                backgroundColor: colors.surface,
                clipToBounds: true,
              }
        const cells = visible.map((person, i) =>
          h(
            web ? 'span' : 'GridLayout',
            {
              key: 'member:' + person.id,
              ...(!web ? { left: i * stride, top: 0 } : {}),
              style: cell(i),
            },
            [h(ui.Avatar, { name: person.name, src: person.src, size: props.size })],
          ),
        )
        if (extra)
          cells.push(
            h(
              web ? 'span' : 'Label',
              {
                key: 'overflow',
                ...(web
                  ? {}
                  : {
                      left: visible.length * stride,
                      top: 0,
                      text: '+' + extra,
                      textAlignment: 'center',
                      verticalTextAlignment: 'middle',
                    }),
                style: {
                  ...cell(visible.length),
                  ...(web
                    ? {
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: Math.round(size * 0.32) + 'px',
                      }
                    : { fontSize: Math.round(size * 0.32) }),
                  fontWeight: '600',
                  color: colors.onPrimary,
                  backgroundColor: colors.primary,
                },
              },
              web ? '+' + extra : undefined,
            ),
          )
        return h(
          web ? 'span' : 'AbsoluteLayout',
          {
            id: props.id,
            ...(web
              ? {
                  class: 'm-avatar-group',
                  style: {
                    position: 'relative',
                    display: 'inline-block',
                    width: width + 'px',
                    height: size + 'px',
                    alignSelf: 'flex-start',
                  },
                }
              : { width, height: size, horizontalAlignment: 'left' }),
          },
          cells,
        )
      }
    },
  })
  return { MTagInput, MSearchBar, MAvatarGroup }
}
