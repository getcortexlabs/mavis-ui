import { Color, Slider, backgroundColorProperty } from '@nativescript/core'
import { sliderScale } from '@mavis-ui/core'

export class MavisSlider extends Slider {
  // The last interval can be shorter than step. Move by an index so decrementing
  // from max visits that interval instead of skipping the previous value.
  _handlerAccessibilityIncrementEvent() {
    return this.adjust(1)
  }

  _handlerAccessibilityDecrementEvent() {
    return this.adjust(-1)
  }

  private adjust(direction: number) {
    if (!this.isEnabled) return this.value
    const scale = sliderScale(this.minValue, this.maxValue, this.accessibilityStep)
    return scale.fromNative(scale.toNative(this.value) + direction)
  }

  [backgroundColorProperty.setNative](value: Color) {
    const color = value instanceof Color ? value.ios : value
    this.ios.minimumTrackTintColor = color
    this.ios.maximumTrackTintColor = color
  }
}
