import { expect, it, vi } from 'vitest'
import type { WebDragOptions, WebDragRelease, WebRuntime } from '@rafaelaugusto/jolt/web'
import { webMotionSurface } from '../packages/web/src/motion-surface.js'

it('preserves the shared release velocity contract with Jolt RC.9 Web drag events', () => {
  let options!: WebDragOptions
  const runtime = {
    drag: vi.fn((_target: HTMLElement, next: WebDragOptions) => {
      options = next
      return { dispose: vi.fn(), update: vi.fn(), cancel: vi.fn(), dragging: false }
    }),
  } as unknown as WebRuntime
  const onRelease = vi.fn()
  const { adapter } = webMotionSurface(
    runtime,
    { querySelector: () => null } as unknown as HTMLElement,
    () => true,
  )
  const drag = adapter.drag!({ axis: 'x', onRelease })
  options.onRelease!({
    x: 32,
    y: -4,
    velocity: { x: 280, y: -50 },
    target: { x: 40, y: 0 },
    animation: {} as WebDragRelease['animation'],
  })
  expect(onRelease).toHaveBeenCalledExactlyOnceWith({
    x: 32,
    y: -4,
    velocityX: 280,
    velocityY: -50,
  })
  drag.dispose()
})

it('uses the card surface action as the drag handle without translating its nested controls', () => {
  const action = {} as HTMLElement
  const target = { querySelector: vi.fn(() => action) } as unknown as HTMLElement
  const drag = vi.fn(() => ({ dispose() {}, update() {}, cancel() {}, dragging: false }))
  const { adapter } = webMotionSurface({ drag } as unknown as WebRuntime, target, () => true)
  adapter.drag!({ axis: 'x' })
  expect(target.querySelector).toHaveBeenCalledWith(':scope > .m-card-action')
  expect(drag).toHaveBeenCalledWith(target, expect.objectContaining({ handle: action, axis: 'x' }))
})

it('keeps a plain motion surface as its own drag handle', () => {
  const target = { querySelector: () => null } as unknown as HTMLElement
  const drag = vi.fn(() => ({ dispose() {}, update() {}, cancel() {}, dragging: false }))
  const { adapter } = webMotionSurface({ drag } as unknown as WebRuntime, target, () => true)
  adapter.drag!({ axis: 'x' })
  expect(drag).toHaveBeenCalledWith(target, expect.objectContaining({ handle: undefined }))
})
