import { GridLayout, Utils } from '@nativescript/core'

const { layout } = Utils

/** An auto-height Box takes its content height when the parent only limits the available space. */
export class MavisBox extends GridLayout {
  onMeasure(widthSpec: number, heightSpec: number) {
    const relaxed =
      this.effectiveHeight < 0 && layout.getMeasureSpecMode(heightSpec) === layout.AT_MOST
        ? layout.makeMeasureSpec(0, layout.UNSPECIFIED)
        : heightSpec
    super.onMeasure(widthSpec, relaxed)
  }
}
