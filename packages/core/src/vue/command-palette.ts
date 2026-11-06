import { useComponentLayout } from './component-motion.js'
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onScopeDispose,
  ref,
  watch,
  type Component,
} from '@vue/runtime-core'
import { filterCommands, type CommandItem } from '../wayfinding.js'
import { choiceKey, type ChoiceValue } from '../choice.js'
import type { InputHandle } from '../input.js'
import { commandPaletteProps } from './wayfinding-props.js'
import { useCachedActivity } from './cached-activity.js'

export interface CommandKeyboard {
  key: string
  isComposing?: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  preventDefault(): void
}
export function createCommandPalette(
  ui: {
    Sheet: Component
    Input: Component
    Column: Component
    Row: Component
    Text: Component
    Button: Component
    Badge: Component
    focus(component: unknown): void
    shortcut?(callback: () => void, enabled: () => boolean): () => void
  },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MCommandPalette',
    inheritAttrs: false,
    props: commandPaletteProps,
    emits: {
      'update:open': (_value: boolean) => true,
      'update:query': (_value: string) => true,
      select: (_key: ChoiceValue, _item: CommandItem) => true,
    },
    setup(props, { attrs, emit }) {
      const web = platform === 'web'
      const active = useCachedActivity()
      const local = ref('')
      const input = ref<InputHandle>()
      const buttons = new Map<string, unknown>()
      const query = computed(() => props.query ?? local.value)
      const matches = computed(() => filterCommands(props.items, query.value))
      const resultsMotion = useComponentLayout(() => matches.value.map((item) => item.value), false)
      function update(value: string) {
        local.value = value
        emit('update:query', value)
      }
      function select(item: CommandItem) {
        if (!props.open || props.disabled || props.loading || item.disabled) return
        emit('select', item.value, item)
        emit('update:open', false)
      }
      let release = () => {}
      onMounted(() => {
        release =
          ui.shortcut?.(
            () => emit('update:open', !props.open),
            () => active.value && props.shortcut && !props.disabled,
          ) ?? release
      })
      onScopeDispose(() => release())
      watch(
        () => props.open,
        (open) => {
          if (!open && props.query === undefined) local.value = ''
        },
      )
      watch(
        () => props.disabled,
        (disabled) => {
          if (disabled && props.open) emit('update:open', false)
        },
      )
      function keys(event: CommandKeyboard, item?: CommandItem) {
        if (
          event.isComposing ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          props.loading ||
          props.disabled
        )
          return
        const available = matches.value.filter((entry) => !entry.disabled)
        if (!available.length) return
        const current = item ? available.findIndex((entry) => entry.value === item.value) : -1
        let next: number
        if (event.key === 'ArrowDown') next = Math.min(current + 1, available.length - 1)
        else if (event.key === 'ArrowUp') next = current < 0 ? available.length - 1 : current - 1
        else if (item && event.key === 'Home') next = 0
        else if (item && event.key === 'End') next = available.length - 1
        else if (!item && event.key === 'Enter') {
          event.preventDefault()
          select(available[0]!)
          return
        } else return
        event.preventDefault()
        if (next < 0) input.value?.focus()
        else ui.focus(buttons.get(choiceKey(available[next]!.value)))
      }
      return () => {
        if (!props.label.trim() || !props.searchLabel.trim())
          throw new TypeError('Command palette requires a title and search label.')
        return h(
          ui.Sheet,
          {
            ...attrs,
            id: props.id,
            open: props.open && !props.disabled,
            title: props.label,
            closeLabel: props.closeLabel,
            returnFocus: props.returnFocus,
            gap: 'md',
            'onUpdate:open': (open: boolean) => emit('update:open', open),
          },
          () => [
            h(ui.Input, {
              ref: input,
              label: props.searchLabel,
              placeholder: props.placeholder,
              modelValue: query.value,
              disabled: props.disabled,
              'onUpdate:modelValue': update,
              onSubmit: web
                ? undefined
                : () => {
                    const first = matches.value.find((item) => !item.disabled)
                    if (first) select(first)
                  },
              ...(web
                ? {
                    onKeydown: (event: CommandKeyboard) => keys(event),
                    onVnodeMounted: () =>
                      void nextTick(() => {
                        if (props.open) input.value?.focus()
                      }),
                  }
                : {}),
            }),
            h(
              ui.Column,
              {
                gap: 'xs',
                motionRegion: resultsMotion,
                ...(web
                  ? {
                      class: 'm-command-results',
                      role: 'group',
                      'aria-label': props.label,
                      'aria-busy': props.loading,
                    }
                  : {}),
              },
              () =>
                props.loading || !matches.value.length
                  ? h(ui.Text, {
                      text: props.loading ? props.loadingLabel : props.emptyLabel,
                      tone: 'muted',
                      ...(web ? { role: 'status' } : { accessibilityLiveRegion: 'polite' }),
                    })
                  : matches.value.flatMap((item, index) => [
                      item.group && item.group !== matches.value[index - 1]?.group
                        ? h(ui.Text, {
                            key: `group:${choiceKey(item.value)}`,
                            text: item.group,
                            variant: 'overline',
                            tone: 'muted',
                          })
                        : null,
                      h(
                        ui.Column,
                        { key: choiceKey(item.value), gap: 'xs', paddingY: 'xs' },
                        () => [
                          h(
                            ui.Button,
                            {
                              ref: (value: unknown) => {
                                if (value) buttons.set(choiceKey(item.value), value)
                                else buttons.delete(choiceKey(item.value))
                              },
                              text: item.label,
                              icon: item.icon,
                              variant: 'ghost',
                              disabled: item.disabled,
                              accessibilityLabel: `${item.label}${item.shortcut ? ` ${item.shortcut}` : ''}`,
                              ...(web
                                ? {
                                    style: { justifyContent: 'flex-start' },
                                    onKeydown: (event: CommandKeyboard) => keys(event, item),
                                  }
                                : {}),
                              onClick: () => select(item),
                            },
                            item.shortcut
                              ? {
                                  trailing: () => [
                                    web ? ' ' : null,
                                    h(ui.Badge, { text: item.shortcut, accessibilityHidden: true }),
                                  ],
                                }
                              : undefined,
                          ),
                          item.description
                            ? h(ui.Text, {
                                text: item.description,
                                variant: 'caption',
                                tone: 'muted',
                                paddingX: 'sm',
                              })
                            : null,
                        ],
                      ),
                    ]),
            ),
          ],
        )
      }
    },
  })
}
