import { describe, expect, it, vi } from 'vitest'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { MBox, MCard, createMavis } from '../packages/web/src/index.js'
import {
  createMotionRegion,
  bindMotionRegion,
  createMotionSurface,
  bindMotionSurface,
  createMotionScrollSource,
  bindMotionScrollSource,
  whenMotionAvailable,
  type MotionRegionAdapter,
} from '../packages/core/src/experimental.js'

function adapter() {
  const dispose = vi.fn(),
    attach = vi.fn(() => vi.fn())
  const region: MotionRegionAdapter = {
    kind: 'web',
    viewportEnter: vi.fn(() => ({
      execution: 'static' as const,
      pending: 0,
      completed: 0,
      update() {},
      refresh() {},
      dispose,
    })),
    sharedLayout: vi.fn(() => ({
      active: false,
      attach,
      cancel() {},
      dispose,
      transition: (change: () => void) => {
        change()
        return {
          finished: Promise.resolve({ status: 'completed' as const }),
          cancel() {},
          stop() {},
        }
      },
    })),
  }
  return { region, dispose, attach }
}
const surfaceAdapter = () => ({
  animate: () => ({ finished: Promise.resolve(true), stop() {} }),
  set: () => ({ finished: Promise.resolve(true), stop() {} }),
})

