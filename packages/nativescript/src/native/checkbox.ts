import type { View } from '@nativescript/core'

export function mixedValue(indeterminate: boolean, label: string) {
  return indeterminate ? label : ''
}

export function observeCheckbox(_view: View, _focus: (focused: boolean) => void) {
  return { setMixed(_label: string | undefined) {}, dispose() {} }
}
