import { useComponentPaint } from '../component-motion.js'
import { defineComponent, h, mergeProps, onBeforeUnmount, onMounted, ref } from 'vue'
import { progressProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import {
  progressSizes,
  progressMotion,
  progressState,
  checkProgressLabels,
} from '@getcortexlabs/mavis-core'
import { MBox } from './layout.js'

const DeterminateFill = defineComponent({
  props: { ratio: { type: Number, required: true }, color: String },
  setup(props) {
    const element = ref<HTMLElement>()
    useComponentPaint(element, () => ({ scaleX: Math.max(0.0001, props.ratio) }), 'data')
    return () =>
      h('div', {
        ref: element,
        class: 'm-progress-fill',
        'aria-hidden': 'true',
        style: {
          width: '100%',
          height: '100%',
          backgroundColor: props.color,
          borderRadius: 'inherit',
          transformOrigin: '0px 0px',
          animation: 'none',
        },
      })
  },
})

export const MProgress = defineComponent({
  name: 'MProgress',
  inheritAttrs: false,
  props: progressProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const hidden = ref(false)
    function visibility() {
      hidden.value = document.hidden
    }
    onMounted(() => {
      if (typeof document === 'undefined') return
      visibility()
      document.addEventListener('visibilitychange', visibility)
    })
    onBeforeUnmount(() => {
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', visibility)
    })
    return () => {
      checkProgressLabels(props.label, props.indeterminateLabel)
      const reading = progressState(props.value, props.max)
      const fraction = props.indeterminate ? progressMotion.segment : reading.ratio
      return h(
        MBox,
        mergeProps(
          {
            width: props.width,
            height: progressSizes[props.size],
            grow: props.grow,
            shrink: props.shrink,
            radius: 'full',
            backgroundColor: theme.value.colors.border,
          },
          attrs,
          {
            id: props.id,
            accessibilityHidden: props.accessibilityHidden,
            class: 'm-progress',
            role: 'progressbar',
            'aria-label': props.label,
            'aria-valuemin': 0,
            'aria-valuemax': props.max,
            'aria-valuenow': props.indeterminate ? undefined : reading.value,
            'aria-valuetext': props.indeterminate ? props.indeterminateLabel : reading.text,
            'data-indeterminate': props.indeterminate,
            style: {
              '--m-progress-duration': `${progressMotion.duration}ms`,
              '--m-progress-travel': `${((1 - progressMotion.segment) / progressMotion.segment) * 100}%`,
              '--m-progress-rest': `${((1 - progressMotion.segment) / progressMotion.segment) * 50}%`,
              overflow: 'hidden',
            },
          },
        ),
        {
          default: () =>
            !props.indeterminate
              ? h(DeterminateFill, { ratio: reading.ratio, color: theme.value.colors[props.tone] })
              : h('div', {
                  class: 'm-progress-fill',
                  'aria-hidden': 'true',
                  style: {
                    width: `${fraction * 100}%`,
                    height: '100%',
                    borderRadius: 'inherit',
                    backgroundColor: theme.value.colors[props.tone],
                    animationPlayState: hidden.value ? 'paused' : 'running',
                  },
                }),
        },
      )
    }
  },
})
