import { expect, it, vi } from 'vitest'
import {
  bindMotionSurface,
  bindMotionRegion,
  createMotionSurface,
  createMotionRegion,
  type MotionPlayback,
  type MotionSurfaceAdapter,
  type MotionRegionAdapter,
} from '../packages/core/src/experimental.js'

const playback = () => ({
  finished: new Promise<boolean>(() => {}),
  stop: vi.fn(),
  progress: 0,
  paused: true,
  pause() {},
  play() {},
  reverse: vi.fn(),
  finish: vi.fn(),
})
const surfaceAdapter = (): MotionSurfaceAdapter => ({ animate: playback, set: playback })
const regionAdapter = (): MotionRegionAdapter => ({
  kind: 'web',
  viewportEnter() {
    throw new Error('unused')
  },
  sharedLayout() {
    throw new Error('unused')
  },
})
const physics = (dispose: () => void) => ({
  dispose,
  paused: false,
  pause() {},
  resume() {},
  reset() {},
  impulse() {},
  attach() {},
  spring() {},
  snapTo() {},
  snapshot: () => ({
    status: 'paused' as const,
    frames: 0,
    steps: 0,
    contacts: 0,
    droppedMs: 0,
    bodies: [],
  }),
})

it('cancels image preparation when its scoped surface ends, even if the component remains', async () => {
  const surface = createMotionSurface(),
    adapter = surfaceAdapter(),
    raw = playback()
  let resolve!: (value: MotionPlayback) => void, live!: () => boolean, result!: Promise<unknown>
  adapter.imageEffect = (_name, _options, valid) => {
    live = valid
    return new Promise((done) => {
      resolve = done
    })
  }
  const release = bindMotionSurface(surface, adapter)
  const stop = surface.use((scoped) => {
    result = scoped.imageEffect('dissolve', { to: 'next.png' })
  })
  expect(live()).toBe(true)
  stop()
  expect(surface.available).toBe(true)
  expect(live()).toBe(false)
  resolve(raw)
  await expect(result).rejects.toThrow(/changed/)
  expect(raw.stop).toHaveBeenCalledOnce()
  release()
})

it('keeps image progress accessors live and stops the operation on presentation replacement', async () => {
  const surface = createMotionSurface(),
    adapter = surfaceAdapter(),
    raw = playback()
  adapter.imageEffect = async () => raw
  const first = bindMotionSurface(surface, adapter)
  const operation = await surface.imageEffect('ripple')
  operation.progress = 0.5
  expect(raw.progress).toBe(0.5)
  operation.reverse()
  operation.finish()
  expect(raw.reverse).toHaveBeenCalledOnce()
  expect(raw.finish).toHaveBeenCalledOnce()
  const second = bindMotionSurface(surface, surfaceAdapter())
  expect(raw.stop).toHaveBeenCalledOnce()
  expect(() => operation.finish()).toThrow(/disposed/)
  first()
  second()
})

it('disposes a physics world if a body changes while native layout is pending', async () => {
  const region = createMotionRegion(),
    body = createMotionSurface(),
    dispose = vi.fn()
  let resolve!: (
    value: Awaited<ReturnType<NonNullable<MotionRegionAdapter['physicsWorld']>>>,
  ) => void
  const unbind = bindMotionRegion(region, {
    ...regionAdapter(),
    physicsWorld: () =>
      new Promise((done) => {
        resolve = done
      }),
  })
  const old = bindMotionSurface(body, surfaceAdapter())
  const pending = region.physicsWorld([{ id: 'a', target: body, x: 20, y: 20, radius: 10 }])
  const replacement = bindMotionSurface(body, surfaceAdapter())
  resolve(physics(dispose))
  await expect(pending).rejects.toThrow(/changed/)
  expect(dispose).toHaveBeenCalledOnce()
  old()
  replacement()
  unbind()
})

it('owns particles, keyboard subscriptions and a settled physics world through detach', async () => {
  const region = createMotionRegion(),
    body = createMotionSurface(),
    releaseParticles = vi.fn(),
    releaseKeyboard = vi.fn(),
    dispose = vi.fn()
  const adapter = surfaceAdapter()
  adapter.particles = () => ({ supported: true, dispose: releaseParticles })
  adapter.followKeyboard = () => ({ dispose: releaseKeyboard })
  const off = bindMotionSurface(body, adapter)
  body.particles()
  body.followKeyboard()
  const unbind = bindMotionRegion(region, {
    ...regionAdapter(),
    physicsWorld: async () => physics(dispose),
  })
  const world = await region.physicsWorld([{ id: 'a', target: body, x: 20, y: 20, radius: 10 }])
  off()
  unbind()
  world.dispose()
  expect(world.disposed).toBe(true)
  expect(dispose).toHaveBeenCalledOnce()
  expect(releaseParticles).toHaveBeenCalledOnce()
  expect(releaseKeyboard).toHaveBeenCalledOnce()
})
