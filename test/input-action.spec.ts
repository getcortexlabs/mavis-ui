import { describe, expect, it } from 'vitest'
import type { View } from '@nativescript/core'
import { keepEditingOn, isEditingAction } from '../packages/nativescript/src/native/input-action.js'

describe('native input action ownership', () => {
  it('keeps only its own active editor focused and releases the association', () => {
    const button = { ios: {} } as View
    const editor = { ios: { isFirstResponder: true } } as View
    const release = keepEditingOn(button, () => editor)
    expect(isEditingAction(button.ios)).toBe(true)
    expect(isEditingAction({})).toBe(false)
    editor.ios.isFirstResponder = false
    expect(isEditingAction(button.ios)).toBe(false)
    editor.ios.isFirstResponder = true
    release()
    expect(isEditingAction(button.ios)).toBe(false)
  })
})
