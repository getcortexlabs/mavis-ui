import { defineComponent, h, mergeProps, registerElement } from 'nativescript-vue'
import { iconProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { iconFontFamily, iconGlyph, resolveIconSize } from '@getcortexlabs/mavis-core'
import { MavisLabel } from '../../native/label'
import { isIOS } from '@nativescript/core'
import { useMotionSurface } from '../use-motion-surface.js'

registerElement('MavisIcon', () => MavisLabel)

export const MIcon = defineComponent({
  name: 'MIcon',
  inheritAttrs: false,
  props: iconProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const motion = useMotionSurface(() => props.motionSurface)
    return () => {
      const size = resolveIconSize(props.size)
      return h(
        props.systemName && isIOS ? 'Image' : 'MavisIcon',
        mergeProps(
          { onLoaded: motion.onLoaded, onUnloaded: motion.onUnloaded },
          {
            id: props.id,
            key: props.systemName && isIOS ? props.systemName : 'glyph',
            ...(props.systemName && isIOS
              ? {
                  src: `sys://${props.systemName}`,
                  width: size,
                  height: size,
                  tintColor: theme.value.colors[props.tone],
                }
              : { text: iconGlyph(props.name) }),
            textWrap: false,
            accessible: Boolean(props.label),
            accessibilityHidden: !props.label,
            accessibilityRole: 'image',
            accessibilityLabel: props.label,
            style: {
              fontFamily: iconFontFamily,
              fontSize: size,
              color: theme.value.colors[props.tone],
              textAlignment: 'center',
              verticalAlignment: 'middle',
              flexShrink: 0,
            },
          },
          attrs,
        ),
      )
    }
  },
})
