import { expect, it, vi } from 'vitest'
import {
  bindMotionSurface,
  createMotionSurface,
  type MotionValueAdapter,
  type MotionValue,
  type MotionSpring,
  type MotionSurface,
} from '../packages/core/src/experimental.js'

function adapter() {
  const stops = vi.fn()
  let finish!: (value: boolean) => void
  const handle = {
    finished: new Promise<boolean>((resolve) => {
      finish = resolve
    }),
    stop() {
      stops()
      finish(false)
    },
  }
  return {
    animate: vi.fn(() => handle),
    set: vi.fn(() => handle),
    handle,
    finish: (value: boolean) => finish(value),
    stops,
  }
}

it('rejects calls before availability and invalidates old handles on replacement', async () => {
  const surface = createMotionSurface()
  expect(surface.available).toBe(false)
  expect(() => surface.animate({ scale: 1.1 })).toThrow(/unavailable/)
  const first = adapter()
  const release = bindMotionSurface(surface, first)
  const old = surface.animate({ scale: 1.2 })
  const settled = vi.fn()
  void old.finished.then(settled)
  const next = adapter()
  const remove = bindMotionSurface(surface, next)
  expect(await old.finished).toBe(false)
  old.stop()
  release()
  expect(surface.available).toBe(true)
  expect(first.stops).toHaveBeenCalledTimes(1)
  expect(next.stops).not.toHaveBeenCalled()
  expect(settled).toHaveBeenCalledTimes(1)
  const current = surface.animate({ scale: 1.3 })
  expect(next.animate).toHaveBeenCalledWith({ scale: 1.3 }, undefined)
  remove()
  remove()
  expect(await current.finished).toBe(false)
  expect(next.stops).toHaveBeenCalledTimes(1)
  expect(surface.available).toBe(false)
  expect(() => surface.set({ scale: 1 })).toThrow(/unavailable/)
})

it('does not stop completed playback during disposal', async () => {
  const surface = createMotionSurface()
  const binding = adapter()
  const remove = bindMotionSurface(surface, binding)
  const handle = surface.animate({ scale: 1.2 })
  binding.finish(true)
  expect(await handle.finished).toBe(true)
  remove()
  handle.stop()
  expect(binding.stops).not.toHaveBeenCalled()
})

function continuousAdapter() {
  const bindingDisposed = vi.fn()
  const springDisposed = vi.fn()
  const valueDisposed = vi.fn()
  return {
    ...adapter(),
    motionValue(initial: number) {
      let value = initial
      return {
        get: () => value,
        set: (next: number) => {
          value = next
        },
        dispose: valueDisposed,
      }
    },
    springValue(source: MotionValueAdapter) {
      return {
        get: () => source.get(),
        getVelocity: () => 0,
        moving: false,
        paused: false,
        pause() {},
        resume() {},
        dispose: springDisposed,
      }
    },
    bind: vi.fn(() => ({ dispose: bindingDisposed })),
    bindingDisposed,
    springDisposed,
    valueDisposed,
  }
}

it('child owners release late work while borrowing parent values and keeping siblings alive', () => {
  const surface = createMotionSurface()
  const backend = continuousAdapter()
  const unload = bindMotionSurface(surface, backend)
  const parent = surface.motionValue(1.1)
  let child!: MotionSurface, sibling!: MotionSurface
  const remove = surface.use((motion) => {
    child = motion
    motion.bind({ scale: parent })
  })
  const removeSibling = surface.use((motion) => {
    sibling = motion
  })
  const late = child.motionValue(4)
  const independent = sibling.motionValue(8)
  remove()
  expect(late.disposed).toBe(true)
  expect(parent.get()).toBe(1.1)
  expect(independent.get()).toBe(8)
  expect(() => child.set({ x: 100 })).toThrow(/unavailable/)
  removeSibling()
  expect(independent.disposed).toBe(true)
  expect(parent.disposed).toBe(false)
  unload()
})

it('starts a child registered during presentation setup exactly once on every replacement', () => {
  const surface = createMotionSurface(),
    setup = vi.fn()
  surface.onAvailable(() => surface.use(setup))
  const old = bindMotionSurface(surface, continuousAdapter())
  expect(setup).toHaveBeenCalledOnce()
  const next = bindMotionSurface(surface, continuousAdapter())
  expect(setup).toHaveBeenCalledTimes(2)
  old()
  next()
})

it('rolls back child setup, rejects async setup, and still runs other cleanup after an error', () => {
  const surface = createMotionSurface()
  const backend = continuousAdapter()
  const unload = bindMotionSurface(surface, backend)
  expect(() =>
    surface.use((child) => {
      child.motionValue(1)
      throw new Error('partial')
    }),
  ).toThrow('partial')
  expect(backend.valueDisposed).toHaveBeenCalledOnce()
  expect(() => surface.use((() => Promise.resolve()) as never)).toThrow(/promise/)
  const cleanup = vi.fn()
  surface.use(() => () => {
    throw new Error('bad cleanup')
  })
  surface.use(() => cleanup)
  expect(unload).toThrow(AggregateError)
  expect(cleanup).toHaveBeenCalledOnce()
  expect(surface.available).toBe(false)
})

