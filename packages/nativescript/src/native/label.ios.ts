import { Label, Utils } from '@nativescript/core'
import { fontScaleInternalProperty } from '@nativescript/core/ui/styling/style-properties'
import type { TextVariant } from '@getcortexlabs/mavis-core'
import { recordMeasurement, reuseMeasurement, type MeasureRecord } from './measure-memo'
import { applyDynamicType } from './dynamic-type'

export class MavisLabel extends Label {
  measureRecord?: MeasureRecord
  private textStyle: TextVariant = 'body'

  get dynamicTypeStyle() {
    return this.textStyle
  }

  set dynamicTypeStyle(value: TextVariant) {
    if (value === this.textStyle) return
    this.textStyle = value
    applyDynamicType(this)
  }

  [fontScaleInternalProperty.setNative]() {
    applyDynamicType(this)
  }

  measure(widthSpec: number, heightSpec: number) {
    if (reuseMeasurement(this, widthSpec, heightSpec)) return
    super.measure(widthSpec, heightSpec)
    recordMeasurement(this, widthSpec, heightSpec)
  }

  requestLayout() {
    this.measureRecord = undefined
    super.requestLayout()
  }

  disposeNativeView() {
    const native = this.nativeViewProtected
    super.disposeNativeView()
    // A detached label kept alive by the JS wrapper can remain in VoiceOver's
    // offscreen traversal cache. Disposal ends this native instance's lifetime.
    if (native) Utils.releaseNativeObject(native)
  }

  _requestLayoutOnTextChanged() {
    // An exact flex measurement is an allocation, not a user-defined fixed height.
    this.requestLayout()
  }
}
