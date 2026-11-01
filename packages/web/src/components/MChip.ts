import { fontFamily } from '@getcortexlabs/mavis-core'
import { defineComponent, h, mergeProps } from 'vue'
import { checkChipLabels, chipColors } from '@getcortexlabs/mavis-core'
import { chipProps, chipEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { pressStyle } from '../motion.js'
import { MRow } from './layout.js'
import { MIcon } from './MIcon.js'
import { MButton } from './MButton.js'

export const MChip = defineComponent({
  name: 'MChip',
  inheritAttrs: false,
  props: chipProps,
  emits: chipEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
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
          class: 'm-chip',
          align: 'stretch',
          radius: 'full',
          style: {
            ...colors,
            display: 'inline-flex',
            maxWidth: '100%',
            alignSelf: 'flex-start',
            borderWidth: '1px',
            borderStyle: 'solid',
            opacity: props.disabled ? 0.45 : 1,
            '--m-focus': theme.value.colors[props.tone],
          },
        }),
        {
          default: () => [
            h(
              props.selectable ? 'button' : 'span',
              {
                class: 'm-chip-label',
                ...(props.selectable
                  ? {
                      type: 'button',
                      disabled: props.disabled,
                      'aria-pressed': props.modelValue,
                      'aria-label': props.label,
                      onClick: () => {
                        if (!props.disabled) emit('update:modelValue', !props.modelValue)
                      },
                    }
                  : {}),
                style: {
                  color: colors.color,
                  fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
                  fontSize: `${theme.value.typography.caption.fontSize}px`,
                  ...pressStyle(theme.value.motion.pressScale),
                },
              },
              [
                icon || props.selectable
                  ? h(MIcon, {
                      name: icon ?? 'check',
                      size: 'sm',
                      tone: selected ? props.tone : 'muted',
                      style: { flexShrink: 0, visibility: icon ? 'visible' : 'hidden' },
                    })
                  : null,
                h('span', { class: 'm-chip-text' }, props.label),
              ],
            ),
            props.removable
              ? h(MButton, {
                  icon: 'x',
                  size: 'sm',
                  variant: 'ghost',
                  disabled: props.disabled,
                  accessibilityLabel: props.removeLabel,
                  class: 'm-chip-remove',
                  style: {
                    flexShrink: 0,
                    color: colors.color,
                    borderRadius: '999px',
                    minHeight: '46px',
                    minWidth: '46px',
                    width: '46px',
                    padding: 0,
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
