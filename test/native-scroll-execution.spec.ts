import { beforeEach, describe, expect, it, vi } from 'vitest'

const jolt = vi.hoisted(() => {
  const nodes: Array<{ dispose: ReturnType<typeof vi.fn>; to: ReturnType<typeof vi.fn> }> = []
  function value() {
    const node = { dispose: vi.fn(), to: vi.fn(() => value()) }
    nodes.push(node)
    return node
  }
  const state = {
    execution: 'native',
    reduced: false,
    listener: undefined as (() => void) | undefined,
  }
  const scrollValue = vi.fn((_source: unknown, _options: unknown) => ({
    ...value(),
    execution: state.execution,
    refresh: vi.fn(),
    ref: vi.fn(),
  }))
  const releases: Array<ReturnType<typeof vi.fn>> = []
  const bind = vi.fn((_target: unknown, _bindings: Record<string, unknown>) => {
    const release = vi.fn()
    releases.push(release)
    return release
  })
  const off = vi.fn()
  return { nodes, releases, state, scrollValue, bind, off }
})
vi.mock('@rafaelaugusto/jolt', () => ({
  scrollValue: jolt.scrollValue,
  bind: jolt.bind,
  reducedMotion: () => jolt.state.reduced,
  onReducedMotion: (listener: () => void) => {
    jolt.state.listener = listener
    return jolt.off
  },
}))

import type { ScrollView, View } from '@nativescript/core'
import { createMotionScrollSource, motionScrollAdapter } from '../packages/core/src/experimental.js'
import {
  attachNativeScrollSource,
  nativeScrollMotion,
} from '../packages/nativescript/src/native/scroll-motion.js'
import { nativeSectionScroll } from '../packages/nativescript/src/native/section-scroll.js'

class Layout {
  listeners = new Set<() => void>()
  on(_event: string, listener: () => void) {
    this.listeners.add(listener)
  }
  off(_event: string, listener: () => void) {
    this.listeners.delete(listener)
  }
  changed() {
    for (const listener of [...this.listeners]) listener()
  }
}
function fixture(execution: 'auto' | 'scheduler' = 'auto') {
  const content = new Layout()
  const view = Object.assign(new Layout(), { scrollableHeight: 500, content })
  const reference = createMotionScrollSource()
  const detach = attachNativeScrollSource(reference, view as unknown as ScrollView)
  const start = () =>
    nativeScrollMotion(
      motionScrollAdapter(reference),
      {} as View,
      { y: [0, -60], opacity: [0.3, 1] },
      { range: [0, 200], execution },
    )
  return { view, content, start, detach }
}

beforeEach(() => {
  jolt.nodes.length = 0
  jolt.releases.length = 0
  jolt.state.execution = 'native'
  jolt.state.reduced = false
  jolt.state.listener = undefined
})

