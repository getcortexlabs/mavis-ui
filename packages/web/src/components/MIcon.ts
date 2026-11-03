import { defineComponent, h, mergeProps } from 'vue'
import { iconProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { iconFontFamily, iconGlyph, resolveIconSize } from '@getcortexlabs/mavis-core'
import { webAttrs } from '../style.js'
import { useMotionSurface } from '../use-motion-surface.js'

export const MIcon = defineComponent({
  name: 'MIcon',
  inheritAttrs: false,
  props: iconProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const motion = useMotionSurface(() => props.motionSurface)
    return () => {
      const size = `${resolveIconSize(props.size)}px`
      return h(
        'span',
        mergeProps(
          motion,
          {
            class: 'm-icon',
            style: {
              fontFamily: iconFontFamily,
              fontSize: size,
              width: size,
              height: size,
              lineHeight: 1,
              color: theme.value.colors[props.tone],
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            },
          },
          webAttrs({ ...attrs, id: props.id }),
          props.label ? { role: 'img', 'aria-label': props.label } : { 'aria-hidden': 'true' },
        ),
        props.motionSurface
          ? h(
              'span',
              { 'data-jolt-symbol-layer': '', 'aria-hidden': 'true' },
              iconGlyph(props.name),
            )
          : iconGlyph(props.name),
      )
    }
  },
})
