import type {
  MotionImageEffectName,
  MotionImageEffectOptions,
  MotionPlayback,
} from '@getcortexlabs/mavis-core/experimental'
import type { WebRuntime, WebMotionScope } from '@rafaelaugusto/jolt/web'

type Presentation = {
  current(): boolean
  commit(src: string): Promise<boolean>
}
const images = new WeakMap<HTMLImageElement, Presentation>()
const preparations = new WeakMap<HTMLImageElement, object>()
export function registerMotionImage(target: HTMLImageElement, presentation: Presentation) {
  images.set(target, presentation)
  return () => {
    if (images.get(target) === presentation) images.delete(target)
  }
}
export function loadedMotionImage(target: HTMLElement): HTMLImageElement {
  const image = target as HTMLImageElement
  if (!images.has(image) || !image.complete || !image.naturalWidth)
    throw new TypeError('Use the ready motionSurface of MImage for pixel effects.')
  return image
}
export async function webImageEffect(
  owner: WebRuntime | WebMotionScope,
  target: HTMLElement,
  name: MotionImageEffectName,
  options: MotionImageEffectOptions = {},
  live: () => boolean = () => true,
) {
  const image = loadedMotionImage(target),
    presentation = images.get(image)!
  const { to, ...rest } = options
  const preparation = {}
  preparations.set(image, preparation)
  let destination: HTMLImageElement | undefined
  if (to !== undefined) {
    if (name !== 'dissolve' || !to.trim())
      throw new TypeError('Only dissolve accepts a nonempty destination source.')
    destination = new image.ownerDocument.defaultView!.Image()
    destination.crossOrigin = image.crossOrigin ?? 'anonymous'
    destination.src = to
    await destination.decode()
  }
  if (
    !live() ||
    preparations.get(image) !== preparation ||
    !presentation.current() ||
    images.get(image) !== presentation ||
    !image.isConnected
  )
    throw new Error('Image presentation changed while preparing the effect.')
  const previous = image.src
  const raw = owner.imageEffect(image, name, {
    ...rest,
    ...(destination ? { to: destination } : {}),
  })
  const finished = raw.finished.then(async (success) => {
    if (!success || !to || raw.progress !== 1) return success
    if (!presentation.current() || images.get(image) !== presentation) return false
    if (!live()) {
      if (image.src === destination?.src) image.src = previous
      return false
    }
    return presentation.commit(to)
  })
  return new Proxy(raw as MotionPlayback, {
    get(target, key) {
      if (key === 'then') return undefined
      if (key === 'finished') return finished
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
    set: (target, key, value) => Reflect.set(target, key, value, target),
  })
}
