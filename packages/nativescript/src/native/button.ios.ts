import { Button } from '@nativescript/core'

export class MavisButton extends Button {
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
