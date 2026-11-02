import { afterEach, expect, it, vi } from 'vitest'
import type { View } from '@nativescript/core'
import { observeComposedButton } from '../packages/nativescript/src/native/composed-button.android.js'

afterEach(() => vi.unstubAllGlobals())
it('activates composed Android buttons once and cancels held keys on blur, disable and unload', () => {
  vi.stubGlobal('android', {
    view: {
      View: {
        OnKeyListener: class {
          constructor(value: object) {
            return value
          }
        },
        OnFocusChangeListener: class {
          constructor(value: object) {
            return value
          }
        },
      },
    },
  })
  let keys: { onKey(view: unknown, code: number, event: unknown): boolean } | null = null
  let focus: { onFocusChange(view: unknown, value: boolean): void } | null = null
  const activate = vi.fn(),
    press = vi.fn()
  let cancel: (() => void) | undefined
  const view = {
    isEnabled: true,
    on: (_name: string, fn: () => void) => {
      cancel = fn
    },
    off: (_name: string, fn: () => void) => {
      expect(fn).toBe(cancel)
      cancel = undefined
    },
    android: {
      setFocusable: vi.fn(),
      setDescendantFocusability: vi.fn(),
      setOnKeyListener: (value: typeof keys) => {
        keys = value
      },
      setOnFocusChangeListener: (value: typeof focus) => {
        focus = value
      },
      getOnFocusChangeListener: () => focus,
    },
  }
  const changed = vi.fn()
  const dispose = observeComposedButton(view as unknown as View, changed, activate, press)
  const send = (action: number, repeat = 0, canceled = false) =>
    keys!.onKey(null, 62, {
      getAction: () => action,
      getRepeatCount: () => repeat,
      isCanceled: () => canceled,
    })
  send(0)
  send(0, 1)
  send(1)
  expect(activate).toHaveBeenCalledOnce()
  send(0)
  focus!.onFocusChange(null, false)
  send(1)
  send(0)
  cancel!()
  send(1)
  send(0)
  send(1, 0, true)
  expect(activate).toHaveBeenCalledOnce()
  view.isEnabled = false
  expect(send(0)).toBe(false)
  view.isEnabled = true
  send(0)
  dispose()
  expect(press).toHaveBeenLastCalledWith(false)
  expect(keys).toBeNull()
  expect(focus).toBeNull()
  expect(cancel).toBeUndefined()
})
