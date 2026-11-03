import { expect, it, vi } from 'vitest'
import {
  createMotionSurface,
  bindMotionSurface,
  type MotionSurfaceAdapter,
  type MotionGradient,
  type MotionValue,
  type MotionGradientAdapter,
} from '../packages/core/src/experimental.js'

function backend() {
  const complete = () => ({ finished: Promise.resolve(true), stop: vi.fn() })
  const releasePaint = vi.fn(),
    releaseBinding = vi.fn(),
    releaseLoading = vi.fn(),
    releaseCircle = vi.fn()
  const attach = vi.fn((_values: Parameters<MotionGradientAdapter['bind']>[0]) => ({
    dispose: releaseBinding,
  }))
  const adapter: MotionSurfaceAdapter = {
    animate: complete,
    set: complete,
    supports: (kind) => kind === 'gradient' || kind === 'text',
    motionValue(initial) {
      let value = initial
      return {
        get: () => value,
        set: (next) => {
          value = next
        },
        dispose: vi.fn(),
      }
    },
    gradient: (options) => ({
      type: options.type,
      suspended: false,
      animate: complete,
      set() {},
      stop() {},
      suspend() {},
      resume() {},
      bind: attach,
      dispose: releasePaint,
    }),
    shimmer: () => ({ supported: false, dispose: releaseLoading }),
    loader: () => ({ supported: false, dispose: releaseLoading }),
    circular: () => ({
      supported: false,
      reveal: complete,
      conceal: complete,
      dispose: releaseCircle,
    }),
    animateText: complete,
    rollTo: complete,
  }
  return { adapter, releasePaint, releaseBinding, releaseLoading, releaseCircle, attach }
}

it('borrows gradient values without taking their lifetime and rejects foreign presentations', () => {
  const surface = createMotionSurface(),
    other = createMotionSurface(),
    first = backend(),
    second = backend()
  const release = bindMotionSurface(surface, first.adapter),
    releaseOther = bindMotionSurface(other, second.adapter)
  const source = surface.motionValue(0.2),
    foreign = other.motionValue(0.3)
  const paint = surface.gradient({ type: 'radial', colors: ['#123456', '#abcdef'] })
  const binding = paint.bind({ center: { x: source }, radius: 0.7 })
  expect(first.attach.mock.calls[0]?.[0]).toMatchObject({ radius: 0.7 })
  expect(() => paint.bind({ center: { x: foreign } })).toThrow(/this surface/)
  expect(first.attach).toHaveBeenCalledTimes(1)
  binding.dispose()
  expect(source.get()).toBe(0.2)
  paint.bind({ radius: source })
  source.dispose()
  expect(first.releaseBinding).toHaveBeenCalledTimes(2)
  expect(paint.disposed).toBe(false)
  paint.dispose()
  release()
  releaseOther()
  expect(first.releasePaint).toHaveBeenCalledOnce()
})

it('invalidates late effects and bindings when the scoped presentation is replaced', () => {
  const surface = createMotionSurface(),
    first = backend(),
    replacement = backend()
  let paint!: MotionGradient, value!: MotionValue
  const stop = surface.use((child) => {
    value = child.motionValue(0.4)
    paint = child.gradient({ type: 'linear', colors: ['#000', '#fff'] })
    paint.bind({ angle: value })
    child.loader({ style: 'ring' })
    child.circular()
  })
  const old = bindMotionSurface(surface, first.adapter)
  const oldPaint = paint,
    oldValue = value
  const current = bindMotionSurface(surface, replacement.adapter)
  expect(oldPaint.disposed).toBe(true)
  expect(oldValue.disposed).toBe(true)
  expect(() => oldPaint.set({ angle: 120 })).toThrow(/disposed/)
  old()
  expect(paint.disposed).toBe(false)
  expect(first.releaseBinding).toHaveBeenCalledOnce()
  expect(first.releasePaint).toHaveBeenCalledOnce()
  expect(first.releaseCircle).toHaveBeenCalledOnce()
  stop()
  current()
  expect(replacement.releaseLoading).toHaveBeenCalledOnce()
})

it('reports unsupported effects explicitly and keeps their cleanup idempotent', () => {
  const surface = createMotionSurface(),
    host = backend()
  const release = bindMotionSurface(surface, host.adapter)
  expect(surface.supports('circular')).toBe(false)
  expect(surface.supports('gradient')).toBe(true)
  const loader = surface.loader()
  expect(loader.supported).toBe(false)
  loader.dispose()
  loader.dispose()
  release()
  expect(host.releaseLoading).toHaveBeenCalledOnce()
})
