import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref, type App } from 'vue'
import { renderer, node, find, fire } from './renderer.js'
import { MSkeleton } from '../packages/nativescript/src/vue/components/MSkeleton.js'

const state = vi.hoisted(() => ({
  reduced: false,
  events: new Map<string, Set<() => void>>(),
  reducedListeners: new Set<() => void>(),
  motions: [] as { stop: ReturnType<typeof vi.fn> }[],
  animate: vi.fn(),
  set: vi.fn(),
}))
vi.mock('@nativescript/core', () => ({
  Application: {
    suspended: false,
    suspendEvent: 'suspend',
    resumeEvent: 'resume',
    on(name: string, fn: () => void) {
      if (!state.events.has(name)) state.events.set(name, new Set())
      state.events.get(name)!.add(fn)
    },
    off(name: string, fn: () => void) {
      state.events.get(name)?.delete(fn)
    },
  },
}))
vi.mock('@rafaelaugusto/jolt', () => ({
  animate(...args: unknown[]) {
    state.animate(...args)
    const motion = { stop: vi.fn() }
    state.motions.push(motion)
    return motion
  },
  set: state.set,
  reducedMotion: () => state.reduced,
  onReducedMotion(fn: () => void) {
    state.reducedListeners.add(fn)
    return () => state.reducedListeners.delete(fn)
  },
}))
beforeEach(() => vi.useFakeTimers())
let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
  state.events.clear()
  state.reducedListeners.clear()
  state.motions.length = 0
  state.reduced = false
  vi.useRealTimers()
})
function mount(animated = ref(true)) {
  const root = node('root')
  app = renderer.createApp({
    render: () =>
      h(
        MSkeleton,
        { animated: animated.value, width: 48, height: 48, radius: 'full' },
        { default: () => h('Button', 'Must not mount') },
      ),
  })
  app.mount(root)
  return find(root, 'MavisBox')
}
function event(name: string) {
  for (const fn of state.events.get(name) ?? []) fn()
}
function reduce(value: boolean) {
  state.reduced = value
  for (const fn of state.reducedListeners) fn()
}

describe('Skeleton native lifecycle', () => {
  it('fills the available column width without a percentage that includes native parent padding', () => {
    const root = node('root')
    app = renderer.createApp({ render: () => h(MSkeleton, { animated: false }) })
    app.mount(root)
    const style = find(root, 'MavisBox').props.style
    expect(style).toMatchObject({ alignSelf: 'stretch', height: 16 })
    expect(style).not.toHaveProperty('width')
  })
  it('defers the start until native styles settle and cancels a pending start on unload', () => {
    const el = mount()
    fire(el, 'onLoaded', { object: {} })
    expect(state.animate).not.toHaveBeenCalled()
    fire(el, 'onUnloaded')
    vi.runOnlyPendingTimers()
    expect(state.animate).not.toHaveBeenCalled()
  })
  it('is a decorative empty shape with explicit dimensions and no content', () => {
    const el = mount(ref(false))
    expect(el.children).toHaveLength(0)
    expect(el.props).toMatchObject({
      accessible: false,
      accessibilityHidden: true,
      isUserInteractionEnabled: false,
    })
    expect(el.props.style).toMatchObject({
      width: 48,
      height: 48,
      borderRadius: 999,
      alignSelf: 'flex-start',
    })
    fire(el, 'onLoaded', { object: {} })
    expect(state.animate).not.toHaveBeenCalled()
  })
  it('stops on disable, reduced motion, suspension and unload; only restarts while loaded', async () => {
    const animated = ref(true),
      el = mount(animated),
      view = {}
    fire(el, 'onLoaded', { object: view })
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(1)
    animated.value = false
    await nextTick()
    expect(state.motions[0]!.stop).toHaveBeenCalledOnce()
    expect(state.set).toHaveBeenLastCalledWith(view, { opacity: 1 })
    reduce(true)
    animated.value = true
    await nextTick()
    expect(state.animate).toHaveBeenCalledTimes(1)
    reduce(false)
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(2)
    event('suspend')
    expect(state.motions[1]!.stop).toHaveBeenCalledOnce()
    reduce(true)
    reduce(false)
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(2)
    event('resume')
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(3)
    fire(el, 'onUnloaded')
    expect(state.motions[2]!.stop).toHaveBeenCalledOnce()
    expect(state.reducedListeners.size).toBe(0)
    expect([...state.events.values()].every((set) => set.size === 0)).toBe(true)
    event('resume')
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(3)
    fire(el, 'onLoaded', { object: view })
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(4)
    app!.unmount()
    app = undefined
    expect(state.motions[3]!.stop).toHaveBeenCalledOnce()
    expect(state.reducedListeners.size).toBe(0)
    expect([...state.events.values()].every((set) => set.size === 0)).toBe(true)
  })
  it('does not start a loop when loaded with reduced motion enabled', () => {
    state.reduced = true
    const el = mount()
    fire(el, 'onLoaded', { object: {} })
    expect(state.animate).not.toHaveBeenCalled()
    reduce(false)
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledOnce()
  })
})
