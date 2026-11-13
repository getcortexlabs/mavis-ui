import { expect, it, vi } from 'vitest'
import { webSectionScroll } from '../packages/web/src/section-scroll.js'

it('coalesces geometry changes outside resize delivery and cancels pending work on disposal', () => {
  let height = 400
  let resize!: () => void
  const frames = new Map<number, FrameRequestCallback>()
  let sequence = 0
  const view = {
    ResizeObserver: class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    requestAnimationFrame(callback: FrameRequestCallback) {
      frames.set(++sequence, callback)
      return sequence
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    addEventListener() {},
    removeEventListener() {},
  }
  const source = {
    ownerDocument: { defaultView: view },
    contains: () => true,
    clientTop: 0,
    clientHeight: 600,
    scrollTop: 0,
    scrollHeight: 2600,
    children: [] as unknown[],
    parentElement: null,
    getBoundingClientRect: () => ({ top: 0 }),
  }
  const section = {
    isConnected: true,
    parentElement: source,
    getBoundingClientRect: () => ({ top: 800, height }),
  }
  source.children = [section]
  const dispose = vi.fn()
  const scrollLinked = vi.fn(
    (_source: unknown, _target: unknown, _frames: unknown, _options: unknown) => ({
      execution: 'scheduler',
      refresh: vi.fn(),
      dispose,
    }),
  )
  const link = webSectionScroll(
    { scrollLinked } as never,
    source as never,
    section as never,
    {} as HTMLElement,
    { y: [0, -80], opacity: [0.4, 1] },
    {},
  )
  expect(scrollLinked).toHaveBeenCalledOnce()
  height = 800
  resize()
  resize()
  expect(scrollLinked).toHaveBeenCalledOnce()
  expect(frames.size).toBe(1)
  for (const [id, callback] of frames) {
    frames.delete(id)
    callback(0)
  }
  expect(scrollLinked).toHaveBeenCalledTimes(2)
  expect(scrollLinked.mock.calls[1]?.[3]).toMatchObject({ range: [200, 1600] })
  link.interrupt(['y'])
  height = 1000
  resize()
  for (const [id, callback] of frames) {
    frames.delete(id)
    callback(0)
  }
  expect(scrollLinked.mock.calls[2]?.[2]).toEqual({ opacity: [0.4, 1] })
  resize()
  expect(frames.size).toBe(1)
  link.dispose()
  expect(frames.size).toBe(0)
  expect(dispose).toHaveBeenCalledTimes(3)
})
