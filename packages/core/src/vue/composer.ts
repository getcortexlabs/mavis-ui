import {
  computed,
  defineComponent,
  h,
  inject,
  type InjectionKey,
  markRaw,
  mergeProps,
  onScopeDispose,
  ref,
  watch,
  type Component,
} from '@vue/runtime-core'
import { createMotionSurface } from '../experimental.js'
import type { ComposerMessage } from '../screen-components.js'
import { composerProps } from './screen-component-props.js'
import { useComponentLayout } from './component-motion.js'

import { useCachedActivity } from './cached-activity.js'

/** Whether the enclosing layout already fits the software keyboard. */
export const keyboardViewportOwner: InjectionKey<() => boolean> = Symbol('mavis-keyboard-viewport')

export function createComposer(
  ui: {
    Box: Component
    Card: Component
    Row: Component
    Column: Component
    Input: Component
    Button: Component
    Chip: Component
    Text: Component
  },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MComposer',
    inheritAttrs: false,
    props: composerProps,
    emits: {
      'update:modelValue': (_v: string) => true,
      'update:attachments': (_v: unknown[]) => true,
      submit: (_message: ComposerMessage) => true,
      attach: () => true,
      focus: () => true,
      blur: () => true,
    },
    setup(props, { attrs, emit, expose, slots }) {
      const editor = ref<{ focus(): void; blur(): void }>()
      const surface = markRaw(createMotionSurface())
      const layout = useComponentLayout(() => props.attachments.map((a) => a.id))
      const blocked = computed(() => props.disabled || props.readonly || props.loading)
      const canSend = computed(
        () => !blocked.value && Boolean(props.modelValue.trim() || props.attachments.length),
      )
      const active = useCachedActivity()
      const viewportOwned = inject(keyboardViewportOwner, () => false)
      onScopeDispose(
        surface.use(() =>
          watch(
            () => [props.followKeyboard, props.keyboardOffset, viewportOwned(), active.value],
            (_, __, cleanup) => {
              if (props.followKeyboard && active.value && !viewportOwned()) {
                const follow = surface.followKeyboard({ offset: props.keyboardOffset })
                cleanup(() => follow.dispose())
              }
            },
            { immediate: true, flush: 'post' },
          ),
        ),
      )
      const submit = () => {
        if (canSend.value)
          emit('submit', {
            text: props.modelValue,
            attachments: props.attachments.map((a) => ({ ...a })),
          })
      }
      expose({ focus: () => editor.value?.focus(), blur: () => editor.value?.blur() })
      return () => {
        const ids = new Set(props.attachments.map((a) => a.id))
        if (ids.size !== props.attachments.length)
          throw new TypeError('Composer attachments require unique ids.')
        return h(
          ui.Box,
          mergeProps(attrs, {
            motionSurface: surface,
            ...(platform === 'web'
              ? {
                  class: 'm-composer',
                  role: 'group',
                  'aria-label': props.label,
                  onKeydown: (e: KeyboardEvent) => {
                    if (
                      props.shortcut &&
                      e.key === 'Enter' &&
                      (e.ctrlKey || e.metaKey) &&
                      !e.isComposing &&
                      e.keyCode !== 229 &&
                      !e.defaultPrevented
                    ) {
                      e.preventDefault()
                      submit()
                    }
                  },
                }
              : {}),
          }),
          {
            default: () =>
              h(
                ui.Card,
                { padding: 'md', gap: 'sm', motionRegion: layout },
                {
                  default: () => [
                    h(ui.Input, {
                      ref: editor,
                      id: props.id,
                      label: props.label,
                      modelValue: props.modelValue,
                      multiline: true,
                      rows: props.rows,
                      maxLength: props.maxLength,
                      placeholder: props.placeholder,
                      error: props.error,
                      disabled: props.disabled,
                      readonly: props.readonly || props.loading,
                      'onUpdate:modelValue': (value: string) => {
                        if (!blocked.value) emit('update:modelValue', value)
                      },
                      onFocus: () => emit('focus'),
                      onBlur: () => emit('blur'),
                    }),
                    props.attachments.length
                      ? h(
                          ui.Row,
                          { gap: 'xs', wrap: true },
                          {
                            default: () =>
                              props.attachments.map((a) =>
                                h(ui.Chip, {
                                  key: a.id,
                                  label: a.name,
                                  removable: true,
                                  removeLabel: `${props.removeLabel}: ${a.name}`,
                                  disabled: blocked.value,
                                  onRemove: () => {
                                    if (!blocked.value)
                                      emit(
                                        'update:attachments',
                                        props.attachments.filter((item) => item.id !== a.id),
                                      )
                                  },
                                }),
                              ),
                          },
                        )
                      : null,
                    slots.default?.(),
                    h(
                      ui.Row,
                      { gap: 'sm', align: 'center', justify: 'between', wrap: true },
                      {
                        default: () => [
                          props.attachable
                            ? h(ui.Button, {
                                text: props.attachLabel,
                                icon: 'paperclip',
                                variant: 'ghost',
                                size: 'sm',
                                disabled: blocked.value,
                                onClick: () => {
                                  if (!blocked.value) emit('attach')
                                },
                              })
                            : null,
                          h(ui.Button, {
                            text: props.sendLabel,
                            icon: 'arrow-up',
                            size: 'sm',
                            disabled: !canSend.value && !props.loading,
                            loading: props.loading,
                            loadingText: props.sendingLabel,
                            onClick: submit,
                          }),
                        ],
                      },
                    ),
                  ],
                },
              ),
          },
        )
      }
    },
  })
}
