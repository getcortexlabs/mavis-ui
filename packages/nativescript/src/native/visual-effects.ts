import { Label, Image, isIOS, type View } from '@nativescript/core'
import { nativeSurfaceEffects } from './surface-effects.js'
import {
  gradient,
  shimmer,
  loader,
  reveal,
  conceal,
  animateText,
  rollTo,
  type DerivedValue,
  type DerivedColor,
} from '@rafaelaugusto/jolt'
import {
  mapGradientBindings,
  type MotionVisualAdapter,
  type MotionCircular,
  type MotionPlayback,
} from '@getcortexlabs/mavis-core/experimental'

const circles = new WeakMap<View, { dispose(): void }>()
export function nativeVisualEffects(
  target: View,
  sources: WeakMap<object, DerivedValue>,
  colors: WeakMap<object, DerivedColor>,
  plainText: () => boolean,
): MotionVisualAdapter {
  const text = () => {
    if (!plainText() || !(target instanceof Label) || target.formattedText)
      throw new TypeError(
        'Declare a motionSurface on MText with an explicit text prop; rich/slotted text is unsupported.',
      )
    return target
  }
  return {
    ...nativeSurfaceEffects(target),
    supports: (effect) => {
      if (effect === 'text') return plainText()
      if (effect === 'symbol')
        return isIOS && target instanceof Image && Boolean(target.ios?.image?.symbolImage)
      if (effect === 'image') return target instanceof Image
      if (effect === 'liquid') return isIOS && target instanceof Image
      if (effect === 'shadow') {
        // Android draws CSS shadows from a cached shape and elevation is a different model.
        const shadows = (target as View & { boxShadow?: unknown }).boxShadow
        return isIOS && Array.isArray(shadows) && shadows.length === 1 && !shadows[0]?.inset
      }
      return (
        ['gradient', 'particles', 'confetti', 'blur', 'shape', 'keyboard'].includes(effect) || isIOS
      )
    },
    gradient(options) {
      const paint = gradient(target, options)
      return {
        type: paint.type,
        get suspended() {
          return paint.suspended
        },
        animate: (values, options) => paint.animate(values, options),
        set: (values) => paint.set(values),
        stop: () => paint.stop(),
        suspend: () => paint.suspend(),
        resume: () => paint.resume(),
        bind(values) {
          const dispose = paint.bind(
            mapGradientBindings(
              values,
              (value) => sources.get(value)!,
              (value) => colors.get(value)!,
            ),
          )
          return { dispose }
        },
        dispose: () => paint.remove(),
      }
    },
    shimmer: (options) => ({ supported: isIOS, dispose: shimmer(target, options) }),
    loader: (options) => ({ supported: isIOS, dispose: loader(target, options) }),
    animateText: (options) => animateText(text(), options),
    rollTo: (value, options) => rollTo(text(), value, options),
    circular() {
      circles.get(target)?.dispose()
      const hidden = target.accessibilityHidden,
        interactive = target.isUserInteractionEnabled
      const visibility = target.visibility
      let active: MotionPlayback | undefined,
        locked = false,
        generation = 0,
        disposed = false
      let writtenVisibility: View['visibility'] | undefined
      const focused = (view: View): boolean => {
        if (view.ios?.isFirstResponder) return true
        let found = false
        view.eachChildView((child) => {
          found = focused(child)
          return !found
        })
        return found
      }
      const unlock = () => {
        if (!locked) return
        locked = false
        if (target.accessibilityHidden) target.accessibilityHidden = hidden
        if (!target.isUserInteractionEnabled) target.isUserInteractionEnabled = interactive
      }
      const run = (open: boolean, options: Parameters<MotionCircular['reveal']>[0] = {}) => {
        if (isIOS && !open && focused(target))
          throw new Error('Move focus outside the circular surface before conceal().')
        const handle = open
          ? reveal(target, { from: options.origin, duration: options.duration })
          : conceal(target, { to: options.origin, duration: options.duration })
        const token = ++generation
        active = handle
        if (isIOS) writtenVisibility = target.visibility
        if (isIOS) {
          if (open) unlock()
          else {
            locked = true
            target.accessibilityHidden = true
            target.isUserInteractionEnabled = false
          }
        }
        void handle.finished.then((completed) => {
          if (token !== generation || disposed) return
          active = undefined
          if (completed && isIOS) writtenVisibility = target.visibility
          if (!completed && target.visibility !== 'hidden') unlock()
        })
        return handle
      }
      const control = {
        supported: isIOS,
        reveal: (options?: Parameters<MotionCircular['reveal']>[0]) => run(true, options),
        conceal: (options?: Parameters<MotionCircular['conceal']>[0]) => run(false, options),
        dispose() {
          if (disposed) return
          disposed = true
          generation++
          active?.stop()
          unlock()
          if (circles.get(target) === control) {
            circles.delete(target)
            if (isIOS && writtenVisibility !== undefined && target.visibility === writtenVisibility)
              target.visibility = visibility
          }
        },
      }
      circles.set(target, control)
      return control
    },
  }
}
