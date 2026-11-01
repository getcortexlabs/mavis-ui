import { Label, type FormattedString } from '@nativescript/core'

declare const android: { text: { style: { AbsoluteSizeSpan: { class: unknown } } } }
interface StyledText {
  length(): number
  getSpans(start: number, end: number, type: unknown): ArrayLike<unknown>
  removeSpan(span: unknown): void
}
const format = (
  Label.prototype as unknown as {
    createFormattedTextNative(value: FormattedString): StyledText
  }
).createFormattedTextNative

/** MSpan inherits one label size; keep Android's scaled text size instead of Core's fixed-size spans. */
export class MavisLabel extends Label {
  createFormattedTextNative(value: FormattedString) {
    const text = format.call(this, value)
    if (!text) return text
    // Core skips the TextView size setter for formatted text. Use sp here so the
    // same inherited size reaches every run and Android applies system scaling.
    if (this.fontSize > 0) this.nativeTextViewProtected.setTextSize(this.fontSize)
    const sizes = text.getSpans(0, text.length(), android.text.style.AbsoluteSizeSpan.class)
    for (let index = 0; index < sizes.length; index++) text.removeSpan(sizes[index])
    return text
  }
}
