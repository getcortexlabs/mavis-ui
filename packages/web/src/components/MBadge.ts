import { useMotionSurface } from '../use-motion-surface.js'
import { fontFamily } from '@getcortexlabs/mavis-core'
import { defineComponent, h, mergeProps } from 'vue'
import {
  badgeProps,
  useMavisTheme,
  useComponentContent,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { badgeColors } from '@getcortexlabs/mavis-core'
import { webAttrs } from '../style.js'

export const MBadge = defineComponent({
  name: 'MBadge',
  inheritAttrs: false,
  props: badgeProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const content = useComponentContent(() => props.text, false)
    const motion = useMotionSurface(() => content)
    return () =>
      h(
        'span',
        mergeProps(webAttrs({ ...attrs, ...viewAttrs(props) }), {
          ...motion,
          class: 'm-badge',
          role: props.accessibilityLabel ? 'img' : undefined,
          style: {
            ...badgeColors(theme.value.colors, props.tone),
            display: 'inline-block',
            alignSelf: 'flex-start',
            boxSizing: 'border-box',
            maxWidth: '100%',
            minWidth: props.size === 'sm' ? '22px' : '28px',
            padding: props.size === 'sm' ? '3px 8px' : '5px 10px',
            borderRadius: '999px',
            fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
            fontSize: props.size === 'sm' ? '0.6875rem' : '0.8125rem',
            fontWeight: 600,
            lineHeight: 1.4,
            textAlign: 'center',
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
          },
        }),
        String(props.text),
      )
  },
})
