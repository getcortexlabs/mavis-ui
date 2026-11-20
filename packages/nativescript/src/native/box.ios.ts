import { GridLayout, Utils, View } from '@nativescript/core'
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

  // MBox is one shared area. Core centres a fixed child whose default alignment
  // is stretch; CSS grid instead anchors that child at the start of the area.
  // Offer only its measured extent on a fixed axis, without changing its style
  // or laying it out twice. Unsized axes still receive the whole content area.
  onLayout(left: number, top: number, right: number, bottom: number) {
    const insets = this.getSafeAreaInsets()
    const x = this.effectiveBorderLeftWidth + this.effectivePaddingLeft + insets.left
    const y = this.effectiveBorderTopWidth + this.effectivePaddingTop + insets.top
    const endX =
      right - left - this.effectiveBorderRightWidth - this.effectivePaddingRight - insets.right
    const endY =
      bottom - top - this.effectiveBorderBottomWidth - this.effectivePaddingBottom - insets.bottom
    this.eachLayoutChild((child) => {
      const fixedX = child.effectiveWidth >= 0 && child.horizontalAlignment === 'stretch'
      const fixedY = child.effectiveHeight >= 0 && child.verticalAlignment === 'stretch'
      View.layoutChild(
        this,
        child,
        x,
        y,
        fixedX
          ? x + child.getMeasuredWidth() + child.effectiveMarginLeft + child.effectiveMarginRight
          : endX,
        fixedY
          ? y + child.getMeasuredHeight() + child.effectiveMarginTop + child.effectiveMarginBottom
          : endY,
      )
    })
  }

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
