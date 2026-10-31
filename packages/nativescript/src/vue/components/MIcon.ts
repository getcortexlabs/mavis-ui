import { defineComponent, h, mergeProps, registerElement } from 'nativescript-vue'
import { iconProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { iconFontFamily, iconGlyph, resolveIconSize } from '@getcortexlabs/mavis-core'
import { MavisLabel } from '../../native/label'

registerElement('MavisIcon', () => MavisLabel)

export const MIcon = defineComponent({
  name: 'MIcon',
  inheritAttrs: false,
  props: iconProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    return () => {
      const size = resolveIconSize(props.size)
      return h(
        'MavisIcon',
        mergeProps(
          {
            id: props.id,
            text: iconGlyph(props.name),
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
