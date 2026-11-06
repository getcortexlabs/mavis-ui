import {
  defineComponent,
  h,
  markRaw,
  mergeProps,
  onScopeDispose,
  watch,
  type Component,
} from '@vue/runtime-core'
import { createMotionSurface, type MotionPlayback } from '../experimental.js'
import { animatedTextProps } from './screen-component-props.js'

export function createAnimatedText(Text: Component) {
  return defineComponent({
    name: 'MAnimatedText',
    inheritAttrs: false,
    props: animatedTextProps,
    setup(props, { attrs, expose }) {
      const surface = markRaw(createMotionSurface())
      let playback: MotionPlayback | undefined
      const validate = () => {
        if (
          !Number.isFinite(props.duration) ||
          props.duration <= 0 ||
          !Number.isFinite(props.stagger) ||
          props.stagger < 0 ||
          !Number.isFinite(props.distance) ||
          !['word', 'letter'].includes(props.by)
        )
          throw new RangeError(
            'MAnimatedText requires a positive duration, nonnegative stagger and finite distance.',
          )
      }
      function play() {
        validate()
        playback?.stop()
        if (surface.available && props.animated && props.text)
          playback = surface.animateText({
            by: props.by,
            duration: props.duration,
            stagger: props.stagger,
            y: props.distance,
          })
      }
      onScopeDispose(
        surface.use(() => {
          if (props.appear) play()
          return () => {
            playback?.stop()
            playback = undefined
          }
        }),
      )
      watch(() => [props.text, props.replayKey, props.by, props.animated], play, { flush: 'post' })
      onScopeDispose(() => playback?.stop())
      expose({ replay: play })
      return () => {
        validate()
        return h(
          Text,
          mergeProps(attrs, {
            id: props.id,
            text: props.text,
            variant: props.variant,
            tone: props.tone,
            motionSurface: surface,
          }),
        )
      }
    },
  })
}
