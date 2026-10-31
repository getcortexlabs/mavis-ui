import { GridLayout, Utils } from '@nativescript/core'
import {
  filledLimit,
  layoutChildren,
  recordMeasurement,
  reuseMeasurement,
  type MeasureRecord,
} from './measure-memo'

const { layout } = Utils

/** An auto-height Box takes its content height when the parent only limits the available space. */
export class MavisBox extends GridLayout {
  measureRecord?: MeasureRecord

  measure(widthSpec: number, heightSpec: number) {
    if (reuseMeasurement(this, widthSpec, heightSpec)) return
    super.measure(widthSpec, heightSpec)
    const measured = this as unknown as { _measuredWidth: number; _measuredHeight: number }
    recordMeasurement(
      this,
      widthSpec,
      heightSpec,
      layoutChildren(this),
      filledLimit(widthSpec, heightSpec, measured._measuredWidth, measured._measuredHeight),
    )
  }

  requestLayout() {
    this.measureRecord = undefined
    super.requestLayout()
  }

  onMeasure(widthSpec: number, heightSpec: number) {
    const relaxed =
      this.effectiveHeight < 0 && layout.getMeasureSpecMode(heightSpec) === layout.AT_MOST
        ? layout.makeMeasureSpec(0, layout.UNSPECIFIED)
        : heightSpec
    super.onMeasure(widthSpec, relaxed)
  }
}
