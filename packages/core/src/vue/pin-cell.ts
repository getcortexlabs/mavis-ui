import { defineComponent, h, mergeProps, type Component } from '@vue/runtime-core'
import { useComponentState } from './component-motion.js'

/** Decorative cells animate independently; the real editor never moves. */
export function createPinCell(Text: Component) {
  return defineComponent({
    name: 'MPinCell',
    inheritAttrs: false,
    props: { active: Boolean, digit: String },
    setup(props, { attrs }) {
      const surface = useComponentState(
        () => ({ scale: props.active ? 1.04 : 1, opacity: props.digit ? 1 : 0.8 }),
        'feedback',
      )
      return () =>
        h(
          Text,
          mergeProps(attrs, {
            motionSurface: surface,
            text: props.digit ?? '',
            accessibilityHidden: true,
          }),
        )
    },
  })
}
