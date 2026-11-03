import { Image, type View } from '@nativescript/core'
import { imageEffect } from '@rafaelaugusto/jolt'
import type {
  MotionImageEffectName,
  MotionImageEffectOptions,
  MotionPlayback,
} from '@getcortexlabs/mavis-core/experimental'
import { loadAvatarImage } from './avatar-image.js'

type Presentation = {
  current(): boolean
  commit(src: string, image: Image['imageSource']): Promise<boolean>
}
const images = new WeakMap<Image, Presentation>()
const preparations = new WeakMap<Image, object>()
export function registerMotionImage(target: Image, presentation: Presentation) {
  images.set(target, presentation)
  return () => {
    if (images.get(target) === presentation) images.delete(target)
  }
}
export function loadedMotionImage(target: View): Image {
  if (!(target instanceof Image) || !images.has(target) || !target.imageSource)
    throw new TypeError('Use the ready motionSurface of MImage for pixel effects.')
  return target
}
export async function nativeImageEffect(
  target: View,
  name: MotionImageEffectName,
  options: MotionImageEffectOptions = {},
  live: () => boolean = () => true,
) {
  const image = loadedMotionImage(target),
    presentation = images.get(image)!
  const { to, ...rest } = options
  if (to !== undefined && (name !== 'dissolve' || !to.trim()))
    throw new TypeError('Only dissolve accepts a nonempty destination source.')
  const preparation = {}
  preparations.set(image, preparation)
  const destination = to === undefined ? undefined : await loadAvatarImage(to)
  if (to !== undefined && !destination) throw new Error('Destination image could not be decoded.')
  if (
    !live() ||
    preparations.get(image) !== preparation ||
    !presentation.current() ||
    images.get(image) !== presentation ||
    !image.isLoaded
  )
    throw new Error('Image presentation changed while preparing the effect.')
  const previous = image.imageSource
  const raw = imageEffect(image, name, { ...rest, ...(destination ? { to: destination } : {}) })
  const finished = raw.finished.then(async (success) => {
    if (!success || !to || raw.progress !== 1) return success
    if (!presentation.current() || images.get(image) !== presentation) return false
    if (!live()) {
      if (image.imageSource === destination) image.imageSource = previous
      return false
    }
    return presentation.commit(to, destination!)
  })
  return new Proxy(raw as MotionPlayback, {
    get(target, key) {
      // Native animations are thenable; returning one from an async factory would await completion.
      if (key === 'then') return undefined
      if (key === 'finished') return finished
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
    set: (target, key, value) => Reflect.set(target, key, value, target),
  })
}
