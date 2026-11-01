import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick, ref, type App } from 'vue'
import { renderToString } from '@vue/server-renderer'
import type { View } from '@nativescript/core'
import { progressState, checkProgressLabels } from '../packages/core/src/progress.js'
import { checkAlertLabels } from '../packages/core/src/alert.js'
import { attachProgressMotion } from '../packages/nativescript/src/native/progress.js'
import { MProgress as NativeProgress } from '../packages/nativescript/src/vue/components/MProgress.js'
import { MAlert as NativeAlert } from '../packages/nativescript/src/vue/components/MAlert.js'
import { MProgress as WebProgress } from '../packages/web/src/components/MProgress.js'
import { MAlert as WebAlert } from '../packages/web/src/components/MAlert.js'
import { renderer, node, find, fire, type TestNode } from './renderer.js'

const state = vi.hoisted(() => ({
  reduced: false,
  events: new Map<string, Set<() => void>>(),
  reducedListeners: new Set<() => void>(),
  motions: [] as { stop: ReturnType<typeof vi.fn> }[],
  animate: vi.fn(),
  set: vi.fn(),
  announce: vi.fn(),
}))
vi.mock('@nativescript/core', () => ({
  isAndroid: true,
  isIOS: false,
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
vi.mock('../packages/nativescript/src/native/toast.ts', () => ({ announceToast: state.announce }))
const apps: App[] = []
const disposers: (() => void)[] = []
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  for (const dispose of disposers.splice(0)) dispose()
  state.events.clear()
  state.reducedListeners.clear()
  state.motions.length = 0
  state.reduced = false
  vi.useRealTimers()
})
function all(root: TestNode): TestNode[] {
  return [root, ...root.children.flatMap(all)]
}
function mount(render: () => ReturnType<typeof h>) {
  const root = node('root'),
    app = renderer.createApp({ render })
  apps.push(app)
  app.mount(root)
  return root
}
function view() {
  const listeners = new Set<() => void>()
  return {
    width: 200,
    listeners,
    isLoaded: true,
    getActualSize() {
      return { width: this.width, height: 8 }
    },
    on: (_name: string, fn: () => void) => listeners.add(fn),
    off: (_name: string, fn: () => void) => listeners.delete(fn),
  }
}
function event(name: string) {
  for (const fn of state.events.get(name) ?? []) fn()
}
function reduce(value: boolean) {
  state.reduced = value
  for (const fn of state.reducedListeners) fn()
  vi.runOnlyPendingTimers()
}

describe('Progress readings', () => {
  it('clamps finite readings, preserves their scale and rounds only the accessible percentage', () => {
    expect(progressState(-1, 10)).toEqual({ value: 0, ratio: 0, text: '0%' })
    expect(progressState(11, 10)).toEqual({ value: 10, ratio: 1, text: '100%' })
    expect(progressState(1, 3)).toEqual({ value: 1, ratio: 1 / 3, text: '33.3%' })
    expect(progressState(0.5, 2).text).toBe('25%')
  })
  it.each([0, -1, NaN, Infinity])('rejects invalid maximum %s', (max) => {
    expect(() => progressState(1, max)).toThrow(RangeError)
  })
  it.each([NaN, Infinity, -Infinity])('rejects invalid value %s', (value) => {
    expect(() => progressState(value, 100)).toThrow(RangeError)
  })
  it('requires meaningful names and only requires a close name for dismissible alerts', () => {
    expect(() => checkProgressLabels(' ', 'Loading')).toThrow(TypeError)
    expect(() => checkProgressLabels('Download', '')).toThrow(TypeError)
    expect(() => checkAlertLabels('', false, '')).toThrow(TypeError)
    expect(() => checkAlertLabels('Info', true, '')).toThrow(TypeError)
    expect(() => checkAlertLabels('Info', false, '')).not.toThrow()
  })
})

describe('Native Progress motion ownership', () => {
  it('uses the current track width, ignores unchanged layout and releases every subscription', () => {
    const track = view(),
      fill = view()
    const motion = attachProgressMotion(track as unknown as View, fill as unknown as View, true)
    disposers.push(motion.dispose)
    expect(state.animate).not.toHaveBeenCalled()
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenLastCalledWith(
      fill,
      { x: [0, 136, 0] },
      expect.objectContaining({ repeat: Infinity }),
    )
    for (const fn of track.listeners) fn()
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(1)
    track.width = 400
    for (const fn of track.listeners) fn()
    vi.runOnlyPendingTimers()
    expect(state.motions[0]!.stop).toHaveBeenCalledOnce()
    expect(state.animate).toHaveBeenLastCalledWith(fill, { x: [0, 272, 0] }, expect.anything())
    motion.dispose()
    motion.dispose()
    expect(state.motions[1]!.stop).toHaveBeenCalledOnce()
    expect(track.listeners.size).toBe(0)
    expect(state.reducedListeners.size).toBe(0)
    expect([...state.events.values()].every((set) => set.size === 0)).toBe(true)
    event('resume')
    motion.update(true)
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(2)
  })
  it('stays static for reduced motion, background, known values and zero-width tracks', () => {
    const track = view(),
      fill = view()
    track.width = 0
    const motion = attachProgressMotion(track as unknown as View, fill as unknown as View, true)
    disposers.push(motion.dispose)
    vi.runOnlyPendingTimers()
    expect(state.animate).not.toHaveBeenCalled()
    track.width = 200
    reduce(true)
    expect(state.set).toHaveBeenLastCalledWith(fill, { x: 68 })
    expect(state.animate).not.toHaveBeenCalled()
    reduce(false)
    expect(state.animate).toHaveBeenCalledTimes(1)
    event('suspend')
    expect(state.motions[0]!.stop).toHaveBeenCalledOnce()
    reduce(true)
    reduce(false)
    expect(state.animate).toHaveBeenCalledTimes(1)
    event('resume')
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(2)
    motion.update(false)
    vi.runOnlyPendingTimers()
    expect(state.motions[1]!.stop).toHaveBeenCalledOnce()
    expect(state.set).toHaveBeenLastCalledWith(fill, { x: 0 })
  })
  it('waits for both views, cancels pending motion on unload and reconnects retained views', () => {
    const indeterminate = ref(true)
    const root = mount(() =>
      h(NativeProgress, { label: 'Download', indeterminate: indeterminate.value }),
    )
    const boxes = all(root).filter((el) => el.tag === 'MavisBox')
    fire(boxes[1]!, 'onLoaded', { object: view() })
    vi.runOnlyPendingTimers()
    expect(state.animate).not.toHaveBeenCalled()
    fire(boxes[0]!, 'onLoaded', { object: view() })
    fire(boxes[0]!, 'onUnloaded')
    fire(boxes[1]!, 'onUnloaded')
    vi.runOnlyPendingTimers()
    expect(state.animate).not.toHaveBeenCalled()
    fire(boxes[0]!, 'onLoaded', { object: view() })
    fire(boxes[1]!, 'onLoaded', { object: view() })
    vi.runOnlyPendingTimers()
    expect(state.animate).toHaveBeenCalledTimes(1)
    apps.pop()!.unmount()
    expect(state.motions[0]!.stop).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})

for (const [platform, Progress, Alert] of [
  ['native', NativeProgress, NativeAlert],
  ['web', WebProgress, WebAlert],
] as const) {
  describe(`${platform} feedback contract`, () => {
    it('updates the visible reading and the accessible state across modes', async () => {
      const value = ref(-10),
        indeterminate = ref(false)
      const root = mount(() =>
        h(Progress, {
          value: value.value,
          max: 10,
          label: 'Download',
          indeterminate: indeterminate.value,
          indeterminateLabel: 'Preparing',
        }),
      )
      const track = find(root, platform === 'native' ? 'MavisBox' : 'div')
      expect(track.props[platform === 'native' ? 'accessibilityValue' : 'aria-valuetext']).toBe(
        '0%',
      )
      value.value = 15
      await nextTick()
      expect(track.props[platform === 'native' ? 'accessibilityValue' : 'aria-valuetext']).toBe(
        '100%',
      )
      indeterminate.value = true
      await nextTick()
      expect(track.props[platform === 'native' ? 'accessibilityValue' : 'aria-valuetext']).toBe(
        'Preparing',
      )
      if (platform === 'web') expect(track.props['aria-valuenow']).toBeUndefined()
      indeterminate.value = false
      value.value = 2
      await nextTick()
      expect(track.props[platform === 'native' ? 'accessibilityValue' : 'aria-valuetext']).toBe(
        '20%',
      )
    })
    it('keeps dismissal controlled, preserves actions and makes announcements opt-in', async () => {
      const close = vi.fn(),
        action = vi.fn(),
        announce = ref(false)
      const root = mount(() =>
        h(
          Alert,
          {
            title: 'Saved',
            description: 'Your changes are ready',
            dismissible: true,
            closeLabel: 'Dismiss',
            announce: announce.value,
            onClose: close,
          },
          {
            actions: () => h('test-action', { onTap: action }),
            default: () => h('ignored-content'),
          },
        ),
      )
      const closeButton = all(root).find(
        (el) => el.props[platform === 'native' ? 'accessibilityLabel' : 'aria-label'] === 'Dismiss',
      )!
      fire(closeButton, platform === 'native' ? 'onTap' : 'onClick')
      expect(close).toHaveBeenCalledWith()
      expect(closeButton.parent).not.toBeNull()
      fire(find(root, 'test-action'), 'onTap')
      expect(action).toHaveBeenCalledOnce()
      expect(all(root).some((el) => el.tag === 'ignored-content')).toBe(false)
      expect(all(root).some((el) => el.props.role === 'status')).toBe(false)
      announce.value = true
      await nextTick()
      if (platform === 'web') expect(all(root).some((el) => el.props.role === 'status')).toBe(true)
    })
  })
}
it('announces changed native content once and cancels pending speech on unload', async () => {
  const title = ref('Saved'),
    announce = ref(false)
  const root = mount(() => h(NativeAlert, { title: title.value, announce: announce.value }))
  const content = all(root).find((el) => el.props.accessibilityLabel === 'Saved')!
  const nativeView = view()
  fire(content, 'onLoaded', { object: nativeView })
  vi.runOnlyPendingTimers()
  expect(state.announce).not.toHaveBeenCalled()
  announce.value = true
  await nextTick()
  vi.runOnlyPendingTimers()
  expect(state.announce).toHaveBeenLastCalledWith(nativeView, 'Saved')
  fire(content, 'onUnloaded')
  fire(content, 'onLoaded', { object: nativeView })
  vi.runOnlyPendingTimers()
  expect(state.announce).toHaveBeenCalledTimes(1)
  title.value = 'Updated'
  await nextTick()
  fire(content, 'onUnloaded')
  vi.runOnlyPendingTimers()
  expect(state.announce).toHaveBeenCalledTimes(1)
  fire(content, 'onLoaded', { object: nativeView })
  vi.runOnlyPendingTimers()
  expect(state.announce).toHaveBeenLastCalledWith(nativeView, 'Updated')
})
it('renders progress and inline notices during SSR without browser globals', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h('main', [
          h(WebProgress, { label: 'Download', value: 1, max: 4 }),
          h(WebAlert, { title: 'Connection lost', tone: 'error', announce: true }),
        ]),
    }),
  )
  expect(html).toContain('aria-valuenow="1"')
  expect(html).toContain('aria-valuemax="4"')
  expect(html).toContain('aria-valuetext="25%"')
  expect(html).toContain('role="alert"')
  expect(html).toContain('Connection lost')
})
