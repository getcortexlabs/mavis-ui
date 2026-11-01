import { FlexboxLayout, Utils, type View } from '@nativescript/core'
import { applyColumnShrink } from './flex-children'
import {
  layoutChildren,
  recordMeasurement,
  reuseMeasurement,
  type MeasureRecord,
} from './measure-memo'

// Core 9.1.3 computes row heights before growing children. This adapter runs after width
// allocation and before cross-axis alignment; no global prototype or consumer styles change.
interface FlexMeasurement {
  _checkSizeConstraints(child: View): void
  _stretchViewHorizontally(child: View, crossSize: number): void
  _currentWidthMeasureSpec: number
  _currentHeightMeasureSpec: number
  _determineMainSize(direction: string, widthSpec: number, heightSpec: number): void
  _flexLines: {
    _itemCount: number
    _crossSize: number
    _mainSize: number
    _gapLengthInMainSize: number
  }[]
  _getReorderedChildAt(index: number): View
  _getLargestMainSize(): number
  _getSumOfCrossSize(): number
  effectiveRowGap: number
}

const { layout } = Utils
const base = FlexboxLayout.prototype as unknown as FlexMeasurement

export class MavisFlexLayout extends FlexboxLayout {
  measureRecord?: MeasureRecord

  // Core's iOS Flexbox omits borders from its content insets. Keep the adjustment local
  // to measurement/layout and leave the declared padding and derived values intact afterwards.
  private withBorderPadding(run: () => void) {
    const left = this.effectivePaddingLeft
    const right = this.effectivePaddingRight
    const top = this.effectivePaddingTop
    const bottom = this.effectivePaddingBottom
    this.effectivePaddingLeft += this.effectiveBorderLeftWidth
    this.effectivePaddingRight += this.effectiveBorderRightWidth
    this.effectivePaddingTop += this.effectiveBorderTopWidth
    this.effectivePaddingBottom += this.effectiveBorderBottomWidth
    try {
      run()
    } finally {
      this.effectivePaddingLeft = left
      this.effectivePaddingRight = right
      this.effectivePaddingTop = top
      this.effectivePaddingBottom = bottom
    }
  }

  onMeasure(widthSpec: number, heightSpec: number) {
    this.withBorderPadding(() => super.onMeasure(widthSpec, heightSpec))
  }

  onLayout(left: number, top: number, right: number, bottom: number) {
    this.withBorderPadding(() => super.onLayout(left, top, right, bottom))
  }

  _checkSizeConstraints(child: View) {
    const measurement = this as unknown as FlexMeasurement
    const width = child.width
    const spec = measurement._currentWidthMeasureSpec
    if (
      typeof width === 'object' &&
      width.unit === '%' &&
      layout.getMeasureSpecMode(spec) !== layout.UNSPECIFIED
    ) {
      // Core initially resolves percentages against the outer request. Correct the derived
      // size before it forms flex lines, so wrapping/growth/shrink use the content-box basis.
      child.effectiveWidth =
        Math.max(
          0,
          layout.getMeasureSpecSize(spec) - this.effectivePaddingLeft - this.effectivePaddingRight,
        ) * width.value
      this.measureAtWidth(child, child.effectiveWidth, measurement._currentHeightMeasureSpec)
    }
    base._checkSizeConstraints.call(this, child)
  }

  _stretchViewHorizontally(child: View, crossSize: number) {
    // A declared width wins over alignItems=stretch, as it does in CSS flex layout.
    if (child.effectiveWidth < 0) base._stretchViewHorizontally.call(this, child, crossSize)
  }

  measure(widthSpec: number, heightSpec: number) {
    if (reuseMeasurement(this, widthSpec, heightSpec)) return
    super.measure(widthSpec, heightSpec)
    recordMeasurement(
      this,
      widthSpec,
      heightSpec,
      layoutChildren(this),
      this.contentExceeds(widthSpec, heightSpec),
    )
  }