describe('declared motion regions', () => {
  it('releases retained controllers on source or target replacement without touching the next owner', () => {
    const region = createMotionRegion(),
      scroll = createMotionScrollSource(),
      container = createMotionSurface()
    const host = adapter(),
      dispose = vi.fn(),
      move = vi.fn(() => true)
    host.region.reorder = () => ({
      activeKey: undefined,
      move,
      moveUp: move,
      moveDown: move,
      refresh() {},
      cancel() {},
      pause() {},
      play() {},
      dispose,
    })
    const unbind = bindMotionRegion(region, host.region)
    const oldScroll = bindMotionScrollSource(scroll, { kind: 'web' })
    const oldContainer = bindMotionSurface(container, surfaceAdapter())
    const old = region.reorder({ container, scroll, items: () => [], onCommit() {} })
    const newScroll = bindMotionScrollSource(scroll, { kind: 'web' })
    expect(old.disposed).toBe(true)
    expect(dispose).toHaveBeenCalledOnce()
    expect(() => old.moveUp('row')).toThrow(/disposed/)
    const next = region.reorder({ container, scroll, items: () => [], onCommit() {} })
    oldScroll()
    old.dispose()
    expect(next.disposed).toBe(false)
    expect(next.moveUp('row')).toBe(true)
    oldContainer()
    expect(next.disposed).toBe(true)
    newScroll()
    unbind()
    expect(dispose).toHaveBeenCalledTimes(2)
  })

  it('keeps header readiness live and cancels pending refresh when a retained title detaches', async () => {
    const region = createMotionRegion(),
      scroll = createMotionScrollSource(),
      host = adapter()
    const surfaces = Array.from({ length: 6 }, () => createMotionSurface())
    const [header, artwork, title, toolbar, toolbarTitle, section] = surfaces as [
      (typeof surfaces)[number],
      (typeof surfaces)[number],
      (typeof surfaces)[number],
      (typeof surfaces)[number],
      (typeof surfaces)[number],
      (typeof surfaces)[number],
    ]
    let ready = false,
      cancelled = false,
      finish!: (value: boolean) => void
    const pending = new Promise<boolean>((resolve) => {
      finish = resolve
    })
    const dispose = vi.fn(() => {
      cancelled = true
      finish(false)
    })
    host.region.scrollHeader = () => ({
      get ready() {
        return ready
      },
      get state() {
        return { offset: 0, refreshing: !cancelled }
      },
      refresh: () => pending,
      cancelRefresh() {},
      remeasure: async () => {},
      preserveAnchor: async (change) => {
        if (!cancelled) await change()
      },
      scrollToItem: () => true,
      scrollToTop() {},
      pause() {},
      play() {},
      dispose,
    })
    const release = bindMotionRegion(region, host.region),
      releaseScroll = bindMotionScrollSource(scroll, { kind: 'web' })
    const releases = surfaces.map((surface) => bindMotionSurface(surface, surfaceAdapter()))
    const control = region.scrollHeader(scroll, {
      header,
      artwork,
      title,
      toolbar,
      toolbarTitle,
      section,
      items: () => [],
    })
    expect(control.ready).toBe(false)
    ready = true
    expect(control.ready).toBe(true)
    const result = control.refresh()
    releases[2]!()
    expect(await result).toBe(false)
    expect(control.disposed).toBe(true)
    releases.forEach((stop) => stop())
    releaseScroll()
    release()
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('coordinates readiness and replacement without a stale cleanup affecting the new presentation', () => {
    const region = createMotionRegion(),
      surface = createMotionSurface()
    const setup = vi.fn(() => vi.fn())
    const stop = whenMotionAvailable([region, surface], setup)
    const unbind = bindMotionRegion(region, adapter().region)
    expect(setup).not.toHaveBeenCalled()
    const old = bindMotionSurface(surface, surfaceAdapter())
    expect(setup).toHaveBeenCalledOnce()
    const replacement = bindMotionSurface(surface, surfaceAdapter())
    expect(setup.mock.results[0]!.value).toHaveBeenCalledOnce()
    expect(setup).toHaveBeenCalledTimes(2)
    old()
    expect(surface.available).toBe(true)
    stop()
    replacement()
    unbind()
    expect(setup.mock.results[1]!.value).toHaveBeenCalledOnce()
  })

  it('retains explicit shared identity through a surface replacement and rejects duplicates', () => {
    const region = createMotionRegion(),
      surface = createMotionSurface()
    const backend = adapter()
    const unbind = bindMotionRegion(region, backend.region)
    const shared = region.sharedLayout()
    const detach = shared.attach(surface, 'cover')
    expect(backend.attach).not.toHaveBeenCalled()
    const old = bindMotionSurface(surface, surfaceAdapter())
    expect(() => shared.attach(surface, 'cover')).toThrow(/unique/)
    const next = bindMotionSurface(surface, surfaceAdapter())
    old()
    expect(backend.attach).toHaveBeenCalledTimes(2)
    detach()
    shared.dispose()
    next()
    unbind()
    expect(backend.dispose).toHaveBeenCalledOnce()
  })

  it('validates bounded opt-in diagnostics and viewport groups before calling the renderer', () => {
    const region = createMotionRegion(),
      backend = adapter()
    const release = bindMotionRegion(region, backend.region)
    expect(() => region.viewportEnter([])).toThrow(RangeError)
    expect(() => region.diagnostics({ development: false, identity: 'x' } as never)).toThrow(
      /development/,
    )
    expect(() => region.diagnostics({ development: true, identity: 'x', maxEvents: 5000 })).toThrow(
      RangeError,
    )
    const diagnostics = region.diagnostics({ development: true, identity: 'demo' })
    expect(diagnostics.snapshot().execution).toBe('lifecycle-only')
    release()
    expect(diagnostics.snapshot()).toMatchObject({
      disposed: true,
      resources: { regionResources: 0 },
    })
    expect(backend.region.viewportEnter).not.toHaveBeenCalled()
  })

  it('keeps SSR content readable and two requests independent without running setup', async () => {
    const render = async (title: string) => {
      const region = createMotionRegion(),
        surface = createMotionSurface(),
        setup = vi.fn()
      region.onAvailable(setup)
      surface.use(setup)
      const app = createSSRApp({
        render: () =>
          h(MBox, { motionRegion: region }, () =>
            h(MCard, { motionSurface: surface }, () => title),
          ),
      }).use(createMavis())
      const html = await renderToString(app)
      expect(setup).not.toHaveBeenCalled()
      expect(region.available).toBe(false)
      expect(html).not.toMatch(/opacity:0|visibility:hidden|\[object Object\]/)
      return html
    }
    const [first, second] = await Promise.all([render('First request'), render('Second request')])
    expect(first).toContain('First request')
    expect(first).not.toContain('Second request')
    expect(second).toContain('Second request')
  })
})
