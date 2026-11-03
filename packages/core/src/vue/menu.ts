import { defineComponent, h, type Component } from '@vue/runtime-core'
import { choiceKey, type ChoiceValue } from '../choice.js'
import { validateMenu, type MenuAction } from '../collections.js'
import type { PopoverCloseReason } from '../popover.js'
import { menuProps } from './navigation-props.js'
import { MThemeProvider } from './theme-provider.js'
import { useMavisTheme } from './theme.js'

export function createMenu(
  ui: {
    Popover: Component
    Column: Component
    Text: Component
    Button: Component
    Separator: Component
  },
  keyboard?: (event: unknown) => void,
) {
  return defineComponent({
    name: 'MMenu',
    inheritAttrs: false,
    props: menuProps,
    emits: {
      'update:open': (_open: boolean) => true,
      select: (_value: ChoiceValue, _item: MenuAction) => true,
      close: (_reason: PopoverCloseReason) => true,
    },
    setup(props, { attrs, emit }) {
      const { theme } = useMavisTheme()
      return () => {
        validateMenu(props.items)
        const { items: _items, ...presentation } = props
        return h(
          ui.Popover,
          {
            ...attrs,
            ...presentation,
            role: 'menu',
            padding: 'xs',
            'onUpdate:open': (open: boolean) => emit('update:open', open),
            onClose: (reason: PopoverCloseReason) => emit('close', reason),
          },
          () =>
            h(ui.Column, { gap: 'xs', ...(keyboard ? { onKeydown: keyboard } : {}) }, () =>
              props.items.map((item) => {
                if ('type' in item)
                  return item.type === 'separator'
                    ? h(ui.Separator, { key: `decoration:${item.key}` })
                    : h(ui.Text, {
                        key: `decoration:${item.key}`,
                        text: item.label,
                        accessibilityLabel: item.label,
                        variant: 'overline',
                        tone: 'muted',
                      })
                const action = () =>
                  h(ui.Button, {
                    key: choiceKey(item.value),
                    text: item.label,
                    accessibilityLabel: item.label,
                    icon: item.icon,
                    variant: 'ghost',
                    disabled: item.disabled,
                    ...(keyboard
                      ? {
                          role: 'menuitem',
                          tabindex: -1,
                          style: {
                            justifyContent: 'flex-start',
                            color: item.destructive ? theme.value.colors.danger : undefined,
                          },
                        }
                      : {}),
                    onClick: () => {
                      if (!props.open || props.disabled || item.disabled) return
                      emit('select', item.value, item)
                      emit('update:open', false)
                      emit('close', 'select')
                    },
                  })
                return h(
                  MThemeProvider,
                  {
                    key: choiceKey(item.value),
                    theme: item.destructive
                      ? {
                          ...theme.value,
                          colors: { ...theme.value.colors, text: theme.value.colors.danger },
                        }
                      : theme.value,
                  },
                  action,
                )
              }),
            ),
        )
      }
    },
  })
}
