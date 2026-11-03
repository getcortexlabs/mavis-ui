import { expect, it, vi } from 'vitest'
import {
  bindMotionSurface,
  createMotionSurface,
  type MotionSensorAdapter,
} from '../packages/core/src/experimental.js'

it('rejects unsupported gravity before the renderer can interrupt its current presentation', () => {
  const surface = createMotionSurface(),
    animate = vi.fn(() => ({ finished: new Promise<boolean>(() => {}), stop: vi.fn() }))
  const release = bindMotionSurface(surface, { animate, set: animate })
  surface.animate({ y: 160 }, { type: 'gravity', velocity: -600 })
  for (const invalid of [{ opacity: 0 }, { y: [0, 10, 20] }, { y: Infinity }])
    expect(() => surface.animate(invalid, { type: 'gravity' })).toThrow()
  expect(() => surface.animate({ y: 160 }, { type: 'gravity', restitution: 1 })).toThrow()
  expect(animate).toHaveBeenCalledOnce()
  expect(animate.mock.results[0]!.value.stop).not.toHaveBeenCalled()
  release()
})

it('releases sensor-dependent bindings and ignores a permission result after scope disposal', async () => {
  const surface = createMotionSurface(),
    dispose = vi.fn(),
    unbind = vi.fn()
  let resolve!: (value: 'granted') => void
  const value = { get: () => 0, dispose() {} }
  const raw: MotionSensorAdapter = {
    kind: 'rotation',
    status: 'idle',
    available: false,
    paused: false,
    x: value,
    y: value,
    z: value,
    quaternion: { x: value, y: value, z: value, w: value },
    recenter() {},
    pause() {},
    resume() {},
    dispose,
    requestPermission: () =>
      new Promise((done) => {
        resolve = done
      }),
    snapshot: () => ({
      status: 'idle',
      available: false,
      timestamp: null,
      samples: 0,
      values: [],
      backend: 'none',
    }),
  }
  const release = bindMotionSurface(surface, {
    animate: () => ({ finished: Promise.resolve(true), stop() {} }),
    set: () => ({ finished: Promise.resolve(true), stop() {} }),
    sensor: () => raw,
    map: () => value,
    bind: () => ({ dispose: unbind }),
  })
  const input = surface.sensor('rotation')
  surface.bind({ rotate: input.z.to([-1, 1], [-90, 90]) })
  const permission = input.requestPermission()
  input.dispose()
  resolve('granted')
  await expect(permission).resolves.toBe('unavailable')
  expect(unbind).toHaveBeenCalledOnce()
  expect(dispose).toHaveBeenCalledOnce()
  expect(() => input.resume()).toThrow(/disposed/)
  release()
  expect(dispose).toHaveBeenCalledOnce()
})
