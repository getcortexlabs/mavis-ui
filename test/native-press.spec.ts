import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { View } from '@nativescript/core'
import { animate, set, stop, configure } from '@rafaelaugusto/jolt'
import { attachPressFeedback } from '../packages/nativescript/src/native/press.js'
import type { Track } from '../node_modules/@rafaelaugusto/jolt/dist/track.js'

// Exercise the installed Jolt engine/mixer, replacing only its native views and clock.
const platform = vi.hoisted(() => {
  class Events {
    listeners = new Map<
      string,
      Set<(event: { eventName: string; object: unknown; action?: string }) => void>
    >()
    on(name: string, fn: (event: { eventName: string; object: unknown; action?: string }) => void) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set())
      this.listeners.get(name)!.add(fn)
    }
    off(
      name: string,
      fn: (event: { eventName: string; object: unknown; action?: string }) => void,
    ) {
      this.listeners.get(name)?.delete(fn)
    }
    emit(name: string, action?: string) {
      for (const fn of [...(this.listeners.get(name) ?? [])])
        fn({ eventName: name, object: this, action })
    }
  }
  class NativeView extends Events {
    presentation = { scaleX: 1, scaleY: 1 }
    private x = 1
    private y = 1
    get scaleX() {
      return this.x
    }
    set scaleX(value: number) {
      if (value === this.x) return
      this.x = value
      this.presentation.scaleX = value
    }
    get scaleY() {
      return this.y
    }
    set scaleY(value: number) {
      if (value === this.y) return
      this.y = value
      this.presentation.scaleY = value
    }
    translateX = 0
    translateY = 0
    rotate = 0
    opacity = 1
    isLoaded = true
    isEnabled = true
    nativeViewProtected = {}
    style = new Events()
  }
  return {
    View: NativeView,
    Events,
    Application: new Events(),
    Color: class {},
    ScrollView: NativeView,
    isAndroid: false,
    isIOS: false,
  }
})
const clock = vi.hoisted(() => ({
  time: 0,
  reduced: false,
  timers: [] as { at: number; fn: () => void; cancelled: boolean }[],
  tracks: [] as { view: unknown; track: Track; start: number; ended: boolean; fn: () => void }[],
  now() {
    return this.time
  },
  reducedMotion() {
    return this.reduced
  },
  frame() {
    return () => {}
  },
  after(ms: number, fn: () => void) {
    const timer = { at: this.time + ms, fn, cancelled: false }
    this.timers.push(timer)
    return () => {
      timer.cancelled = true
    }
  },
  play(view: unknown, track: Track, start: number, fn: () => void) {
    const played = { view, track, start, fn, ended: false }
    if (track.property === 'scaleX' || track.property === 'scaleY')
      (view as InstanceType<typeof platform.View>).presentation[track.property] = track.valueAt(0)
    this.tracks.push(played)
    return played
  },
  stop(_view: unknown, handle: { ended: boolean; fn: () => void }) {
    if (handle.ended) return
    handle.ended = true
    handle.fn()
  },
  commit(view: InstanceType<typeof platform.View>, property: 'scaleX' | 'scaleY', value: number) {
    view.presentation[property] = value
  },
  presented() {
    return undefined
  },
  advance(ms: number) {
    this.time += ms
    for (const played of this.tracks) {
      if (
        !played.ended &&
        (played.track.property === 'scaleX' || played.track.property === 'scaleY')
      )
        (played.view as InstanceType<typeof platform.View>).presentation[played.track.property] =
          played.track.valueAt(this.time - played.start)
    }
    for (const timer of this.timers) {
      if (!timer.cancelled && timer.at <= this.time) {
        timer.cancelled = true
        timer.fn()
      }
    }
    for (const track of this.tracks) {
      if (!track.ended && this.time >= track.start + track.track.end) {
        track.ended = true
        track.fn()
      }
    }
  },
}))
vi.mock('@nativescript/core', () => platform)
vi.mock('../node_modules/@rafaelaugusto/jolt/dist/driver/index.js', () => ({
  getDriver: () => clock,
}))
vi.mock('@rafaelaugusto/jolt', async () => ({
  ...(await import('../node_modules/@rafaelaugusto/jolt/dist/animate.js')),
  ...(await import('../node_modules/@rafaelaugusto/jolt/dist/press.js')),
  ...(await import('../node_modules/@rafaelaugusto/jolt/dist/config.js')),
}))
type TestView = InstanceType<typeof platform.View> & View
const views: TestView[] = []
const cleanups: (() => void)[] = []
function createView(x = 1, y = x): TestView {
  const view = new platform.View() as InstanceType<typeof platform.View> & View
  view.scaleX = x
  view.scaleY = y
  views.push(view)
  return view
}
function attach(view: View, scale = 0.96) {
  const remove = attachPressFeedback(view, scale)
  cleanups.push(remove)
  return remove
}
beforeEach(() => {
  configure({ reducedMotion: 'user' })
  clock.time = 0
  clock.reduced = false
  clock.timers = []
  clock.tracks = []
})
afterEach(() => {
  for (const remove of cleanups.splice(0)) remove()
  for (const view of views.splice(0)) stop(view)
})

