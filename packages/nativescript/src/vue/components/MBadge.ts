import { defineComponent, h, mergeProps } from 'nativescript-vue'
import { badgeProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { badgeColors } from '@getcortexlabs/mavis-core'
import { MText } from './MText.js'

export const MBadge = defineComponent({
  name: 'MBadge',
  inheritAttrs: false,
  props: badgeProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    return () =>
      h(
        MText,
        mergeProps(attrs, {
          id: props.id,
          text: String(props.text),
          variant: 'caption',
          accessibilityLabel: props.accessibilityLabel,
          accessibilityHidden: props.accessibilityHidden,
          style: {
            ...badgeColors(theme.value.colors, props.tone),
            alignSelf: 'flex-start',
            fontSize: props.size === 'sm' ? 11 : 13,
            fontWeight: '600',
            padding: props.size === 'sm' ? '3 8' : '5 10',
            borderRadius: 999,
            textAlignment: 'center',
            minWidth: props.size === 'sm' ? 22 : 28,
          },
        }),
      )
  },
})
