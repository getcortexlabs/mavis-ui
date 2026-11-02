import { expect, it, vi } from 'vitest'
import {
  bindMotionSurface,
  createMotionSurface,
  bindMotionRegion,
  createMotionRegion,
  type MotionSurfaceAdapter,
  type MotionValueAdapter,
  type MotionPlayback,
} from '../packages/core/src/experimental.js'

function playback() {
  let finish!: (value: boolean) => void
  const handle = {
    finished: new Promise<boolean>((resolve) => {
      finish = resolve
    }),
    progress: 0,
    duration: 1200,
    paused: false,
    stop: vi.fn(() => finish(false)),
    pause() {
      handle.paused = true
    },
    play() {
      handle.paused = false
    },
  }
  return handle
}
function adapter() {
  const animation = playback()
  const scalar = vi.fn((..._args: unknown[]) => animation)
  const progress = { get: () => animation.progress, dispose: vi.fn() }
  const port: MotionSurfaceAdapter = {
    animate: () => animation,
    set: () => animation,
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
    map(value) {
      return { get: () => value.get(), dispose: vi.fn() }
    },
    animateValue: scalar,
    stopValue: vi.fn(),
    playbackProgress: vi.fn(() => progress),
    decay: () => animation,
  }
  return { port, animation, scalar, progress }
}

it('preserves the original scalar/clock and does not stop borrowed playback when progress is disposed', () => {
  const surface = createMotionSurface(),
    native = adapter()
  const release = bindMotionSurface(surface, native.port)
  const value = surface.motionValue(0)
  const handle = surface.animateValue(value, [0, 1], { layer: 'accent', duration: 1200 })
  const rawValue = native.scalar.mock.calls[0]![0] as MotionValueAdapter
  expect(rawValue).not.toBe(value)
  expect(rawValue.get()).toBe(0)
  handle.pause()
  expect(native.animation.paused).toBe(true)
  handle.progress = 0.6
  const progress = surface.playbackProgress(handle)
  expect(native.port.playbackProgress).toHaveBeenCalledWith(native.animation)
  expect(progress.get()).toBe(0.6)
  progress.dispose()
  expect(native.progress.dispose).toHaveBeenCalledOnce()
  expect(native.animation.stop).not.toHaveBeenCalled()
  handle.resume()
  expect(native.animation.paused).toBe(false)
  surface.stopValue(value, { layer: 'accent' })
  expect(native.port.stopValue).toHaveBeenCalledWith(rawValue, { layer: 'accent' })
  value.dispose()
  expect(native.animation.stop).toHaveBeenCalledOnce()
  release()
  expect(() => handle.pause()).toThrow(/disposed/)
})

it('rejects derived, foreign and stale inputs before taking scalar playback ownership', () => {
  const a = createMotionSurface(),
    b = createMotionSurface(),
    portA = adapter(),
    portB = adapter()
  const releaseA = bindMotionSurface(a, portA.port)
  bindMotionSurface(b, portB.port)
  const value = a.motionValue(1),
    derived = value.to([0, 1], [0, 2])
  expect(() => a.animateValue(derived as typeof value, 3)).toThrow(/live value/)
  expect(() => b.animateValue(value, 3)).toThrow(/live value/)
  const animation = a.animateValue(value, 3)
  expect(() => b.playbackProgress(animation)).toThrow(/this surface/)
  releaseA()
  bindMotionSurface(a, adapter().port)
  expect(() => a.animateValue(value, 3)).toThrow(/live value/)
  expect(() => a.playbackProgress(animation)).toThrow(/this surface/)
  expect(portA.scalar).toHaveBeenCalledOnce()
  expect(portB.scalar).not.toHaveBeenCalled()
})

it('passes actual factory playback to Jolt and cancels a group when a tuple target disappears', async () => {
  const region = createMotionRegion(),
    surface = createMotionSurface(),
    port = adapter()
  const detach = bindMotionSurface(surface, port.port)
  const group = playback()
  const sequence = vi.fn((..._args: unknown[]) => group)
  const release = bindMotionRegion(region, {
    kind: 'web',
    viewportEnter: vi.fn(),
    sharedLayout: vi.fn(),
    sequence,
  })
  const run = region.sequence([[surface, { x: 20 }], () => surface.animate({ scale: 1.1 })])
  const args = sequence.mock.calls[0]![0] as unknown as [unknown, () => MotionPlayback]
  expect((args[0] as unknown[])[0]).toBe(port.port)
  expect(args[1]()).toBe(port.animation)
  detach()
  expect(await run.finished).toBe(false)
  release()
})

it('keeps named-state ownership alive through replacement and stops listening after disposal', () => {
  const region = createMotionRegion(),
    surface = createMotionSurface()
  const first = adapter(),
    second = adapter()
  const raw = {
    current: 'working',
    settled: undefined,
    paused: true,
    to: vi.fn(() => playback()),
    attach: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  }
  const create = vi.fn((..._args: unknown[]) => raw)
  const release = bindMotionRegion(region, {
    kind: 'native',
    viewportEnter: vi.fn(),
    sharedLayout: vi.fn(),
    states: create,
  })
  const states = region.states({ card: surface }, { working: { card: { scale: 1.1 } } })
  expect(create.mock.calls[0]![0]).toEqual({ card: null })
  bindMotionSurface(surface, first.port)
  expect(raw.attach).toHaveBeenLastCalledWith('card', first.port)
  bindMotionSurface(surface, second.port)
  expect(raw.attach.mock.calls.slice(-2)).toEqual([
    ['card', null],
    ['card', second.port],
  ])
  expect(states.paused).toBe(true)
  states.resume()
  expect(raw.play).toHaveBeenCalledOnce()
  states.dispose()
  raw.attach.mockClear()
  bindMotionSurface(surface, adapter().port)
  expect(raw.attach).not.toHaveBeenCalled()
  release()
  expect(raw.dispose).toHaveBeenCalledOnce()
})
