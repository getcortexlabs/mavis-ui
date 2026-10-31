import { Utils, type View } from '@nativescript/core'

const { layout } = Utils

interface ChildRecord {
  view: View
  widthSpec: number
  heightSpec: number
  width: number
  height: number
}
export interface MeasureRecord {
  widthSpec: number
  heightSpec: number
  width: number
  height: number
  percent: boolean
  /** The looser request clamped content that wanted more room; an exact size would shrink it. */
  clamped: boolean
  children: ChildRecord[]
}
interface Internals {
  _currentWidthMeasureSpec: number
  _currentHeightMeasureSpec: number
  _measuredWidth: number
  _measuredHeight: number
  _setCurrentMeasureSpecs(widthSpec: number, heightSpec: number): boolean
  isLayoutRequested: boolean
}
export interface Memoized extends View {
  measureRecord?: MeasureRecord
}

const isPercent = (value: unknown) =>
  typeof value === 'object' && value !== null && (value as { unit?: string }).unit === '%'

// An exact request for the size a looser request produced is the same measurement, unless a
// child resolves a percentage against the request itself or the looser request clamped content
// that wanted more room: an exact size would then shrink the children instead. Core keeps the
// too-small state only for widths, so layouts report clamping themselves.
function matches(spec: number, record: MeasureRecord, recordedSpec: number, sizeAndState: number) {
  if (spec === recordedSpec) return true
  if (record.percent || record.clamped) return false
  if (layout.getMeasureSpecMode(spec) !== layout.EXACTLY) return false
  if (layout.getMeasureSpecMode(recordedSpec) === layout.EXACTLY) return false
  if (sizeAndState & layout.MEASURED_STATE_TOO_SMALL) return false
  return layout.getMeasureSpecSize(spec) === (sizeAndState & layout.MEASURED_SIZE_MASK)
}

/** Whether a looser request on either axis returned its whole limit; for layouts that cannot tell. */
export function filledLimit(widthSpec: number, heightSpec: number, width: number, height: number) {
  const filled = (spec: number, size: number) =>
    layout.getMeasureSpecMode(spec) === layout.AT_MOST &&
    (size & layout.MEASURED_SIZE_MASK) >= layout.getMeasureSpecSize(spec)
  return filled(widthSpec, width) || filled(heightSpec, height)
}

/**
 * Core measures a view again whenever its parent asks while a layout request is pending, and
 * flex containers ask several times per pass, so nested containers measure their leaves an
 * exponential number of times. While nothing in the subtree asked for layout, the recorded
 * measurement answers a repeated request and the children are measured again from their records.
 */
export function reuseMeasurement(view: Memoized, widthSpec: number, heightSpec: number) {
  const record = view.measureRecord
  const internals = view as unknown as Internals
  if (!record || !internals.isLayoutRequested) return false
  if (!matches(widthSpec, record, record.widthSpec, record.width)) return false
  if (!matches(heightSpec, record, record.heightSpec, record.height)) return false
  internals._setCurrentMeasureSpecs(widthSpec, heightSpec)
  for (const child of record.children) {
    const current = child.view as unknown as Internals
    // A child still holding the recorded result was measured by this record's pass.
    if (current._measuredWidth === child.width && current._measuredHeight === child.height) continue
    child.view.measure(child.widthSpec, child.heightSpec)
  }
  view.setMeasuredDimension(record.width, record.height)
  return true
}

/** Stores the measurement that just completed with the specs every child last received. */
export function recordMeasurement(
  view: Memoized,
  widthSpec: number,
  heightSpec: number,
  children: readonly View[] = [],
  clamped = false,
) {
  const internals = view as unknown as Internals
  view.measureRecord = {
    widthSpec,
    heightSpec,
    width: internals._measuredWidth,
    height: internals._measuredHeight,
    percent: children.some((child) => isPercent(child.width) || isPercent(child.height)),
    clamped,
    children: children.map((child) => {
      const specs = child as unknown as Internals
      return {
        view: child,
        widthSpec: specs._currentWidthMeasureSpec,
        heightSpec: specs._currentHeightMeasureSpec,
        width: specs._measuredWidth,
        height: specs._measuredHeight,
      }
    }),
  }
}

export function layoutChildren(view: { eachLayoutChild(callback: (child: View) => void): void }) {
  const children: View[] = []
  view.eachLayoutChild((child) => {
    children.push(child)
  })
  return children
}
