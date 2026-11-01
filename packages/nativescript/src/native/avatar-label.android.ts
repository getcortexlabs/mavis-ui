import { Label, Utils } from '@nativescript/core'
import { fontSizeProperty } from '@nativescript/core/ui/styling/style-properties'

declare const android: { util: { TypedValue: { COMPLEX_UNIT_PX: number } } }

/** Initials are a fixed visual mark; the adjacent name remains scalable text. */
export class MavisAvatarLabel extends Label {
  [fontSizeProperty.setNative](value: number | { nativeSize: number }) {
    this.nativeTextViewProtected.setTextSize(
      android.util.TypedValue.COMPLEX_UNIT_PX,
      typeof value === 'number' ? Utils.layout.toDevicePixels(value) : value.nativeSize,
    )
  }
}
