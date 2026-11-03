import type { WebRuntime, WebMotionScope } from '@rafaelaugusto/jolt/web'
import type { MotionSurfaceEffectsAdapter } from '@getcortexlabs/mavis-core/experimental'
import { loadedMotionImage, webImageEffect } from './image-effects.js'

export function webSurfaceEffects(
  owner: WebRuntime | WebMotionScope,
  target: HTMLElement,
): MotionSurfaceEffectsAdapter {
  return {
    particles(options) {
      const effect = owner.particles(target, options)
      return { supported: effect.snapshot().backend !== 'none', dispose: () => effect.dispose() }
    },
    confetti(options) {
      const effect = owner.confetti(target, options)
      return { supported: effect.snapshot().backend !== 'none', dispose: () => effect.dispose() }
    },
    blur: (options) => owner.blur(target, options),
    shape: (options) => owner.shape(target, options),
    liquid(options) {
      const effect = owner.liquid(loadedMotionImage(target), options)
      return {
        supported: effect.diagnostics.backend !== 'none',
        pause: () => effect.pause(),
        resume: () => effect.play(),
        dispose: () => effect.dispose(),
      }
    },
    imageEffect: (name, options, live) => webImageEffect(owner, target, name, options, live),
    symbolEffect: (name, options) => owner.symbolEffect(target, name, options),
    followKeyboard: (options) => owner.followKeyboard(target, options),
  }
}
