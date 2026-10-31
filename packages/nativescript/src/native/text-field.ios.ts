import { TextField } from '@nativescript/core'
import { fontScaleInternalProperty } from '@nativescript/core/ui/styling/style-properties'
import { applyDynamicType } from './dynamic-type'

/** Follows the system text size with the iOS body curve instead of Core's table. */
export class MavisTextField extends TextField {
  [fontScaleInternalProperty.setNative]() {
    applyDynamicType(this)
  }
}
