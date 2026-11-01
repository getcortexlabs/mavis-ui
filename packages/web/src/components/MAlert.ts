import { defineComponent, h, mergeProps } from 'vue'
import { alertProps, alertEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { alertAppearance, checkAlertLabels } from '@getcortexlabs/mavis-core'
import { MBox, MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MIcon } from './MIcon.js'
import { MButton } from './MButton.js'

export const MAlert = defineComponent({
  name: 'MAlert',
  inheritAttrs: false,
  props: alertProps,
  emits: alertEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    return () => {
      checkAlertLabels(props.title, props.dismissible, props.closeLabel)
      const { colors } = theme.value
      const appearance = alertAppearance[props.tone]
      return h(
        MColumn,
        mergeProps(
          {
            width: props.width,
            grow: props.grow,
            shrink: props.shrink,
            padding: 'md',
            gap: 'md',
            radius: 'md',
            backgroundColor: colors.surface,
            style: {
              border: `1px solid ${colors[appearance.tone]}`,
            },
          },
          attrs,
          {
            id: props.id,
            accessibilityHidden: props.accessibilityHidden,
            class: 'm-alert',
            'data-tone': props.tone,
          },
        ),
        {
          default: () => [
            h(
              MRow,
              { gap: 'sm', align: 'start' },
              {
                default: () => [
                  h(
                    MBox,
                    {
                      width: 32,
                      height: 32,
                      radius: 'sm',
                      shrink: 0,
                      backgroundColor: colors.elevated,
                      style: { placeItems: 'center' },
                    },
                    {
                      default: () =>
                        h(MIcon, { name: appearance.icon, tone: appearance.tone, size: 20 }),
                    },
                  ),
                  h(
                    MColumn,
                    {
                      width: 0,
                      grow: 1,
                      gap: 'xs',
                      role: props.announce
                        ? props.tone === 'error'
                          ? 'alert'
                          : 'status'
                        : undefined,
                      'aria-atomic': props.announce ? 'true' : undefined,
                    },
                    {
                      default: () => [
                        h(MText, { text: props.title, style: { fontWeight: '600' } }),
                        props.description
                          ? h(MText, { text: props.description, tone: 'muted' })
                          : null,
                      ],
                    },
                  ),
                  props.dismissible
                    ? h(MButton, {
                        icon: 'x',
                        variant: 'ghost',
                        size: 'sm',
                        accessibilityLabel: props.closeLabel,
                        shrink: 0,
                        style: { width: '44px', paddingLeft: 0, paddingRight: 0 },
                        onClick: () => emit('close'),
                      })
                    : null,
                ],
              },
            ),
            slots.actions
              ? h(MRow, { gap: 'sm', wrap: true, align: 'start' }, { default: slots.actions })
              : null,
          ],
        },
      )
    }
  },
})
