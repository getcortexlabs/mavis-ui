import { effectScope } from 'vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { mavis } from '../packages/core/src/index.js'

const motion = vi.hoisted(() => ({ acquire: vi.fn() }))
vi.mock('../packages/web/src/motion-context.js', () => ({ useMotionContext: () => motion }))
vi.mock('@getcortexlabs/mavis-core/vue', () => ({
  useMavisTheme: () => ({ theme: { value: mavis } }),
}))
import { useComponentTransition } from '../packages/web/src/component-motion.js'

function harness() {
  const target = { ownerDocument: {}, height: 202, transform: '' } as unknown as Element & {
    height: number
    transform: string
  }
  let claimed = false
  let measured = target.height
  let geometry = 0
  const completions: (() => void)[] = []
  const runtime = {
    animate: vi.fn(() => {
      if (claimed && target.height !== measured && !geometry) throw new Error('geometry conflict')
      if (target.transform) throw new Error('external transform conflict')
      claimed = true
      measured = target.height
      return {
        stop: vi.fn(),
        finished: new Promise<void>((resolve) => completions.push(resolve)),
      }
    }),
    observeGeometry: vi.fn(() => {
      if (!claimed) throw new Error('surface not claimed')
      geometry++
      return { dispose: vi.fn(() => geometry--) }
    }),
    release: vi.fn(() => {
      claimed = false
    }),
  }
  const release = vi.fn()
  motion.acquire.mockReturnValue({ runtime, release })
  const scope = effectScope()
  const hooks = scope.run(() => useComponentTransition())!
  return {
    target,
    runtime,
    release,
    scope,
    hooks,
    geometry: () => geometry,
    finish: async () => {
      completions.at(-1)!()
      await Promise.resolve()
    },
  }
}

beforeEach(() => motion.acquire.mockReset())

it('keeps a geometry lease across async content changes until the exit completes', async () => {
  const { target, hooks, runtime, release, scope, finish, geometry } = harness()
  const entered = vi.fn()
  const left = vi.fn()
  hooks.onEnter(target, entered)
  await finish()
  expect(entered).toHaveBeenCalledOnce()
  target.height = 50.8906
  expect(() => hooks.onLeave(target, left)).not.toThrow()
  expect(geometry()).toBe(1)
  await finish()
  expect(left).toHaveBeenCalledOnce()
  expect(geometry()).toBe(0)
  expect(runtime.release).toHaveBeenCalledOnce()
  expect(release).toHaveBeenCalledOnce()
  hooks.onAfterLeave(target)
  scope.stop()
  expect(release).toHaveBeenCalledOnce()
})

it('retains the lease during interrupted exits and disposes it on owner teardown', async () => {
  const { target, hooks, runtime, release, scope, finish, geometry } = harness()
  hooks.onEnter(target, vi.fn())
  await finish()
  const cancelled = vi.fn()
  hooks.onLeave(target, cancelled)
  hooks.onLeaveCancelled(target)
  target.height = 58
  hooks.onEnter(target, vi.fn())
  await finish()
  expect(cancelled).not.toHaveBeenCalled()
  expect(runtime.observeGeometry).toHaveBeenCalledOnce()
  expect(geometry()).toBe(1)
  const leaving = vi.fn()
  hooks.onLeave(target, leaving)
  scope.stop()
  await finish()
  expect(leaving).toHaveBeenCalledOnce()
  expect(geometry()).toBe(0)
  expect(release).toHaveBeenCalledOnce()
})

it('still reports external transform ownership changes and supports a first leave', async () => {
  const { target, hooks, runtime, scope, geometry, finish } = harness()
  hooks.onLeave(target, vi.fn())
  expect(runtime.observeGeometry).toHaveBeenCalledOnce()
  expect(geometry()).toBe(1)
  hooks.onLeaveCancelled(target)
  target.transform = 'rotate(10deg)'
  expect(() => hooks.onEnter(target, vi.fn())).toThrow('external transform conflict')
  scope.stop()
  await finish()
  expect(geometry()).toBe(0)
})
