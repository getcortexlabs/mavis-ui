import { describe, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => {
  class Layout {
    isLayoutValid = false
    height = 0
    iosIgnoreSafeArea = false
    listeners = new Set<() => void>()
    on(_event: string, callback: () => void) {
      this.listeners.add(callback)
    }
    off(_event: string, callback: () => void) {
      this.listeners.delete(callback)
    }
    getActualSize() {
      return { width: 320, height: this.height }
    }
    layout() {
      this.height = 400
      // Core emits layoutChanged before the current layout pass returns.
      for (const callback of [...this.listeners]) callback()
      this.isLayoutValid = true
    }
  }
  const create = vi.fn((layout: Layout) => {
    if (!layout.height || !layout.isLayoutValid) throw new Error('Rows have not finished layout')
    return {
      activeKey: undefined,
      move: vi.fn(() => true),
      moveUp: vi.fn(() => true),
      moveDown: vi.fn(() => true),
      pause: vi.fn(),
      play: vi.fn(),
      refresh: vi.fn(),
      cancel: vi.fn(),
      dispose: vi.fn(),
    }
  })
  const header = vi.fn(() => ({ ready: true, state: {}, dispose: vi.fn() }))
  return { Layout, create, header }
})
vi.mock('@nativescript/core', () => ({ LayoutBase: native.Layout, isIOS: true }))
vi.mock('@rafaelaugusto/jolt', () => ({ scrollHeader: native.header }))
vi.mock('@rafaelaugusto/jolt/reorder', () => ({ reorder: native.create }))
vi.mock('../packages/nativescript/src/native/scroll-motion.js', () => ({
  nativeScrollElement: (source: unknown) => source,
}))

import { nativeCollectionMotion } from '../packages/nativescript/src/native/collection-motion.js'
import type { MotionScope } from '@rafaelaugusto/jolt'
import type { View } from '@nativescript/core'
import type { MotionSurfaceAdapter } from '../packages/core/src/experimental.js'

function fixture() {
  const layout = new native.Layout()
  const owned: { dispose(): void }[] = []
  const adapter = nativeCollectionMotion(
    layout as unknown as View,
    () => layout as unknown as View,
    {
      add(control: { dispose(): void }) {
        owned.push(control)
        return control
      },
    } as unknown as MotionScope,
  )
  const attach = () =>
    adapter.reorder!({
      container: {} as MotionSurfaceAdapter,
      scroll: { kind: 'native' },
      items: () => [],
      onCommit() {},
    })
  const header = () =>
    adapter.scrollHeader!(
      { kind: 'native' },
      {
        header: {} as MotionSurfaceAdapter,
        artwork: {} as MotionSurfaceAdapter,
        title: {} as MotionSurfaceAdapter,
        toolbar: {} as MotionSurfaceAdapter,
        toolbarTitle: {} as MotionSurfaceAdapter,
        section: {} as MotionSurfaceAdapter,
        items: () => [],
      },
    )
  return { layout, attach, header, dispose: () => owned.forEach((control) => control.dispose()) }
}

describe('native retained collection attachment', () => {
  it('keeps child layout inside the moving header and restores that setting once', () => {
    const { layout, header, dispose } = fixture()
    const control = header()
    expect(layout.iosIgnoreSafeArea).toBe(true)
    control.dispose()
    expect(layout.iosIgnoreSafeArea).toBe(false)
    layout.iosIgnoreSafeArea = true
    dispose()
    expect(layout.iosIgnoreSafeArea).toBe(true)
    expect(native.header.mock.results.at(-1)!.value.dispose).toHaveBeenCalledOnce()
  })

  it('restores header geometry if header setup is rejected', () => {
    const { layout, header } = fixture()
    native.header.mockImplementationOnce(() => {
      throw new Error('Invalid geometry')
    })
    expect(header).toThrow('Invalid geometry')
    expect(layout.iosIgnoreSafeArea).toBe(false)
  })

  it('does not let an older controller restore insets over its replacement', () => {
    const { layout, header } = fixture()
    const old = header(),
      replacement = header()
    old.dispose()
    expect(layout.iosIgnoreSafeArea).toBe(true)
    replacement.dispose()
    expect(layout.iosIgnoreSafeArea).toBe(false)
  })

  it('waits for first layout, preserves pause and delegates later geometry to Jolt', async () => {
    const { layout, attach, dispose } = fixture()
    const control = attach()
    expect(native.create).not.toHaveBeenCalled()
    expect(control.moveUp('row')).toBe(false)
    control.pause()
    layout.layout()
    expect(native.create).not.toHaveBeenCalled()
    await Promise.resolve()
    const jolt = native.create.mock.results.at(-1)!.value
    expect(native.create).toHaveBeenCalledOnce()
    expect(jolt.pause).toHaveBeenCalledOnce()
    expect(layout.listeners.size).toBe(0)
    control.play()
    expect(control.moveDown('row')).toBe(true)
    control.refresh()
    expect(jolt.play).toHaveBeenCalledOnce()
    expect(jolt.moveDown).toHaveBeenCalledWith('row')
    expect(jolt.refresh).toHaveBeenCalledOnce()
    dispose()
    expect(jolt.dispose).toHaveBeenCalledOnce()
  })

  it('does not attach after teardown, even with layout delivery already queued', async () => {
    const { layout, attach, dispose } = fixture()
    attach()
    layout.layout()
    dispose()
    await Promise.resolve()
    expect(native.create).not.toHaveBeenCalled()
    expect(layout.listeners.size).toBe(0)
  })

  it('attaches a replacement controller immediately to an already laid out collection', () => {
    const { layout, attach, dispose } = fixture()
    layout.layout()
    attach()
    expect(native.create).toHaveBeenCalledOnce()
    expect(layout.listeners.size).toBe(0)
    dispose()
  })
})
