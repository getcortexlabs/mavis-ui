import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWebRuntime } from '@rafaelaugusto/jolt/web'
import {
  bindMotionSurface,
  createMotionSurface,
  type MotionReadable,
} from '../packages/core/src/experimental.js'
import { webMotionSurface } from '../packages/web/src/motion-surface.js'

const cleanups: (() => void)[] = []
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
})

/** The actual Jolt scalar engine, with a controlled clock and no DOM rendering. */
function host() {
  let time = 0
  const frames = new Map<number, FrameRequestCallback>()
  let frame = 0
  const preference = Object.assign(new EventTarget(), { matches: false })
  const document = Object.assign(new EventTarget(), {
    hidden: false,
    timeline: { currentTime: 0 },
    defaultView: {
      Animation: class {},
      KeyframeEffect: class {},
      performance: { now: () => time },
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        frames.set(++frame, callback)
        return frame
      },
      cancelAnimationFrame: (id: number) => frames.delete(id),
      matchMedia: () => preference,
      setTimeout,
      clearTimeout,
    },
  })
  const runtime = createWebRuntime(document as unknown as Document)
  cleanups.push(() => runtime.dispose())
  const surface = createMotionSurface()
  const adapter = webMotionSurface(runtime, {} as HTMLElement, () => true).adapter
  const release = bindMotionSurface(surface, adapter)
  cleanups.push(release)
  return {
    surface,
    adapter,
    runtime,
    release,
    tick(next: number) {
      time = next
      for (const [id, callback] of [...frames]) {
        frames.delete(id)
        callback(time)
      }
    },
    get scheduled() {
      return frames.size
    },
  }
}

describe('shared combined values through Jolt RC.15', () => {
  it('keeps two-input expressions live and delegates all numeric operations', () => {
    const { surface } = host()
    const a = surface.motionValue(3),
      b = surface.motionValue(4)
    const expression = a.mul(b).add(2).sub(b).div(2).min(9).max(0).clamp(0, 6)
    expect(expression.get()).toBe(5)
    a.set(10)
    expect(expression.get()).toBe(6)
    b.set(-2)
    expect(expression.get()).toBe(0)
    expect(b.abs().get()).toBe(2)
    const angle = surface.motionValue(Math.PI / 2)
    expect(angle.sin().get()).toBeCloseTo(1)
    expect(angle.cos().get()).toBeCloseTo(0)
    expect(a.div(0).get()).toBe(0)
    expect(a.mul(Number.MAX_VALUE).get()).toBe(0)
    expect(a.velocity().get()).toBe(0)
    expect(expression.getVelocity()).toBe(0)
  })

  it('follows a combined input and maps its analytic velocity without another clock', () => {
    const engine = host()
    const { surface, tick } = engine
    const a = surface.motionValue(0),
      b = surface.motionValue(0)
    const total = a.add(b)
    const follower = surface.springValue(total, { stiffness: 100, damping: 20, initial: 0 })
    const doubled = follower.mul(2),
      speed = doubled.velocity()
    expect(engine.scheduled).toBe(0)
    a.set(50)
    b.set(50)
    tick(100)
    expect(follower.get()).toBeGreaterThan(0)
    expect(follower.get()).toBeLessThan(100)
    expect(doubled.getVelocity()).toBeCloseTo(follower.getVelocity() * 2)
    expect(speed.get()).toBeCloseTo(doubled.getVelocity())
    expect(speed.getVelocity()).toBe(0)
    follower.pause()
    const held = follower.get()
    a.set(150)
    tick(200)
    expect(follower.get()).toBe(held)
    expect(speed.get()).toBeCloseTo(follower.getVelocity() * 2)
    follower.resume()
    tick(300)
    expect(follower.get()).toBeGreaterThan(held)
  })

  it('borrows both inputs, invalidates dependents from either source and keeps siblings alive', () => {
    const { surface } = host()
    const a = surface.motionValue(2),
      b = surface.motionValue(3)
    const sum = a.add(b),
      product = a.mul(b),
      derived = sum.mul(4)
    sum.dispose()
    expect(derived.disposed).toBe(true)
    expect(a.disposed).toBe(false)
    expect(b.disposed).toBe(false)
    a.set(4)
    expect(product.get()).toBe(12)
    b.dispose()
    expect(product.disposed).toBe(true)
    expect(() => product.get()).toThrow(/disposed/)
    expect(a.get()).toBe(4)
  })

  it('allows scoped outputs to borrow parent inputs without disposing their owner', () => {
    const { surface } = host()
    const a = surface.motionValue(3),
      b = surface.motionValue(4)
    let output!: MotionReadable
    const stop = surface.use((child) => {
      const seed = child.motionValue(2)
      output = seed.add(a).mul(b)
    })
    expect(output.get()).toBe(20)
    stop()
    expect(output.disposed).toBe(true)
    expect(a.get()).toBe(3)
    expect(b.get()).toBe(4)
  })

  it('rejects foreign, color, stale, invalid and overly deep operands before creating output', () => {
    const first = host(),
      second = host()
    const scalar = vi.spyOn(first.adapter, 'scalar')
    // Only color parsing needs a DOM; this test checks the core's numeric/color boundary.
    first.adapter.mapColor = () => ({ get: () => '#ffffff', dispose() {} })
    const a = first.surface.motionValue(1),
      b = second.surface.motionValue(2)
    const color = a.to([0, 1], ['#000000', '#ffffff'])
    expect(() => a.add(b)).toThrow(/live numeric/)
    expect(() => a.add(color as unknown as MotionReadable)).toThrow(/live numeric/)
    for (const value of [NaN, Infinity, -Infinity]) expect(() => a.add(value)).toThrow(/finite/)
    expect(() => a.add(undefined as unknown as number)).toThrow(/operand/)
    expect(() => a.clamp(2, 1)).toThrow(/bounds/)
    expect(() => a.clamp(0, Infinity)).toThrow(/bounds/)
    expect(scalar).not.toHaveBeenCalled()
    let chain: MotionReadable = a
    for (let index = 0; index < 32; index++) chain = chain.add(1)
    expect(chain.get()).toBe(33)
    expect(() => chain.add(1)).toThrow(/32/)
    expect(() => a.add(chain)).toThrow(/32/)
    first.release()
    bindMotionSurface(first.surface, first.adapter)
    const fresh = first.surface.motionValue(5)
    expect(() => fresh.add(a)).toThrow(/live numeric/)
    expect(() => a.add(fresh)).toThrow(/disposed/)
  })

  it('cleans dependent bindings when either input ends, without taking borrowed inputs', () => {
    const { surface, adapter } = host()
    const dispose = vi.fn()
    // The graph is real Jolt; only the DOM binding is replaced in this headless test.
    adapter.bind = () => ({ dispose })
    const a = surface.motionValue(1),
      b = surface.motionValue(2)
    const result = a.add(b)
    const bound = surface.bind({ x: result })
    b.dispose()
    expect(bound.disposed).toBe(true)
    expect(dispose).toHaveBeenCalledOnce()
    expect(a.disposed).toBe(false)
  })

  it('does not evaluate unsupported graphs or accept graphs as mutable animation inputs', () => {
    const { surface, adapter } = host()
    const a = surface.motionValue(2)
    const sum = a.add(1)
    expect(() => surface.animateValue(sum as typeof a, 4)).toThrow(/live value/)
    expect(() => surface.stopValue(sum as typeof a)).toThrow(/live value/)
    adapter.scalar = undefined
    expect(() => a.add(1)).toThrow(/unavailable/)
  })
})
