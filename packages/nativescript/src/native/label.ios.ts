import { Label, Utils } from '@nativescript/core'

export class MavisLabel extends Label {
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