  // Core measures a looser request without shrinking, so its lines tell whether the content
  // wanted more room than the request allowed.
  private contentExceeds(widthSpec: number, heightSpec: number) {
    const measurement = this as unknown as FlexMeasurement
    const column = this.flexDirection.startsWith('column')
    const main = measurement._getLargestMainSize()
    const cross = measurement._getSumOfCrossSize()
    const maxHeight = column
      ? main
      : cross +
        this.effectivePaddingTop +
        this.effectivePaddingBottom +
        this.effectiveBorderTopWidth +
        this.effectiveBorderBottomWidth
    const maxWidth = column
      ? cross +
        this.effectivePaddingLeft +
        this.effectivePaddingRight +
        this.effectiveBorderLeftWidth +
        this.effectiveBorderRightWidth
      : main
    const exceeds = (spec: number, size: number) =>
      layout.getMeasureSpecMode(spec) === layout.AT_MOST && layout.getMeasureSpecSize(spec) < size
    return exceeds(heightSpec, maxHeight) || exceeds(widthSpec, maxWidth)
  }

  requestLayout() {
    this.measureRecord = undefined
    super.requestLayout()
  }

  _registerLayoutChild(child: View) {
    super._registerLayoutChild(child)
    applyColumnShrink(this, child)
  }

  onLoaded() {
    super.onLoaded()
    this.eachLayoutChild((child) => applyColumnShrink(this, child))
  }

  _determineMainSize(direction: string, widthSpec: number, heightSpec: number) {
    if (direction === 'column' || direction === 'column-reverse') this.keepRowGaps()
    if (direction === 'column' && this.alignItems === 'stretch' && this.flexWrap === 'nowrap') {
      const measurement = this as unknown as FlexMeasurement
      const width =
        layout.getMeasureSpecSize(widthSpec) -
        this.effectivePaddingLeft -
        this.effectivePaddingRight
      let index = 0
      for (const line of measurement._flexLines) {
        for (let i = 0; i < line._itemCount; i++, index++) {
          const child = measurement._getReorderedChildAt(index)
          if (!child || child.isCollapsed) continue
          if (child.effectiveWidth >= 0) continue
          const alignSelf = FlexboxLayout.getAlignSelf(child)
          if (alignSelf !== 'auto' && alignSelf !== 'stretch') continue
          const oldHeight = child.getMeasuredHeight()
          const cross =
            layout.getMeasureSpecMode(widthSpec) === layout.EXACTLY ? width : line._crossSize
          this.measureAtWidth(
            child,
            Math.max(0, cross - child.effectiveMarginLeft - child.effectiveMarginRight),
            heightSpec,
          )
          line._mainSize += child.getMeasuredHeight() - oldHeight
        }
      }
    }
    base._determineMainSize.call(this, direction, widthSpec, heightSpec)
    if (direction !== 'row' && direction !== 'row-reverse') return

    const measurement = this as unknown as FlexMeasurement
    let index = 0
    for (const line of measurement._flexLines) {
      let height = 0
      for (let i = 0; i < line._itemCount; i++, index++) {
        const child = measurement._getReorderedChildAt(index)
        if (!child || child.isCollapsed) continue
        const margins = child.effectiveMarginTop + child.effectiveMarginBottom
        this.measureAtWidth(child, child.getMeasuredWidth(), heightSpec)
        height = Math.max(height, child.getMeasuredHeight() + margins)
      }
      line._crossSize = height
    }
  }

  // Core 9.1.3 adds row gaps to a column's main size but not to its gap total, so the growth and
  // shrink passes measured the column shorter by every gap and squeezed shrinking children.
  private keepRowGaps() {
    const measurement = this as unknown as FlexMeasurement
    if (!(measurement.effectiveRowGap > 0)) return
    let index = 0
    for (const line of measurement._flexLines) {
      let visible = 0
      for (let i = 0; i < line._itemCount; i++, index++) {
        const child = measurement._getReorderedChildAt(index)
        if (child && !child.isCollapsed) visible++
      }
      line._gapLengthInMainSize = measurement.effectiveRowGap * Math.max(0, visible - 1)
    }
  }

  private measureAtWidth(child: View, width: number, heightSpec: number) {
    const available = Math.max(
      0,
      layout.getMeasureSpecSize(heightSpec) -
        this.effectivePaddingTop -
        this.effectivePaddingBottom -
        child.effectiveMarginTop -
        child.effectiveMarginBottom,
    )
    const mode =
      layout.getMeasureSpecMode(heightSpec) === layout.UNSPECIFIED
        ? layout.UNSPECIFIED
        : layout.AT_MOST
    child.measure(
      layout.makeMeasureSpec(width, layout.EXACTLY),
      child.effectiveHeight >= 0
        ? layout.makeMeasureSpec(child.effectiveHeight, layout.EXACTLY)
        : layout.makeMeasureSpec(available, mode),
    )
  }
}
