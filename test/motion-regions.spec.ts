import { describe, expect, it, vi } from 'vitest'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, defineComponent, h } from 'vue'
import { MBox, MCard, MGrid, MStack, createMavis } from '../packages/web/src/index.js'
import { useMotionContext, type WebMotionContext } from '../packages/web/src/motion-context.js'
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
  it('keeps application motion reachable through built-in layouts while isolating explicit regions', async () => {
    const contexts = new Map<string, WebMotionContext>()
    const Probe = defineComponent({
      props: { name: { type: String, required: true } },
      setup(props, { slots }) {
        contexts.set(props.name, useMotionContext())
        return () => h('div', slots.default?.())
      },
    })
    const outer = createMotionRegion(),
      inner = createMotionRegion()
    const app = createSSRApp({
      render: () =>
        h(MBox, { motionRegion: outer }, () => [
          h(Probe, { name: 'application' }),
          h(MStack, {}, () => h(MGrid, {}, () => h(Probe, { name: 'layout' }))),
          h(MBox, { motionRegion: inner }, () => h(Probe, { name: 'explicit' })),
        ]),
    }).use(createMavis())
    await renderToString(app)
    expect(contexts.size).toBe(3)
    expect(contexts.get('layout')).toBe(contexts.get('application'))
    expect(contexts.get('explicit')).not.toBe(contexts.get('application'))
  })
  it('delegates keyed layout changes and stops pending layout on region replacement', async () => {
    const region = createMotionRegion(),
      host = adapter()
    let finish!: (value: boolean) => void
    const stop = vi.fn(() => finish(false))
    host.region.animateLayout = vi.fn((change) => {
      change()
      return {
        finished: new Promise<boolean>((resolve) => {
          finish = resolve
        }),
        stop,
      }
    })
    const release = bindMotionRegion(region, host.region)
    const change = vi.fn()
    const operation = region.animateLayout(change, { size: false, enter: true })
    expect(change).toHaveBeenCalledOnce()
    expect(host.region.animateLayout).toHaveBeenCalledWith(change, { size: false, enter: true })
    release()
    expect(await operation.finished).toBe(false)
    expect(stop).toHaveBeenCalledOnce()
    operation.stop()
    expect(stop).toHaveBeenCalledOnce()
  })
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

  it('exposes pointer position, presence and availability, and releases them with their owners', () => {
    const backend = adapter()
    const region = createMotionRegion(),
      surface = createMotionSurface()
    const releaseRegion = bindMotionRegion(region, backend.region)
    let hover = false,
      inside = false
    const dispose = vi.fn(),
      update = vi.fn(),
      unbind = vi.fn()
    const readable = (get: () => number) => ({ get, dispose() {} })
    const pointerFollow = vi.fn(() => ({
      x: readable(() => (inside ? 6 : 0)),
      y: readable(() => 0),
      presence: readable(() => (inside ? 1 : 0)),
      // A native view only knows whether it has hover once it has loaded.
      get execution() {
        return hover ? ('hover' as const) : ('static' as const)
      },
      get available() {
        return hover
      },
      get active() {
        return inside
      },
      update,
      refresh() {},
      dispose,
    }))
    const releaseSurface = bindMotionSurface(surface, {
      ...surfaceAdapter(),
      pointerFollow,
      map: (source, _input, output) => readable(() => source.get() * output[1]!),
      bind: () => ({ dispose: unbind }),
    })
    const pointer = surface.pointerFollow(region, { range: { x: [-12, 12] } })
    expect(pointerFollow).toHaveBeenCalledWith(backend.region, { range: { x: [-12, 12] } })
    // Without hover the recipe keeps its resting values instead of failing.
    expect(pointer).toMatchObject({ available: false, execution: 'static', active: false })
    expect([pointer.x.get(), pointer.presence.get()]).toEqual([0, 0])
    const lift = pointer.presence.to([0, 1], [0, -2])
    surface.bind({ x: pointer.x, rotate: lift })
    hover = true
    inside = true
    expect(pointer).toMatchObject({ available: true, execution: 'hover', active: true })
    expect([pointer.x.get(), pointer.presence.get(), lift.get()]).toEqual([6, 1, -2])
    pointer.update({ disabled: true })
    expect(update).toHaveBeenCalledWith({ disabled: true })

    // Invalid options never reach the renderer.
    expect(() => surface.pointerFollow(region, { coordinates: 'screen' as never })).toThrow()
    expect(() => surface.pointerFollow(region, { range: { x: [4, 2] } })).toThrow(RangeError)
    expect(pointerFollow).toHaveBeenCalledOnce()

    // Replacing the region releases the input and everything bound to its values.
    releaseRegion()
    expect(dispose).toHaveBeenCalledOnce()
    expect(unbind).toHaveBeenCalled()
    expect(() => pointer.presence.get()).toThrow(/disposed/)
    releaseSurface()
    expect(dispose).toHaveBeenCalledOnce()
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
