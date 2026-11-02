import { expect, it, vi } from 'vitest'
import type { View } from '@nativescript/core'
import { useRevealMotion } from '../packages/nativescript/src/vue/reveal-motion.js'
import { node, renderer } from './renderer.js'
const state = vi.hoisted(() => ({
  handles: [] as {
    stop: ReturnType<typeof vi.fn>
    finish: (value: boolean) => void
    finished: Promise<boolean>
  }[],
  preference: undefined as undefined | ((value: boolean) => void),
  off: vi.fn(),
  set: vi.fn(),
}))
vi.mock('@rafaelaugusto/jolt', () => ({
  animate() {
    let finish!: (value: boolean) => void
    const finished = new Promise<boolean>((resolve) => {
      finish = resolve
    })
    const handle = { finished, finish, stop: vi.fn(() => finish(false)) }
    state.handles.push(handle)
    return handle
  },
  set: state.set,
  onReducedMotion(fn: (value: boolean) => void) {
    state.preference = fn
    return state.off
  },
}))

it('ignores stale leave completion, settles spatial motion on preference change and releases listeners', async () => {
  let hooks!: ReturnType<typeof useRevealMotion>
  const app = renderer.createApp({
    setup() {
      hooks = useRevealMotion()
      return () => null
    },
  })
  app.mount(node('root'))
  const listeners = new Set<() => void>()
  const view = {
    on(_name: string, fn: () => void) {
      listeners.add(fn)
    },
    off(_name: string, fn: () => void) {
      listeners.delete(fn)
    },
  } as unknown as View
  const element = { nativeView: view }
  const enter = vi.fn(),
    leave = vi.fn(),
    again = vi.fn()
  hooks.onEnter(element, enter)
  const initial = state.handles.at(-1)!
  hooks.onEnterCancelled(element)
  hooks.onLeave(element, leave)
  const leaving = state.handles.at(-1)!
  hooks.onLeaveCancelled(element)
  hooks.onEnter(element, again)
  state.preference?.(true)
  expect(state.set).toHaveBeenLastCalledWith(view, { y: 0 })
  leaving.finish(true)
  await Promise.resolve()
  expect(leave).not.toHaveBeenCalled()
  expect(enter).not.toHaveBeenCalled()
  expect(initial.stop).toHaveBeenCalledOnce()
  state.handles.at(-1)!.finish(true)
  await Promise.resolve()
  expect(again).toHaveBeenCalledOnce()
  expect(listeners.size).toBe(0)
  hooks.onLeave(element, leave)
  const removed = state.handles.at(-1)!
  app.unmount()
  expect(await removed.finished).toBe(false)
  expect(leave).not.toHaveBeenCalled()
  expect(listeners.size).toBe(0)
  expect(state.off).toHaveBeenCalledOnce()
})
