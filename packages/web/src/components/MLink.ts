import { defineComponent, h, mergeProps } from 'vue'
import { fontFamily, linkDestination, linkRel, nonNegative } from '@getcortexlabs/mavis-core'
import {
  linkProps,
  linkEmits,
  textContent,
  useLayoutShrink,
  useMavisTheme,
  viewAttrs,
} from '@getcortexlabs/mavis-core/vue'
import { webAttrs } from '../style.js'

export const MLink = defineComponent({
  name: 'MLink',
  inheritAttrs: false,
  props: linkProps,
  emits: linkEmits,
  setup(props, { attrs, slots, emit }) {
    const { theme } = useMavisTheme()
    const shrink = useLayoutShrink()
    return () => {
      const href = linkDestination(props.href)
      const text = props.text ?? textContent(slots.default?.())
      if (!(props.accessibilityLabel ?? text).trim()) throw new TypeError('MLink requires a name.')
      const type = theme.value.typography.body
      return h(
        'a',
        mergeProps(webAttrs({ ...attrs, ...viewAttrs(props) }), {
          class: 'm-link',
          href: props.disabled ? undefined : href,
          target: props.target,
          rel: linkRel(props.target, props.rel),
          role: 'link',
          tabindex: props.disabled ? -1 : undefined,
          'aria-disabled': props.disabled || undefined,
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
          onClick(event: MouseEvent) {
            if (props.disabled) {
              event.preventDefault()
              return
            }
            if (event.defaultPrevented) return
            emit('click')
            if (
              !props.navigate ||
              props.target !== '_self' ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return
            event.preventDefault()
            try {
              Promise.resolve(props.navigate(href)).catch((error) => emit('error', error))
            } catch (error) {
              emit('error', error)
            }
          },
        }),
        text,
      )
    }
  },
})
