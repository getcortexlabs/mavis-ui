import { Button, type FormattedString } from '@nativescript/core'
import { formattedTextProperty } from '@nativescript/core/ui/text-base'
import {
  accessibilityLabelProperty,
  accessibilityValueProperty,
} from '@nativescript/core/accessibility/accessibility-properties'

type Setter = (this: Button, value: unknown) => void
const base = Button.prototype as unknown as Record<symbol, Setter>
const setLabel = base[accessibilityLabelProperty.setNative]!
const setValue = base[accessibilityValueProperty.setNative]!
const setFormatted = base[formattedTextProperty.setNative]!

/** Core copies formatted text into `text`, so its description would repeat the label after icon glyphs. */
export class MavisButton extends Button {
  [accessibilityLabelProperty.setNative](value: string) {
    setLabel.call(this, value)
    this.describe()
  }

  [accessibilityValueProperty.setNative](value: string) {
    setValue.call(this, value)
    this.describe()
  }

  [formattedTextProperty.setNative](value: FormattedString) {
    setFormatted.call(this, value)
    this.describe()
  }

  private describe() {
    if (!this.formattedText) return
    const description = [this.accessibilityLabel, this.accessibilityValue]
      .filter(Boolean)
      .join('. ')
    this.nativeViewProtected?.setContentDescription(description)
  }
}
