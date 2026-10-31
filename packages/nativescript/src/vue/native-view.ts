import type { View } from '@nativescript/core'

/** Template refs on native elements wrap the NativeScript view. */
export function nativeViewOf<T extends View>(element: { nativeView: T } | undefined) {
  return element?.nativeView
}