it('keeps values in their owning surface and cascades source disposal through followers and bindings', () => {
  const surface = createMotionSurface()
  const other = createMotionSurface()
  const backend = continuousAdapter()
  const remove = bindMotionSurface(surface, backend)
  const removeOther = bindMotionSurface(other, continuousAdapter())
  const input = surface.motionValue(1)
  const spring = surface.springValue(input)
  const binding = surface.bind({ scale: spring })
  input.set(1.2)
  expect(spring.get()).toBe(1.2)
  expect(() => other.bind({ x: input })).toThrow(/this surface/)
  expect(() => surface.springValue(spring as unknown as MotionValue)).toThrow(/live value/)
  const savedSetter = input.set
  input.dispose()
  expect(spring.disposed).toBe(true)
  expect(binding.disposed).toBe(true)
  expect(() => savedSetter(9)).toThrow(/disposed/)
  expect(() => surface.bind({ x: input })).toThrow(/live value/)
  remove()
  removeOther()
  expect(backend.bindingDisposed).toHaveBeenCalledTimes(1)
  expect(backend.springDisposed).toHaveBeenCalledTimes(1)
  expect(backend.valueDisposed).toHaveBeenCalledTimes(1)
})

it('recreates a recipe after unload and makes saved values harmless to its replacement', () => {
  const surface = createMotionSurface()
  let input: MotionValue | undefined
  let spring: MotionSpring | undefined
  const cleanup = vi.fn()
  const setup = vi.fn(() => {
    input = surface.motionValue(1)
    spring = surface.springValue(input)
    surface.bind({ scale: spring })
    return cleanup
  })
  const unsubscribe = surface.onAvailable(setup)
  expect(setup).not.toHaveBeenCalled()
  const unload = bindMotionSurface(surface, continuousAdapter())
  const old = input!
  const oldSpring = spring!
  const next = continuousAdapter()
  const unmount = bindMotionSurface(surface, next)
  expect(setup).toHaveBeenCalledTimes(2)
  expect(old.disposed).toBe(true)
  expect(oldSpring.disposed).toBe(true)
  expect(() => old.set(4)).toThrow(/disposed/)
  unload()
  old.dispose()
  oldSpring.dispose()
  expect(input!.get()).toBe(1)
  expect(next.valueDisposed).not.toHaveBeenCalled()
  unmount()
  unsubscribe()
  expect(cleanup).toHaveBeenCalledTimes(2)
})

it('disposes a partially installed recipe when setup fails', () => {
  const surface = createMotionSurface()
  const backend = continuousAdapter()
  surface.onAvailable(() => {
    surface.motionValue(0)
    throw new Error('recipe failed')
  })
  expect(() => bindMotionSurface(surface, backend)).toThrow('recipe failed')
  expect(surface.available).toBe(false)
  expect(backend.valueDisposed).toHaveBeenCalledOnce()
})

it('cascades mapped descendants and rejects saved mapping methods after source replacement', () => {
  const surface = createMotionSurface()
  const mapDisposed = vi.fn()
  const backend = {
    ...continuousAdapter(),
    map: (source: Pick<MotionValue, 'get'>) => ({
      get: () => source.get() * 2,
      dispose: mapDisposed,
    }),
  }
  const release = bindMotionSurface(surface, backend)
  const input = surface.motionValue(0.5)
  expect(() => input.to([0, 1], [0, Infinity])).toThrow(/finite/)
  expect(() => input.to([0, 1], [0])).toThrow(/pairs/)
  const derived = input.to([0, 1], [0, 2])
  const descendant = derived.to([0, 2], [0, 4])
  const binding = surface.bind({ y: descendant })
  const saved = derived.to
  input.set(0.75)
  expect(descendant.get()).toBe(3)
  derived.dispose()
  expect(descendant.disposed).toBe(true)
  expect(binding.disposed).toBe(true)
  expect(input.disposed).toBe(false)
  expect(() => saved([0, 1], [0, 1])).toThrow(/disposed/)
  release()
  expect(mapDisposed).toHaveBeenCalledTimes(2)
})

it('owns scroll links by both source and target and keeps stale source cleanup harmless', async () => {
  const { createMotionScrollSource, bindMotionScrollSource } =
    await import('../packages/core/src/experimental.js')
  const source = createMotionScrollSource()
  const surface = createMotionSurface()
  const disposed = vi.fn(),
    refresh = vi.fn()
  const backend = {
    ...adapter(),
    scrollLinked: () => ({ execution: 'scheduler' as const, refresh, dispose: disposed }),
  }
  const target = bindMotionSurface(surface, backend)
  expect(() => surface.scrollLinked(source, { y: [0, 10] }, { range: [0, 100] })).toThrow(
    /unavailable/,
  )
  const first = bindMotionScrollSource(source, { kind: 'web' })
  const old = surface.scrollLinked(source, { y: [0, 10] }, { range: [0, 100] })
  source.refresh()
  expect(refresh).toHaveBeenCalledOnce()
  const next = bindMotionScrollSource(source, { kind: 'web' })
  expect(old.disposed).toBe(true)
  const current = surface.scrollLinked(source, { y: [0, 10] }, { range: [0, 100] })
  first()
  expect(source.available).toBe(true)
  expect(current.disposed).toBe(false)
  target()
  expect(current.disposed).toBe(true)
  next()
  expect(disposed).toHaveBeenCalledTimes(2)
})