describe('native press scale ownership', () => {
  it('leaves later app assignments untouched when removed without a press', () => {
    const view = createView()
    const remove = attach(view)
    view.scaleX = 1.2
    view.scaleY = 0.8
    remove()
    expect([view.scaleX, view.scaleY]).toEqual([1.2, 0.8])
    expect(clock.tracks).toHaveLength(0)
  })
  it('presses the current non-uniform scale and releases to the current app base', () => {
    const view = createView()
    attach(view)
    view.scaleX = 1.1
    view.scaleY = 0.8
    view.emit('touch', 'down')
    clock.advance(1000)
    expect(view.scaleX).toBeCloseTo(1.056)
    expect(view.scaleY).toBeCloseTo(0.768)
    set(view, { scaleX: 1.2, scaleY: 0.6 })
    expect(view.scaleX).toBeCloseTo(1.152)
    expect(view.scaleY).toBeCloseTo(0.576)
    view.emit('touch', 'up')
    clock.advance(2000)
    expect(view.scaleX).toBeCloseTo(1.2)
    expect(view.scaleY).toBeCloseTo(0.6)
  })
  it.each(['pressed', 'releasing'] as const)(
    'removes only feedback while %s and preserves an app animation',
    async (phase) => {
      const view = createView(1.1)
      const remove = attach(view)
      view.emit('touch', 'down')
      clock.advance(100)
      if (phase === 'releasing') view.emit('touch', 'up')
      const app = animate(view, { scale: 1.4, x: 24 }, { duration: 600, ease: 'linear' })
      clock.advance(100)
      remove()
      expect(view.presentation.scaleX).toBeCloseTo(1.15)
      expect(view.presentation.scaleY).toBeCloseTo(1.15)
      clock.advance(2000)
      expect(await app.finished).toBe(true)
      expect(view.scaleX).toBeCloseTo(1.4)
      expect(view.scaleY).toBeCloseTo(1.4)
      expect(view.translateX).toBe(24)
    },
  )
  it('commits the neutral native presentation when cleanup interrupts a release whose model is already neutral', () => {
    const view = createView(1.2)
    const remove = attach(view)
    view.emit('touch', 'down')
    clock.advance(1000)
    view.emit('touch', 'up')
    clock.advance(30)
    expect(view.scaleX).toBeCloseTo(1.2)
    expect(view.presentation.scaleX).toBeLessThan(1.19)
    remove()
    expect(view.presentation.scaleX).toBeCloseTo(1.2)
    expect(view.presentation.scaleY).toBeCloseTo(1.2)
    expect(clock.tracks.filter((track) => !track.ended)).toHaveLength(0)
    expect(clock.timers.filter((timer) => !timer.cancelled)).toHaveLength(0)
  })
  it('preserves a new app assignment after release has settled', () => {
    const view = createView()
    const remove = attach(view)
    view.emit('touch', 'down')
    clock.advance(1000)
    view.emit('touch', 'cancel')
    clock.advance(2000)
    view.scaleX = 1.3
    view.scaleY = 0.7
    remove()
    expect([view.scaleX, view.scaleY]).toEqual([1.3, 0.7])
  })
  it('keeps other layers and stale cleanup cannot remove the replacement press', () => {
    const view = createView(1.2)
    animate(view, { scale: 1.1 }, { duration: 0, layer: 'app-hover' })
    const first = attach(view)
    view.emit('touch', 'down')
    clock.advance(1000)
    first()
    const second = attach(view, 0.9)
    view.emit('touch', 'down')
    clock.advance(1000)
    first()
    expect(view.scaleX).toBeCloseTo(1.2 * 1.1 * 0.9)
    second()
    expect(view.scaleX).toBeCloseTo(1.2 * 1.1)
    stop(view, ['scale'], { layer: 'app-hover' })
    expect(view.scaleX).toBeCloseTo(1.2)
  })
  it('removes settled feedback on unload and detaches all gesture listeners', () => {
    const view = createView(1.2)
    const remove = attach(view)
    view.emit('touch', 'down')
    clock.advance(1000)
    view.emit('unloaded')
    expect(view.scaleX).toBeCloseTo(1.2)
    view.scaleX = 1.5
    remove()
    view.emit('touch', 'down')
    clock.advance(2000)
    expect(view.scaleX).toBe(1.5)
    expect(view.listeners.get('touch')?.size ?? 0).toBe(0)
    expect(view.listeners.get('unloaded')?.size ?? 0).toBe(0)
  })
  it('ignores disabled controls, move/up without down and repeated downs', () => {
    const view = createView()
    attach(view)
    view.isEnabled = false
    view.emit('touch', 'down')
    view.emit('touch', 'up')
    view.emit('touch', 'move')
    expect(clock.tracks).toHaveLength(0)
    view.isEnabled = true
    view.emit('touch', 'down')
    const count = clock.tracks.length
    view.emit('touch', 'down')
    view.emit('touch', 'move')
    expect(clock.tracks).toHaveLength(count)
  })
  it('settles an active press when reduced motion changes and keeps later base updates', () => {
    const view = createView(1.1)
    const remove = attach(view)
    view.emit('touch', 'down')
    clock.advance(30)
    configure({ reducedMotion: 'always' })
    expect(view.presentation.scaleX).toBeCloseTo(1.056)
    set(view, { scale: 1.2 })
    remove()
    expect(view.presentation.scaleX).toBeCloseTo(1.2)
  })
  it('clears a reduced-motion press without resetting the app scale', () => {
    clock.reduced = true
    const view = createView(1.1)
    const remove = attach(view)
    view.emit('touch', 'down')
    expect(view.scaleX).toBeCloseTo(1.056)
    set(view, { scale: 1.2 })
    remove()
    expect(view.scaleX).toBeCloseTo(1.2)
  })
})
