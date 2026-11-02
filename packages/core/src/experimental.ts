/** Experimental, single-surface motion contract. No platform objects cross this boundary. */
export type MotionValues = Partial<
  Record<'scale' | 'scaleX' | 'scaleY' | 'x' | 'y' | 'rotate' | 'opacity', number>
>
export type MotionFrames = { [K in keyof MotionValues]?: number | readonly (number | null)[] }
export interface MotionOptions {
  type?: 'spring' | 'tween'
  duration?: number
  bounce?: number
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}
export interface MotionPlayback {
  readonly finished: Promise<boolean>
  stop(): void
}
export interface MotionSurface {
  readonly available: boolean
  animate(values: MotionFrames, options?: MotionOptions): MotionPlayback
  set(values: MotionValues): MotionPlayback
}
export interface MotionSurfaceAdapter {
  animate(values: MotionFrames, options?: MotionOptions): MotionPlayback
  set(values: MotionValues): MotionPlayback
}

type Binding = { adapter: MotionSurfaceAdapter; active: Set<MotionPlayback>; valid: boolean }
const bindings = new WeakMap<MotionSurface, Binding | undefined>()

export function createMotionSurface(): MotionSurface {
  const run = (invoke: (adapter: MotionSurfaceAdapter) => MotionPlayback): MotionPlayback => {
    const binding = bindings.get(surface)
    if (!binding?.valid)
      throw new Error('Motion surface is unavailable. Wait for the component to mount/load.')
    const playback = invoke(binding.adapter)
    binding.active.add(playback)
    void playback.finished.then(() => binding.active.delete(playback))
    return {
      finished: playback.finished,
      stop() {
        if (binding.valid) playback.stop()
      },
    }
  }
  const surface: MotionSurface = {
    get available() {
      return Boolean(bindings.get(surface)?.valid)
    },
    animate: (values, options) => run((adapter) => adapter.animate(values, options)),
    set: (values) => run((adapter) => adapter.set(values)),
  }
  bindings.set(surface, undefined)
  return surface
}

/** Renderer-only binding. Replacement invalidates old handles before exposing the new surface. */
export function bindMotionSurface(
  surface: MotionSurface,
  adapter: MotionSurfaceAdapter,
): () => void {
  if (!bindings.has(surface)) throw new TypeError('Use createMotionSurface() to declare a surface.')
  const invalidate = (binding: Binding) => {
    binding.valid = false
    for (const playback of binding.active) playback.stop()
    binding.active.clear()
  }
  const previous = bindings.get(surface)
  if (previous) invalidate(previous)
  const binding: Binding = { adapter, active: new Set(), valid: true }
  bindings.set(surface, binding)
  return () => {
    if (!binding.valid) return
    invalidate(binding)
    if (bindings.get(surface) === binding) bindings.set(surface, undefined)
  }
}
