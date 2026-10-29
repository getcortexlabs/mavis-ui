import { Color, Property, Slider, backgroundColorProperty } from '@nativescript/core'

interface SemanticRange {
  min: number
  max: number
  step: number
  value: number
  label: string
}

declare const com: {
  mavis: {
    ui: {
      AccessibleSlider: new (context: unknown) => {
        setSemanticRange(
          min: number,
          max: number,
          step: number,
          value: number,
          text: string,
          label: string,
        ): void
      }
    }
  }
}

const semanticRangeProperty = new Property<MavisSlider, SemanticRange>({ name: 'semanticRange' })

export class MavisSlider extends Slider {
  createNativeView() {
    return new com.mavis.ui.AccessibleSlider(this._context)
  }

  [backgroundColorProperty.setNative](value: Color) {
    if (value instanceof Color) this.nativeViewProtected.setTrackColor(value.android)
  }

  [semanticRangeProperty.setNative](range: SemanticRange) {
    if (!range) return
    this.nativeViewProtected.setSemanticRange(
      range.min,
      range.max,
      range.step,
      range.value,
      String(range.value),
      range.label,
    )
  }
}

semanticRangeProperty.register(MavisSlider)
