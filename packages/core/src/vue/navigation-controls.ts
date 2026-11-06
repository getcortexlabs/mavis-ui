import { useComponentSelection, useComponentLayout } from './component-motion.js'
import { defineComponent, h, inject, mergeProps, type Component } from '@vue/runtime-core'
import { choiceKey } from '../choice.js'
import { validateNavigation } from '../collections.js'
import { appBarProps, tabBarProps } from './navigation-props.js'
import { navigationKey } from './navigation.js'
import { useMavisTheme } from './theme.js'

export function createNavigationControls(
  ui: {
    Box: Component
    Row: Component
    Column: Component
    Text: Component
    Button: Component
    Badge: Component
  },
  platform: 'web' | 'native',
) {
  const MAppBar = defineComponent({
    name: 'MAppBar',
    inheritAttrs: false,
    props: appBarProps,
    emits: { back: () => true, error: (_error: unknown) => true },
    setup(props, { attrs, slots, emit }) {
      const navigation = inject(navigationKey, undefined)
      const { theme } = useMavisTheme()
      async function back() {
        try {
          const navigate = props.navigateBack ?? navigation?.back
          if (!navigate) throw new Error('MAppBar back requires navigation or navigateBack.')
          await navigate()
          emit('back')
        } catch (error) {
          emit('error', error)
        }
      }
      return () => {
        if (!props.title.trim()) throw new TypeError('App bars require a title.')
        return h(
          ui.Row,
          mergeProps(
            {
              id: props.id,
              padding: 'md',
              gap: 'md',
              shrink: 0,
              backgroundColor: theme.value.colors.surface,
            },
            attrs,
            platform === 'web'
              ? { role: 'group', 'aria-label': props.title, class: 'm-app-bar' }
              : {},
          ),
          () => [
            props.back
              ? h(ui.Button, {
                  icon: 'arrow-left',
                  accessibilityLabel: props.backLabel,
                  variant: 'ghost',
                  onClick: back,
                })
              : null,
            slots.leading?.(),
            h(ui.Column, { grow: 1, shrink: 1, gap: 'xs' }, () => [
              h(ui.Text, { text: props.title, variant: 'heading', as: 'h1' }),
              props.subtitle
                ? h(ui.Text, { text: props.subtitle, variant: 'caption', tone: 'muted' })
                : null,
            ]),
            slots.actions?.(),
          ],
        )
      }
    },
  })
  const MTabBar = defineComponent({
    name: 'MTabBar',
    inheritAttrs: false,
    props: tabBarProps,
    emits: { error: (_error: unknown) => true },
    setup(props, { attrs, emit }) {
      const { theme } = useMavisTheme()
      const selection = useComponentSelection(() => props.modelValue)
      return () => {
        validateNavigation(props.items)
        if (!props.label.trim()) throw new TypeError('Tab bars require a navigation label.')
        return h(
          ui.Row,
          mergeProps(
            {
              id: props.id,
              motionRegion: selection.region,
              gap: 'xs',
              padding: 'sm',
              shrink: 0,
              backgroundColor: theme.value.colors.surface,
            },
            attrs,
            platform === 'web'
              ? {
                  role: 'navigation',
                  'aria-label': props.label,
                  class: 'm-tab-bar',
                  style: props.safeArea
                    ? {
                        paddingBottom:
                          'max(var(--m-tab-padding, 8px), env(safe-area-inset-bottom))',
                      }
                    : undefined,
                }
              : { accessibilityLabel: props.label },
          ),
          () =>
            props.items.map((item) => {
              const current = item.value === props.modelValue
              return h(
                ui.Button,
                {
                  key: choiceKey(item.value),
                  grow: 1,
                  shrink: 1,
                  text: item.label,
                  icon: item.icon,
                  href: item.href,
                  navigate: item.navigate,
                  disabled: props.disabled || item.disabled,
                  variant: current ? 'primary' : 'ghost',
                  accessibilityLabel: `${item.label}${item.badge !== undefined ? ` ${item.badge}` : ''}${current && platform === 'native' ? `. ${props.currentLabel}` : ''}`,
                  ...(platform === 'web' ? { 'aria-current': current ? 'page' : undefined } : {}),
                  onError: (error: unknown) => emit('error', error),
                },
                {
                  trailing: () =>
                    h(ui.Row, { gap: 'xs' }, () => [
                      platform === 'web' && item.badge !== undefined ? ' ' : null,
                      current
                        ? h(ui.Box, {
                            width: 5,
                            height: 5,
                            radius: 'full',
                            backgroundColor: theme.value.colors.onPrimary,
                            motionSurface: selection.marker,
                            accessibilityHidden: true,
                          })
                        : null,
                      item.badge !== undefined
                        ? h(ui.Badge, { text: String(item.badge), accessibilityHidden: true })
                        : null,
                    ]),
                },
              )
            }),
        )
      }
    },
  })
  return { MAppBar, MTabBar }
}
