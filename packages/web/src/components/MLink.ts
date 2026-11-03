import { defineComponent, h, mergeProps } from 'vue'
import { fontFamily, nonNegative } from '@getcortexlabs/mavis-core'
import {
  linkProps,
  linkEmits,
  textContent,
  useLayoutShrink,
  useMavisTheme,
  useNavigationOptions,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { webAttrs } from '../style.js'
import { navigationAttrs } from '../navigation.js'

export const MLink = defineComponent({
  name: 'MLink',
  inheritAttrs: false,
  props: linkProps,
  emits: linkEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const shrink = useLayoutShrink()
    const navigation = useNavigationOptions(props)
    return () => {
      const text = props.text ?? textContent(slots.default?.())
      if (!(props.accessibilityLabel ?? text).trim()) throw new TypeError('MLink requires a name.')
      const type = theme.value.typography.body
      return h(
        'a',
        mergeProps(webAttrs({ ...attrs, ...viewAttrs(props) }), {
          class: 'm-link',
          style: {
            '--m-focus': theme.value.colors.primary,
            display: props.inline ? 'inline' : 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: props.inline ? undefined : '44px',
            fontFamily: fontFamily(type.fontFamily, 'web'),
            fontSize: `${type.fontSize}px`,
            fontWeight: type.fontWeight,
            lineHeight: type.lineHeight,
            color: theme.value.colors.primary,
            textDecoration: 'underline',
            textUnderlineOffset: '0.18em',
            cursor: props.disabled ? 'default' : 'pointer',
            opacity: props.disabled ? 0.45 : 1,
            overflowWrap: 'anywhere',
            flexGrow: nonNegative(props.grow, 'grow'),
            flexShrink: nonNegative(props.shrink ?? shrink.value, 'shrink'),
            minWidth: 0,
          },
          ...navigationAttrs(
            navigation(),
            props.disabled,
            () => emit('click'),
            (error) => emit('error', error),
          ),
        }),
        text,
      )
    }
  },
})
