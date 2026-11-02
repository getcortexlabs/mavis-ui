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
  const { adapter } = webMotionSurface(runtime, {} as HTMLElement, () => true)
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
