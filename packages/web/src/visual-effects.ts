import type {
  WebRuntime,
  WebMotionScope,
  WebReadableValue,
  WebColorValue,
} from '@rafaelaugusto/jolt/web'
import { webSurfaceEffects } from './surface-effects.js'
import {
  mapGradientBindings,
  type MotionVisualAdapter,
  type MotionCircular,
  type MotionPlayback,
} from '@getcortexlabs/mavis-core/experimental'

const circles = new WeakMap<HTMLElement, { dispose(): void }>()
export function webVisualEffects(
  owner: WebRuntime | WebMotionScope,
  target: HTMLElement,
  sources: WeakMap<object, WebReadableValue>,
  plainText: () => boolean,
): MotionVisualAdapter {
  const text = () => {
    if (!plainText())
      throw new TypeError(
        'Declare a motionSurface on MText with an explicit text prop; rich/slotted text is unsupported.',
      )
    return target
  }
  return {
    ...webSurfaceEffects(owner, target),
    supports: (effect) =>
      effect === 'text'
        ? plainText()
        : effect === 'image' || effect === 'liquid'
          ? target.tagName === 'IMG'
          : true,
    gradient(options) {
      const paint = owner.gradient(target, options)
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
              (value) => sources.get(value) ?? (value as WebReadableValue),
              (value) => value as WebColorValue,
            ),
          )
          return { dispose }
        },
        dispose: () => paint.dispose(),
      }
    },
    shimmer(options) {
      const effect = owner.shimmer(target, options)
      return { supported: true, dispose: () => effect.dispose() }
    },
    loader(options) {
      const effect = owner.loader(target, options)
      return { supported: true, dispose: () => effect.dispose() }
    },
    animateText: (options) => owner.animateText(text(), options),
    rollTo: (value, options) => owner.rollTo(text(), value, options),
    circular() {
      circles.get(target)?.dispose()
      const inert = target.getAttribute('inert'),
        hidden = target.getAttribute('aria-hidden')
      const visibility = target.style.visibility
      let locked = false,
        active: MotionPlayback | undefined,
        generation = 0,
        disposed = false
      let writtenVisibility: string | undefined
      const unlock = () => {
        if (!locked) return
        locked = false
        if (target.getAttribute('inert') === '') {
          if (inert === null) target.removeAttribute('inert')
          else target.setAttribute('inert', inert)
        }
        if (target.getAttribute('aria-hidden') === 'true') {
          if (hidden === null) target.removeAttribute('aria-hidden')
          else target.setAttribute('aria-hidden', hidden)
        }
      }
      const run = (open: boolean, options: Parameters<MotionCircular['reveal']>[0] = {}) => {
        if (!open && target.contains(target.ownerDocument.activeElement))
          throw new Error('Move focus outside the circular surface before conceal().')
        // Jolt validates options before replacing the active circle.
        const handle = open
          ? owner.reveal(target, { from: options.origin, duration: options.duration })
          : owner.conceal(target, { to: options.origin, duration: options.duration })
        const token = ++generation
        active = handle
        writtenVisibility = target.style.visibility
        if (open) unlock()
        else {
          locked = true
          target.setAttribute('inert', '')
          target.setAttribute('aria-hidden', 'true')
        }
        void handle.finished.then((completed) => {
          if (token !== generation || disposed) return
          active = undefined
          if (completed) writtenVisibility = target.style.visibility
          if (!completed && target.style.visibility !== 'hidden') unlock()
        })
        return handle
      }
      const control = {
        supported: true,
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
            if (writtenVisibility !== undefined && target.style.visibility === writtenVisibility)
              target.style.visibility = visibility
          }
        },
      }
      circles.set(target, control)
      return control
    },
  }
}
