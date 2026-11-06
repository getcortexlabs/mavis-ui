import { defineComponent, h, mergeProps, ref, watch } from 'nativescript-vue'
import type { EventData, PanGestureEventData, View } from '@nativescript/core'
import { finiteRange, positiveSize } from '@getcortexlabs/mavis-core'
import { imageCompareProps, usePartition, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useAnimatedNumber } from '../animated-number.js'
import { MColumn, MBox } from './layout.js'
import { MImage } from './MImage.js'
import { MText } from './MText.js'
import { MSlider } from './MSlider.js'

export const MImageCompare = defineComponent({
  name: 'MImageCompare',
  inheritAttrs: false,
  props: imageCompareProps,
  emits: { 'update:modelValue': (_value: number) => true },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const width = ref(300)
    const state = usePartition(
      () => finiteRange(props.modelValue, 0, 100),
      () => ({ min: 0, max: 100, step: props.step, disabled: props.disabled }),
      (value) => emit('update:modelValue', value),
    )
    const motion = useAnimatedNumber(
      () => state.canonical.value,
      () => state.dragging.value,
    )
    let origin = 50
    watch(
      () => props.orientation,
      () => state.cancel(),
    )
    return () => {
      const vertical = props.orientation === 'vertical',
        height = width.value / positiveSize(props.aspectRatio, 'aspectRatio'),
        ratio = finiteRange(motion.shown.value, 0, 100) / 100
      return h(MColumn, mergeProps(attrs, { gap: 'sm' }), () => [
        h(
          'GridLayout',
          {
            onLoaded: motion.onLoaded,
            onUnloaded: motion.onUnloaded,
            height,
            borderRadius: 16,
            clipToBounds: true,
            onLayoutChanged: (event: EventData) => {
              const next = (event.object as View).getActualSize().width
              if (next > 0 && next !== width.value) {
                state.cancel()
                width.value = next
              }
            },
          },
          [
            h(MImage, {
              src: props.after,
              alt: props.afterLabel,
              aspectRatio: props.aspectRatio,
              width: width.value,
              height,
              radius: 'none',
            }),
            h(
              'GridLayout',
              {
                width: vertical ? width.value : ratio * width.value,
                height: vertical ? ratio * height : height,
                horizontalAlignment: 'left',
                verticalAlignment: 'top',
                clipToBounds: true,
              },
              [
                h(MImage, {
                  src: props.before,
                  alt: props.beforeLabel,
                  aspectRatio: props.aspectRatio,
                  width: width.value,
                  height,
                  radius: 'none',
                  horizontalAlignment: 'left',
                  verticalAlignment: 'top',
                }),
              ],
            ),
            h('AbsoluteLayout', { accessibilityHidden: true }, [
              h(MBox, {
                left: vertical ? 0 : width.value * ratio - 1,
                top: vertical ? height * ratio - 1 : 0,
                width: vertical ? width.value : 2,
                height: vertical ? 2 : height,
                backgroundColor: '#ffffff',
              }),
              h(
                MBox,
                {
                  left: (vertical ? width.value / 2 : width.value * ratio) - 22,
                  top: (vertical ? height * ratio : height / 2) - 22,
                  width: 44,
                  height: 44,
                  radius: 'full',
                  backgroundColor: theme.value.colors.surface,
                },
                () =>
                  h(MText, {
                    text: vertical ? '↕' : '↔',
                    align: 'center',
                    variant: 'heading',
                    verticalAlignment: 'middle',
                  }),
              ),
            ]),
            h(MBox, {
              accessibilityHidden: true,
              backgroundColor: '#00000000',
              onPan: (event: PanGestureEventData) => {
                if (props.disabled) return
                if (event.state === 1) {
                  if (state.begin()) origin = state.canonical.value
                }
                if (event.state === 2 && state.dragging.value)
                  state.update(
                    origin + (vertical ? event.deltaY / height : event.deltaX / width.value) * 100,
                  )
                if (event.state === 3) state.end()
                if (event.state === 4) state.cancel()
              },
            }),
            h(MText, {
              text: props.beforeLabel,
              variant: 'caption',
              padding: theme.value.space.sm,
              backgroundColor: theme.value.colors.surface,
              horizontalAlignment: 'left',
              verticalAlignment: 'top',
              margin: 12,
              isUserInteractionEnabled: false,
            }),
            h(MText, {
              text: props.afterLabel,
              variant: 'caption',
              padding: theme.value.space.sm,
              backgroundColor: theme.value.colors.surface,
              horizontalAlignment: 'right',
              verticalAlignment: vertical ? 'bottom' : 'top',
              margin: 12,
              isUserInteractionEnabled: false,
            }),
          ],
        ),
        h(MSlider, {
          label: props.label,
          modelValue: state.canonical.value,
          min: 0,
          max: 100,
          step: props.step,
          disabled: props.disabled,
          'onUpdate:modelValue': state.update,
        }),
      ])
    }
  },
})