describe('native Jolt RC15 scroll execution', () => {
  it('starts a section after its first measurable layout without recreating its public handle', () => {
    const { view, detach } = fixture()
    Object.assign(view, { verticalOffset: 0, getActualSize: () => ({ width: 360, height: 600 }) })
    const source = createMotionScrollSource()
    const release = attachNativeScrollSource(source, view as unknown as ScrollView)
    let location: { x: number; y: number } | undefined
    const section = Object.assign(new Layout(), {
      parent: view,
      getLocationRelativeTo: () => location,
      getActualSize: () => ({ width: 360, height: 700 }),
    })
    const link = nativeSectionScroll(
      motionScrollAdapter(source),
      section as unknown as View,
      {} as View,
      { y: [0, -80], opacity: [0.4, 1] },
      {},
    )
    // Loaded native views can precede window/layout geometry. execution is a live getter,
    // so a diagnostic string copied at this point is not the eventual execution backend.
    expect(link.execution).toBe('released')
    expect(jolt.scrollValue).not.toHaveBeenCalled()
    location = { x: 0, y: 800 }
    section.changed()
    expect(link.execution).toBe('native')
    expect(jolt.scrollValue).toHaveBeenCalledOnce()
    link.refresh()
    expect(link.execution).toBe('native')
    expect(jolt.scrollValue).toHaveBeenCalledOnce()
    link.dispose()
    expect(section.listeners.size).toBe(0)
    expect(view.listeners.size).toBe(0)
    for (const node of jolt.nodes) expect(node.dispose).toHaveBeenCalledOnce()
    release()
    detach()
  })

  it('never attaches a delayed section after disposal', () => {
    const { view, detach } = fixture()
    Object.assign(view, { verticalOffset: 0, getActualSize: () => ({ width: 360, height: 600 }) })
    const source = createMotionScrollSource()
    const release = attachNativeScrollSource(source, view as unknown as ScrollView)
    let location: { x: number; y: number } | undefined
    const section = Object.assign(new Layout(), {
      parent: view,
      getLocationRelativeTo: () => location,
      getActualSize: () => ({ width: 360, height: 700 }),
    })
    const link = nativeSectionScroll(
      motionScrollAdapter(source),
      section as unknown as View,
      {} as View,
      { y: [0, -80] },
      {},
    )
    link.dispose()
    location = { x: 0, y: 800 }
    section.changed()
    link.refresh()
    expect(link.execution).toBe('released')
    expect(jolt.scrollValue).not.toHaveBeenCalled()
    expect(section.listeners.size).toBe(0)
    expect(view.listeners.size).toBe(0)
    release()
    detach()
  })

  it.each(['native', 'javascript'])('reports the actual %s backend selected by Jolt', (backend) => {
    jolt.state.execution = backend
    const { start, detach } = fixture()
    const link = start()
    expect(jolt.scrollValue.mock.calls.at(-1)?.[1]).toEqual({ execution: 'auto' })
    expect(link.execution).toBe(backend === 'native' ? 'native' : 'scheduler')
    link.dispose()
    expect(link.execution).toBe('released')
    detach()
  })

  it('selects the JavaScript fallback when a shared screen requests scheduler', () => {
    jolt.state.execution = 'javascript'
    const { start, detach } = fixture('scheduler')
    const link = start()
    expect(jolt.scrollValue.mock.calls.at(-1)?.[1]).toEqual({ execution: 'javascript' })
    expect(link.execution).toBe('scheduler')
    link.dispose()
    detach()
  })

  it('refreshes in place and releases old mappings after content changes', () => {
    const { start, view, content, detach } = fixture()
    const link = start()
    const root = jolt.scrollValue.mock.results.at(-1)!.value
    const firstMappings = jolt.nodes.slice(1)
    const firstReleases = [...jolt.releases]
    link.refresh()
    expect(root.refresh).toHaveBeenCalledTimes(2)
    expect(root.ref).not.toHaveBeenCalled()
    expect(jolt.nodes).toHaveLength(4)
    view.content = new Layout()
    view.scrollableHeight = 800
    view.changed()
    expect(content.listeners.size).toBe(0)
    expect(view.content.listeners.size).toBe(1)
    for (const node of firstMappings) expect(node.dispose).toHaveBeenCalledOnce()
    for (const release of firstReleases) expect(release).toHaveBeenCalledOnce()
    expect(root.dispose).not.toHaveBeenCalled()
    link.dispose()
    link.dispose()
    for (const node of jolt.nodes) expect(node.dispose).toHaveBeenCalledOnce()
    expect(root.refresh).toHaveBeenCalledTimes(3)
    expect(view.listeners.size).toBe(0)
    expect(view.content.listeners.size).toBe(0)
    expect(jolt.off).toHaveBeenCalledOnce()
    detach()
  })

  it('does not recreate taken-over properties on resize or reduced motion changes', () => {
    const { start, view, detach } = fixture()
    const link = start()
    link.interrupt(['y'])
    const before = jolt.bind.mock.calls.length
    view.scrollableHeight = 700
    view.changed()
    jolt.state.reduced = true
    jolt.state.listener?.()
    expect(
      jolt.bind.mock.calls.slice(before).every((call) => Object.keys(call[1]).join() === 'opacity'),
    ).toBe(true)
    link.interrupt(['opacity'])
    expect(link.execution).toBe('released')
    expect(view.listeners.size).toBe(0)
    expect(jolt.scrollValue.mock.results.at(-1)!.value.dispose).toHaveBeenCalledOnce()
    detach()
  })

  it('cleans source listeners and every owned node if binding fails during setup', () => {
    jolt.bind.mockImplementationOnce(() => {
      throw new Error('binding refused')
    })
    const { start, view, content, detach } = fixture()
    expect(start).toThrow('binding refused')
    for (const node of jolt.nodes) expect(node.dispose).toHaveBeenCalledOnce()
    expect(view.listeners.size).toBe(0)
    expect(content.listeners.size).toBe(0)
    expect(jolt.off).toHaveBeenCalledOnce()
    detach()
  })
})
