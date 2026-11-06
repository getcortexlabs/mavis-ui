import { defineComponent, h, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useComponentPaint } from '../component-motion.js'

/** A separate decoration keeps the platform range input and hit target unchanged. */
export const RangeHalo = defineComponent({
  props: { active: Boolean, position: { type: Number, required: true } },
  setup(props) {
    const target = ref<HTMLElement>()
    const { theme } = useMavisTheme()
    useComponentPaint(
      target,
      () => ({ scale: props.active ? 1 : 0.65, opacity: props.active ? 0.18 : 0 }),
      'feedback',
    )
    return () =>
      h('span', {
        ref: target,
        'aria-hidden': 'true',
        style: {
          position: 'absolute',
          left: `${props.position * 100}%`,
          top: '4px',
          marginLeft: '-20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: theme.value.colors.primary,
          pointerEvents: 'none',
          opacity: 0,
        },
      })
  },
})
