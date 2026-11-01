import { defineComponent, h, mergeProps } from 'nativescript-vue'
import { checkChipLabels, chipColors } from '@getcortexlabs/mavis-core'
import { chipProps, chipEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { usePressFeedback } from '../use-press.js'
import { ActionChildren, useNativeViewAttrs } from '../accessibility.js'
import { MRow } from './layout.js'
import { MText } from './MText.js'
import { MIcon } from './MIcon.js'
import { MButton } from './MButton.js'

export const MChip = defineComponent({
  name: 'MChip',
  inheritAttrs: false,
  props: chipProps,
  emits: chipEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const lifecycle = usePressFeedback(() => props.selectable && !props.disabled, theme)
    return () => {
      checkChipLabels(props.label, props.removable, props.removeLabel)
      const selected = props.selectable && props.modelValue
      const colors = chipColors(theme.value.colors, props.tone, selected)
      const icon = selected ? 'check' : props.icon
      return h(
        MRow,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          accessibilityHidden: props.accessibilityHidden,
          align: 'stretch',
          radius: 'full',
          style: {
            ...colors,
            borderWidth: 1,
            opacity: props.disabled ? 0.45 : 1,
            alignSelf: 'flex-start',
          },
        }),
        {
          default: () => [
            h(
              MRow,
              mergeProps(
                {
                  gap: 'xs',
                  paddingX: 14,
                  paddingY: 15,
                  grow: 1,
                  shrink: 1,
                  radius: 'full',
                  accessible: true,
                  accessibilityRole: props.selectable ? 'button' : 'text',
                  accessibilityLabel: props.label,
                  // Core accepts one state token; unavailable takes precedence over selected.
                  accessibilityState: props.selectable
                    ? props.disabled
                      ? 'disabled'
                      : selected
                        ? 'selected'
                        : ''
                    : '',
                  accessibilityHidden: nativeAttrs().accessibilityHidden,
                  isEnabled: !props.disabled,
                  style: { minHeight: 46 },
                  onTap: props.selectable
                    ? () => {
                        if (!props.disabled) emit('update:modelValue', !props.modelValue)
                      }
                    : undefined,
                },
                lifecycle,
              ),
              {
                default: () =>
                  h(
                    ActionChildren,
                    { hidden: true },
                    {
                      default: () => [
                        icon || props.selectable
                          ? h(MIcon, {
                              name: icon ?? 'check',
                              size: 'sm',
                              tone: selected ? props.tone : 'muted',
                              style: { opacity: icon ? 1 : 0 },
                            })
                          : null,
                        h(MText, {
                          text: props.label,
                          variant: 'caption',
                          tone: selected ? props.tone : 'text',
                          shrink: 1,
                          style: { fontWeight: '600' },
                        }),
                      ],
                    },
                  ),
              },
            ),
            props.removable
              ? h(MButton, {
                  icon: 'x',
                  size: 'sm',
                  variant: 'ghost',
                  disabled: props.disabled,
                  accessibilityHidden: props.accessibilityHidden,
                  accessibilityLabel: props.removeLabel,
                  width: 46,
                  shrink: 0,
                  style: {
                    minHeight: 46,
                    borderRadius: 999,
                    paddingLeft: 0,
                    paddingRight: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    color: colors.color,
                    opacity: 1,
                  },
                  onClick: () => {
                    if (!props.disabled) emit('remove')
                  },
                })
              : null,
          ],
        },
      )
    }
  },
})
