import { effectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  connectToast,
  createToastController,
  disposeToast,
  type ToastSnapshot,
} from '../packages/core/src/toast.js'
import { useToast } from '../packages/core/src/vue/toast.js'

afterEach(() => vi.useRealTimers())
function fixture() {
  const controller = createToastController()
  let state: ToastSnapshot = { visible: false }
  const host = connectToast(controller, (next) => {
    state = next
  })
  host.activate()
  const enter = () => {
    const id = state.message!.id
    host.begin(id)
    host.entered(id)
    return id
  }
  return { controller, host, state: () => state, enter }
}

describe('Toast queue', () => {
  it('validates and snapshots options, including default duration and persistent messages', () => {
    const f = fixture()
    for (const options of [
      { message: '' },
      { message: 'ok', title: ' ' },
      { message: 'ok', tone: 'blue' },
      { message: 'ok', duration: NaN },
      { message: 'ok', duration: -1 },
      { message: 'ok', duration: 2147483648 },
    ])
      expect(() => f.controller.show(options as never)).toThrow()
    const options = { message: '<saved>', title: 'Profile' }
    f.controller.show(options)
    options.message = 'Changed outside'
    expect(f.state().message).toMatchObject({
      message: '<saved>',
      title: 'Profile',
      tone: 'info',
      duration: 5000,
    })
    expect(Object.isFrozen(f.state().message)).toBe(true)
    f.host.dispose()
  })
  it('starts time after entry and advances FIFO only after the current toast leaves', () => {
    vi.useFakeTimers()
    const f = fixture()
    f.controller.show({ message: 'First', duration: 1000 })
    f.controller.show({ message: 'Second', duration: 1000 })
    vi.advanceTimersByTime(5000)
    expect(f.state().message?.message).toBe('First')
    const first = f.enter()
    vi.advanceTimersByTime(999)
    expect(f.state().visible).toBe(true)
    vi.advanceTimersByTime(1)
    expect(f.state().visible).toBe(false)
    expect(f.state().message?.message).toBe('First')
    f.host.left(first)
    expect(f.state().message?.message).toBe('Second')
    expect(f.state().visible).toBe(true)
    vi.advanceTimersByTime(5000)
    expect(f.state().visible).toBe(true)
    f.controller.clear()
    expect(f.state().message).toBeUndefined()
    f.host.dispose()
  })
  it('preserves remaining time across overlapping interaction and background pauses', () => {
    vi.useFakeTimers()
    const f = fixture()
    f.controller.show({ message: 'Read me', duration: 1000 })
    f.enter()
    vi.advanceTimersByTime(400)
    f.host.pause('hover', true)
    f.host.pause('background', true)
    vi.advanceTimersByTime(10000)
    f.host.pause('hover', false)
    vi.advanceTimersByTime(10000)
    expect(f.state().visible).toBe(true)
    f.host.pause('background', false)
    vi.advanceTimersByTime(599)
    expect(f.state().visible).toBe(true)
    vi.advanceTimersByTime(1)
    expect(f.state().visible).toBe(false)
    f.host.dispose()
  })
  it('supports persistent messages, queued dismissal and clearing during an exit', () => {
    vi.useFakeTimers()
    const f = fixture()
    const first = f.controller.show({ message: 'Persistent', duration: 0 })!
    const second = f.controller.show({ message: 'Removed from queue' })!
    f.controller.show({ message: 'Third' })
    f.enter()
    vi.advanceTimersByTime(100000)
    expect(f.state().visible).toBe(true)
    f.controller.dismiss(second)
    f.controller.dismiss(first)
    f.controller.clear()
    f.host.left(first)
    expect(f.state().message).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
    f.host.dispose()
  })
  it('handles dismissal before mounting and ignores stale transition callbacks', () => {
    vi.useFakeTimers()
    const f = fixture()
    const first = f.controller.show({ message: 'First' })!
    f.controller.dismiss(first)
    f.controller.show({ message: 'Next', duration: 1000 })
    const second = f.enter()
    f.host.left(first)
    f.host.entered(first)
    f.controller.dismiss(first)
    expect(f.state().message?.id).toBe(second)
    vi.advanceTimersByTime(1000)
    expect(f.state().visible).toBe(false)
    f.host.dispose()
  })
  it('clears a retained page on unload, rejects late work and accepts fresh work on return', () => {
    vi.useFakeTimers()
    const f = fixture()
    f.controller.show({ message: 'Leaving', duration: 1000 })
    const id = f.enter()
    f.controller.show({ message: 'Pending' })
    f.host.deactivate()
    f.host.left(id)
    f.host.entered(id)
    expect(f.controller.show({ message: 'Late async response' })).toBeUndefined()
    expect(f.state().message).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
    f.host.activate()
    f.controller.show({ message: 'Returned' })
    expect(f.state().message?.message).toBe('Returned')
    f.host.dispose()
  })
  it('isolates queues, enforces one host and releases clocks with the Vue scope', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const controller = scope.run(() => useToast())!
    let state: ToastSnapshot = { visible: false }
    const host = connectToast(controller, (next) => {
      state = next
    })
    host.activate()
    expect(() => connectToast(controller, () => {})).toThrow('one MToast host')
    const other = fixture()
    controller.show({ message: 'Local', duration: 1000 })
    host.begin(state.message!.id)
    host.entered(state.message!.id)
    expect(other.state().message).toBeUndefined()
    scope.stop()
    expect(vi.getTimerCount()).toBe(0)
    expect(controller.show({ message: 'Too late' })).toBeUndefined()
    host.dispose()
    other.host.dispose()
    expect(() => connectToast(controller, () => {})).toThrow('active Mavis Toast controller')
    expect(() => useToast()).toThrow('Vue setup')
  })
  it('allows a host to rebind without old lifecycle callbacks affecting the new host', () => {
    const controller = createToastController()
    const old = connectToast(controller, () => {})
    old.activate()
    old.dispose()
    let state: ToastSnapshot = { visible: false }
    const next = connectToast(controller, (value) => {
      state = value
    })
    next.activate()
    controller.show({ message: 'New host' })
    old.deactivate()
    old.pause('background', true)
    old.dispose()
    expect(state.message?.message).toBe('New host')
    disposeToast(controller)
    next.dispose()
  })
})
