import { Image, isIOS, isAndroid, type View } from '@nativescript/core'
import { particles, confetti, liquid, symbolEffect, followKeyboard } from '@rafaelaugusto/jolt'
import { blur } from '@rafaelaugusto/jolt/blur'
import { shape } from '@rafaelaugusto/jolt/shapes'
import type { MotionSurfaceEffectsAdapter } from '@getcortexlabs/mavis-core/experimental'
import { loadedMotionImage, nativeImageEffect } from './image-effects.js'

export function nativeSurfaceEffects(target: View): MotionSurfaceEffectsAdapter {
  return {
    particles: (options) => ({
      supported: isIOS || isAndroid,
      dispose: particles(target, options),
    }),
    confetti: (options) => ({ supported: isIOS || isAndroid, dispose: confetti(target, options) }),
    blur: (options) => blur(target, options),
    shape: (options) => shape(target, options),
    liquid(options) {
      const effect = liquid(loadedMotionImage(target), options)
      return {
        supported: isIOS,
        pause: () => effect.pause(),
        resume: () => effect.resume(),
        dispose: () => effect.stop(),
      }
    },
    imageEffect: (name, options, live) => nativeImageEffect(target, name, options, live),
    symbolEffect: (name, options) =>
      target instanceof Image
        ? symbolEffect(target, name, options)
        : { finished: Promise.resolve(false), stop() {} },
    followKeyboard: (options) => ({ dispose: followKeyboard(target, options) }),
  }
}
