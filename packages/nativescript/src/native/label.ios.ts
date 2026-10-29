import { Label } from '@nativescript/core'

export class MavisLabel extends Label {
  _requestLayoutOnTextChanged() {
    // An exact flex measurement is an allocation, not a user-defined fixed height.
    this.requestLayout()
  }
}
