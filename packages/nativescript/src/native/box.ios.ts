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
    // Grid calculates cell sizes from the arguments, but View.measureChild resolves a
    // percentage from the parent's stored spec. Supply the content width for that lookup.
    const measurement = this as unknown as { _currentWidthMeasureSpec: number }
    const original = measurement._currentWidthMeasureSpec
    const contentWidth = Math.max(
      0,
      layout.getMeasureSpecSize(widthSpec) -
        this.effectivePaddingLeft -
        this.effectivePaddingRight -
        this.effectiveBorderLeftWidth -
        this.effectiveBorderRightWidth,
    )
    measurement._currentWidthMeasureSpec = layout.makeMeasureSpec(
      contentWidth,
      layout.getMeasureSpecMode(widthSpec),
    )
    try {
      super.onMeasure(widthSpec, relaxed)
    } finally {
      measurement._currentWidthMeasureSpec = original
    }
  }
}
