import { defineComponent, h, mergeProps, type PropType } from 'vue'
import {
  actionEmits,
  buttonProps,
  linkEmits,
  linkProps,
  useButtonAction,
  useNavigationOptions,
  motionBoxProps,
} from '@getcortexlabs/mavis-core/vue'
import { useMotionRegion } from './motion-region.js'
import { useMotionSurface } from './use-motion-surface.js'
import { navigationAttrs } from './navigation.js'
import { webAttrs } from './style.js'

// Limit hosts to document structure. Actions and links own their interaction contracts.
const tags = [
  'div',
  'span',
  'section',
  'article',
  'header',
  'footer',
  'aside',
  'main',
  'nav',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'strong',
  'b',
  'em',
  'i',
  'small',
  'code',
  'pre',
  'blockquote',
  'ol',
  'ul',
  'li',
  'dl',
  'dt',
  'dd',
  'figure',
  'figcaption',
  'form',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'br',
  'hr',
  'sup',
  'sub',
  'time',
  'address',
  'label',
  'mark',
  'cite',
] as const
type ContentTag = (typeof tags)[number]

/** A semantic host inside a Web motion region. Site CSS controls the formatting context. */
export const MWebElement = defineComponent({
  name: 'MWebElement',
  inheritAttrs: false,
  props: {
    as: { type: String as PropType<ContentTag>, default: 'div' },
    motionRegion: motionBoxProps.motionRegion,
    motionSurface: motionBoxProps.motionSurface,
  },
  setup(props, { attrs, slots }) {
    const region = useMotionRegion(() => props.motionRegion)
    const surface = useMotionSurface(() => props.motionSurface)
    return () => {
      if (!tags.includes(props.as)) throw new TypeError('Unsupported MWebElement tag')
      return h(props.as, mergeProps(webAttrs(attrs), region, surface), slots.default?.())
    }
  },
})

/** CSS-styled form action with a rich visual label and an optional declared motion surface. */
export const MWebButton = defineComponent({
  name: 'MWebButton',
  inheritAttrs: false,
  props: {
    type: buttonProps.type,
    name: buttonProps.name,
    value: buttonProps.value,
    form: buttonProps.form,
    disabled: buttonProps.disabled,
    loading: buttonProps.loading,
    motionSurface: buttonProps.motionSurface,
    accessibilityLabel: buttonProps.accessibilityLabel,
  },
  emits: { click: actionEmits.click },
  setup(props, { attrs, slots, emit }) {
    useButtonAction()
    const enabled = () => !props.disabled && !props.loading
    const surface = useMotionSurface(() => props.motionSurface)
    return () =>
      h(
        'button',
        mergeProps(surface, webAttrs(attrs), {
          type: props.type,
          name: props.name,
          value: props.value,
          form: props.form,
          disabled: !enabled(),
          'aria-label': props.accessibilityLabel ?? attrs['aria-label'],
          'aria-busy': props.loading || undefined,
          onClick: (event: MouseEvent) => {
            if (enabled() && !event.defaultPrevented) emit('click')
          },
        }),
        slots.default?.(),
      )
  },
})

/** One real anchor, with the same destination, modifier and navigation rules as MLink. */
export const MWebLink = defineComponent({
  name: 'MWebLink',
  inheritAttrs: false,
  props: {
    href: linkProps.href,
    target: linkProps.target,
    rel: linkProps.rel,
    navigate: linkProps.navigate,
    disabled: linkProps.disabled,
    accessibilityLabel: linkProps.accessibilityLabel,
  },
  emits: linkEmits,
  setup(props, { attrs, slots, emit }) {
    const navigation = useNavigationOptions(props)
    return () =>
      h(
        'a',
        mergeProps(webAttrs(attrs), {
          'aria-label': props.accessibilityLabel ?? attrs['aria-label'],
          ...navigationAttrs(
            navigation(),
            props.disabled,
            () => emit('click'),
            (error) => emit('error', error),
          ),
        }),
        slots.default?.(),
      )
  },
})
