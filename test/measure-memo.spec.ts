import { describe, expect, it, vi } from 'vitest'
import {
  recordMeasurement,
  reuseMeasurement,
  type Memoized,
} from '../packages/nativescript/src/native/measure-memo.js'

vi.mock('@nativescript/core', () => {
  const MODE_SHIFT = 30
  const MODE_MASK = 0x3 << MODE_SHIFT
  const layout = {
    UNSPECIFIED: 0,
    EXACTLY: 1 << MODE_SHIFT,
    AT_MOST: 2 << MODE_SHIFT,
    MEASURED_SIZE_MASK: 0x00ffffff,
    MEASURED_STATE_TOO_SMALL: 0x01000000,
    makeMeasureSpec: (size: number, mode: number) => (size & ~MODE_MASK) | (mode & MODE_MASK),
    getMeasureSpecMode: (spec: number) => spec & MODE_MASK,
    getMeasureSpecSize: (spec: number) => spec & ~MODE_MASK,
  }
  return { Utils: { layout } }
})

const MODE_SHIFT = 30
const EXACTLY = 1 << MODE_SHIFT
const AT_MOST = 2 << MODE_SHIFT
const spec = (size: number, mode: number) => size | mode

interface FakeView {
  _measuredWidth: number
  _measuredHeight: number
  _currentWidthMeasureSpec: number
  _currentHeightMeasureSpec: number
  isLayoutRequested: boolean
  width: unknown
  height: unknown
  measured: number
  measureRecord?: unknown
  _setCurrentMeasureSpecs(w: number, h: number): boolean
  setMeasuredDimension(w: number, h: number): void
  measure(w: number, h: number): void
}

function view(width: number, height: number, options: Partial<FakeView> = {}): FakeView {
  const fake: FakeView = {
    _measuredWidth: 0,
    _measuredHeight: 0,
    _currentWidthMeasureSpec: 0,
    _currentHeightMeasureSpec: 0,
    isLayoutRequested: true,
    width: 'auto',
    height: 'auto',
    measured: 0,
    _setCurrentMeasureSpecs(w, h) {
      const changed = fake._currentWidthMeasureSpec !== w || fake._currentHeightMeasureSpec !== h
      fake._currentWidthMeasureSpec = w
      fake._currentHeightMeasureSpec = h
      return changed
    },
    setMeasuredDimension(w, h) {
      fake._measuredWidth = w
      fake._measuredHeight = h
    },
    measure(w, h) {
      fake.measured++
      fake._setCurrentMeasureSpecs(w, h)
      fake.setMeasuredDimension(Math.min(width, w & 0x00ffffff), height)
    },
    ...options,
  }
  return fake
}
const memoized = (fake: FakeView) => fake as unknown as Memoized

describe('measurement memo', () => {
  it('answers the same request again and an exact request for the size a looser one produced', () => {
    const child = view(120, 40)
    const parent = view(300, 40)
    parent.measure(spec(300, AT_MOST), spec(500, AT_MOST))
    child.measure(spec(300, AT_MOST), spec(500, AT_MOST))
    recordMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST), [child as never])
    expect(reuseMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST))).toBe(true)
    expect(reuseMeasurement(memoized(parent), spec(300, EXACTLY), spec(40, EXACTLY))).toBe(true)
    expect(reuseMeasurement(memoized(parent), spec(320, EXACTLY), spec(40, EXACTLY))).toBe(false)
    expect(reuseMeasurement(memoized(parent), spec(280, AT_MOST), spec(500, AT_MOST))).toBe(false)
    expect(parent._measuredWidth).toBe(300)
    // The child still holds the recorded result, so it is not measured again.
    expect(child.measured).toBe(1)
  })

  it('measures a child again from its recorded specs when another pass changed it', () => {
    const child = view(120, 40)
    const parent = view(300, 40)
    child.measure(spec(300, AT_MOST), spec(500, AT_MOST))
    recordMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST), [child as never])
    child.measure(spec(80, EXACTLY), spec(40, EXACTLY))
    expect(child._measuredWidth).toBe(80)
    expect(reuseMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST))).toBe(true)
    expect(child._measuredWidth).toBe(120)
    expect(child._currentWidthMeasureSpec).toBe(spec(300, AT_MOST))
  })

  it('does not treat an exact request as equivalent when a child resolves a percentage', () => {
    const child = view(150, 40, { width: { unit: '%', value: 0.5 } })
    const parent = view(300, 40)
    child.measure(spec(300, AT_MOST), spec(500, AT_MOST))
    recordMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST), [child as never])
    expect(reuseMeasurement(memoized(parent), spec(300, EXACTLY), spec(40, EXACTLY))).toBe(false)
    expect(reuseMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST))).toBe(true)
  })

  it('does not treat an exact request as equivalent when the looser request clamped the content', () => {
    const parent = view(300, 40)
    parent.measure(spec(300, AT_MOST), spec(500, AT_MOST))
    parent.setMeasuredDimension(300 | 0x01000000, 40)
    recordMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST))
    expect(reuseMeasurement(memoized(parent), spec(300, EXACTLY), spec(40, EXACTLY))).toBe(false)
    expect(reuseMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST))).toBe(true)
    const column = view(300, 500)
    column.measure(spec(300, AT_MOST), spec(500, AT_MOST))
    recordMeasurement(memoized(column), spec(300, AT_MOST), spec(500, AT_MOST), [], true)
    expect(reuseMeasurement(memoized(column), spec(300, EXACTLY), spec(500, EXACTLY))).toBe(false)
    expect(reuseMeasurement(memoized(column), spec(300, AT_MOST), spec(500, AT_MOST))).toBe(true)
  })

  it('leaves the decision to Core when no layout is requested and after a request clears the record', () => {
    const parent = view(300, 40)
    recordMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST))
    parent.isLayoutRequested = false
    expect(reuseMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST))).toBe(false)
    parent.isLayoutRequested = true
    memoized(parent).measureRecord = undefined
    expect(reuseMeasurement(memoized(parent), spec(300, AT_MOST), spec(500, AT_MOST))).toBe(false)
  })
})
