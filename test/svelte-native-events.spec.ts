import { afterEach, expect, it, vi } from 'vitest'
import { normalizeNativeCustomEvent } from '../packages/svelte-nativescript/src/custom-event.js'
afterEach(() => vi.unstubAllGlobals())
it('repairs the native CustomEventInit mismatch without wrapping dispatched payloads', () => {
  class NativeEvent {
    constructor(
      readonly type: string,
      readonly detail: unknown,
    ) {}
  }
  vi.stubGlobal('CustomEvent', NativeEvent)
  normalizeNativeCustomEvent()
  const payload = { value: 'Grace' }
  const event = new CustomEvent('change', { detail: payload, cancelable: true })
  expect(event.detail).toBe(payload)
  expect(event.defaultPrevented).toBe(false)
  event.preventDefault()
  expect(event.defaultPrevented).toBe(true)
  const fixed = globalThis.CustomEvent
  normalizeNativeCustomEvent()
  expect(globalThis.CustomEvent).toBe(fixed)
  const noncancelable = new CustomEvent('change', { detail: false })
  noncancelable.preventDefault()
  expect(noncancelable.detail).toBe(false)
  expect(noncancelable.defaultPrevented).toBe(false)
})
