import { describe, expect, it, vi } from 'vitest'

const secure = vi.hoisted(() => Symbol('secure'))
vi.mock('@nativescript/core/ui/text-field/text-field-common', () => ({
  secureProperty: { setNative: secure },
}))
vi.mock('@nativescript/core/ui/styling/style-properties', () => ({
  fontScaleInternalProperty: { setNative: Symbol('fontScale') },
}))
vi.mock('../packages/nativescript/src/native/dynamic-type', () => ({
  applyDynamicType: vi.fn(),
}))
vi.mock('@nativescript/core', () => ({
  TextField: class {
    _firstEdit = true
    ios: any;
    [secure](value: boolean) {
      this.ios.secureTextEntry = value
      this.ios.selectedTextRange = { start: 0, end: 0 }
    }
  },
}))

import { MavisTextField } from '../packages/nativescript/src/native/text-field.ios.js'

function editor(active: boolean) {
  const changed = vi.fn()
  const field = new MavisTextField()
  const native = {
    isFirstResponder: active,
    text: 'mavis-password',
    selectedTextRange: { start: 3, end: 7 },
    beginningOfDocument: 0,
    delegate: { changed },
    offsetFromPositionToPosition: (_start: number, end: number) => end,
    positionFromPositionOffset: (_start: number, offset: number) => offset,
    textRangeFromPositionToPosition: (start: number, end: number) => ({ start, end }),
    insertText: vi.fn(function (this: any, text: string) {
      this.text += text
      this.delegate?.changed()
    }),
  }
  Object.assign(field, { ios: native })
  const toggle = (value: boolean) =>
    (field as unknown as Record<symbol, (value: boolean) => void>)[secure]!(value)
  return { field, native, changed, toggle }
}

describe('iOS password visibility during an edit', () => {
  it('retains the selection and value without emitting a synthetic edit', () => {
    const { field, native, changed, toggle } = editor(true)
    const delegate = native.delegate
    toggle(true)
    expect(native.text).toBe('mavis-password')
    expect(native.selectedTextRange).toEqual({ start: 3, end: 7 })
    expect(native.isFirstResponder).toBe(true)
    expect(native.delegate).toBe(delegate)
    expect(changed).not.toHaveBeenCalled()
    expect((field as unknown as { _firstEdit: boolean })._firstEdit).toBe(false)
    toggle(false)
    expect(native.text).toBe('mavis-password')
    expect(native.selectedTextRange).toEqual({ start: 3, end: 7 })
  })

  it('does not start an edit or prime UIKit when the field is unfocused', () => {
    const { field, native, toggle } = editor(false)
    toggle(true)
    expect(native.isFirstResponder).toBe(false)
    expect(native.insertText).not.toHaveBeenCalled()
    expect((field as unknown as { _firstEdit: boolean })._firstEdit).toBe(true)
    expect(native.text).toBe('mavis-password')
  })

  it('restores the delegate even if UIKit rejects the insertion', () => {
    const { native, toggle } = editor(true)
    const delegate = native.delegate
    native.insertText.mockImplementation(() => {
      throw new Error('Insertion failed')
    })
    expect(() => toggle(true)).toThrow('Insertion failed')
    expect(native.delegate).toBe(delegate)
  })
})
