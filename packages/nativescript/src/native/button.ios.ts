import { Button } from '@nativescript/core'
import { recordMeasurement, reuseMeasurement, type MeasureRecord } from './measure-memo'

export class MavisButton extends Button {
  measureRecord?: MeasureRecord

  measure(widthSpec: number, heightSpec: number) {
    if (reuseMeasurement(this, widthSpec, heightSpec)) return
    super.measure(widthSpec, heightSpec)
    recordMeasurement(this, widthSpec, heightSpec)
  }

  requestLayout() {
    this.measureRecord = undefined
    super.requestLayout()
  }

  onMeasure(widthSpec: number, heightSpec: number) {
    const button = this.ios
    // UIButton updates titleLabel during its layout pass. Wrapped measurement needs the
    // current title now, otherwise it measures the previous label after a text change.
    if (button.currentAttributedTitle) {
      button.titleLabel.attributedText = button.currentAttributedTitle
    } else {
      button.titleLabel.text = button.currentTitle
    }
    super.onMeasure(widthSpec, heightSpec)
  }
}
