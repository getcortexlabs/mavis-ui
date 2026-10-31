import { Font, type TextBase } from '@nativescript/core'
import type { TextVariant } from '@getcortexlabs/mavis-core'

interface Metrics {
  scaledValueForValueCompatibleWithTraitCollection(value: number, traits: unknown): number
}
declare const UIApplication: { sharedApplication: { preferredContentSizeCategory: string } }
declare const UITraitCollection: {
  traitCollectionWithPreferredContentSizeCategory(category: string): unknown
}
declare const UIFontMetrics: { metricsForTextStyle(style: string): Metrics }
declare const UIButton: unknown
declare const UIFontTextStyleLargeTitle: string
declare const UIFontTextStyleTitle1: string
declare const UIFontTextStyleTitle3: string
declare const UIFontTextStyleBody: string
declare const UIFontTextStyleFootnote: string
declare const UIFontTextStyleCaption2: string

export interface DynamicTypeView extends TextBase {
  dynamicTypeStyle?: TextVariant
}
interface NativeText {
  font: { pointSize: number }
  titleLabel?: { font: { pointSize: number } }
}

// The iOS text style whose default size is closest to each Mavis variant.
const textStyle = (variant: TextVariant) =>
  ({
    display: UIFontTextStyleLargeTitle,
    title: UIFontTextStyleTitle1,
    heading: UIFontTextStyleTitle3,
    body: UIFontTextStyleBody,
    caption: UIFontTextStyleFootnote,
    overline: UIFontTextStyleCaption2,
  })[variant]

/**
 * The ratio iOS applies to a font of `size` points in the view's text style at the current
 * content size category. Core maps the categories to its own table, which halves text at the
 * smallest size and snaps any other value back to it, so Mavis reads the system's Dynamic Type
 * curve instead. The curve is not linear since iOS 17, so the ratio depends on the size.
 */
export function dynamicTypeScale(view: DynamicTypeView, size: number): number {
  if (!view.iosAccessibilityAdjustsFontSize || !(size > 0)) return 1
  const category = UIApplication.sharedApplication.preferredContentSizeCategory
  const traits = UITraitCollection.traitCollectionWithPreferredContentSizeCategory(category)
  const metrics = UIFontMetrics.metricsForTextStyle(textStyle(view.dynamicTypeStyle ?? 'body'))
  let scale = metrics.scaledValueForValueCompatibleWithTraitCollection(size, traits) / size
  const { iosAccessibilityMinFontScale: min, iosAccessibilityMaxFontScale: max } = view
  if (min && min > scale) scale = min
  if (max && max < scale) scale = max
  return scale
}

/** Core's font scale setter with the system ratio in place of Core's table. */
export function applyDynamicType(view: DynamicTypeView) {
  const native = view.nativeTextViewProtected as NativeText | undefined
  if (!native) return
  const label =
    native instanceof (UIButton as never) && native.titleLabel ? native.titleLabel : native
  const font = view.style.fontInternal || Font.default.withFontSize(label.font.pointSize)
  const scale = dynamicTypeScale(view, font.fontSize)
  if (font.fontScale !== scale) {
    view.style.fontInternal = font.withFontScale(scale)
    view.requestLayout()
  } else if (!view.style.fontInternal) {
    view.style.fontInternal = font
  }
}
