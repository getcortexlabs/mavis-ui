import { expect, it, vi } from 'vitest'
import type { WebRuntime } from '@rafaelaugusto/jolt/web'
import { webVisualEffects } from '../packages/web/src/visual-effects.js'

it('prevents a replaced circle from changing interaction or starting a new animation', () => {
  const attributes = new Map<string, string>()
  const stop = vi.fn()
  const playback = { stop, finished: Promise.resolve(false) }
  const owner = { reveal: vi.fn(() => playback), conceal: vi.fn(() => playback) }
  const target = {
    style: { visibility: '' },
    ownerDocument: { activeElement: null },
    contains: () => false,
    getAttribute: (name: string) => attributes.get(name) ?? null,
    removeAttribute: (name: string) => attributes.delete(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  }
  const effects = webVisualEffects(
    owner as unknown as WebRuntime,
    target as unknown as HTMLElement,
    new WeakMap(),
    () => false,
  )
  const first = effects.circular()
  first.conceal()
  const second = effects.circular()
  expect(stop).toHaveBeenCalledOnce()
  expect(attributes.has('inert')).toBe(false)
  expect(() => first.conceal()).toThrow(/disposed or replaced/)
  expect(owner.conceal).toHaveBeenCalledOnce()
  attributes.set('aria-hidden', 'false')
  second.conceal()
  second.reveal()
  expect(attributes.get('aria-hidden')).toBe('false')
  first.dispose()
  second.dispose()
})
