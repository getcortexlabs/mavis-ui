import { Button, Font, type Span } from '@nativescript/core'
import { fontScaleInternalProperty } from '@nativescript/core/ui/styling/style-properties'
import { recordMeasurement, reuseMeasurement, type MeasureRecord } from './measure-memo'
import { applyDynamicType, dynamicTypeScale } from './dynamic-type'

interface SpanDetails {
  iosFont: unknown
  baselineOffset: number
}
interface FormattedText {
  createMutableStringDetails(span: Span, text: string, index?: number): SpanDetails
  getBaselineOffset(font: unknown, align: unknown): number
}
const formatted = Button.prototype as unknown as FormattedText

export class MavisButton extends Button {
  measureRecord?: MeasureRecord;

  [fontScaleInternalProperty.setNative]() {
    applyDynamicType(this)
  }

  // Icon buttons render their label as spans, which Core scales with its own table too.
  createMutableStringDetails(span: Span, text: string, index?: number) {
    const details = formatted.createMutableStringDetails.call(this, span, text, index)
    const { style } = span
    const size = style.fontSize ?? this.style.fontSize
    const font = new Font(
      style.fontFamily,
      style.fontSize,
      style.fontStyle,
      style.fontWeight,
      dynamicTypeScale(this, size),
      style.fontVariationSettings,
    )
    details.iosFont = font.getUIFont(this.nativeTextViewProtected.font)
    details.baselineOffset = formatted.getBaselineOffset.call(
      this,
      details.iosFont,
      style.verticalAlignment,
    )
    return details
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
