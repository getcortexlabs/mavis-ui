import { defineComponent, h, mergeProps, onBeforeUnmount, watch } from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import { progressProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import {
  progressSizes,
  progressMotion,
  progressState,
  checkProgressLabels,
} from '@getcortexlabs/mavis-core'
import { attachProgressMotion } from '../../native/progress'
import { useNativeViewAttrs } from '../accessibility.js'
import { MBox } from './layout.js'

export const MProgress = defineComponent({
  name: 'MProgress',
  inheritAttrs: false,
  props: progressProps,
  setup(props, { attrs }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    let track: View | undefined
    let fill: View | undefined
    let motion: ReturnType<typeof attachProgressMotion> | undefined
    function connect() {
      if (track && fill && !motion) motion = attachProgressMotion(track, fill, props.indeterminate)
    }
    function release() {
      motion?.dispose()
      motion = undefined
    }
    watch(
      () => props.indeterminate,
      (value) => motion?.update(value),
      { flush: 'post' },
    )
    onBeforeUnmount(release)
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
          nativeAttrs(),
          {
            accessible: true,
            accessibilityRole: 'progressBar',
            accessibilityLabel: props.label,
            accessibilityValue: props.indeterminate ? props.indeterminateLabel : reading.text,
            clipToBounds: true,
            onLoaded: (event: EventData) => {
              track = event.object as View
              connect()
            },
            onUnloaded: () => {
              release()
              track = undefined
            },
          },
        ),
        {
          default: () =>
            h(MBox, {
              width: fraction === 0 ? 0 : `${fraction * 100}%`,
              height: progressSizes[props.size],
              radius: 'full',
              horizontalAlignment: 'left',
              backgroundColor: theme.value.colors[props.tone],
              accessible: false,
              accessibilityHidden: true,
              isUserInteractionEnabled: false,
              onLoaded: (event: EventData) => {
                fill = event.object as View
                connect()
              },
              onUnloaded: () => {
                release()
                fill = undefined
              },
            }),
        },
      )
    }
  },
})
