import { describe, expect, it } from 'vitest'
import { ownsCardTap } from '../packages/nativescript/src/vue/card-input.js'
import type { TapGestureEventData, View } from '@nativescript/core'

const view = (
  typeName: string,
  x: number,
  y: number,
  width: number,
  height: number,
  children: any[] = [],
) => ({
  typeName,
  visibility: 'visible',
  getLocationRelativeTo: () => ({ x, y }),
  getActualSize: () => ({ width, height }),
  eachChildView: (visit: (child: any) => boolean) => {
    for (const child of children) if (!visit(child)) break
  },
})

describe('card input ownership', () => {
  const button = view('MavisButton', 20, 20, 120, 44)
  const field = view('TextField', 20, 80, 200, 44)
  const card = view('MavisFlexLayout', 0, 0, 300, 300, [
    view('MavisFlexLayout', 0, 0, 300, 300, [button, field]),
  ])
  const tap = (x: number, y: number) =>
    ({
      object: card as unknown as View,
      getX: () => x,
      getY: () => y,
    }) as Partial<TapGestureEventData>
  it('keeps nested buttons and fields independent while allowing the blank card surface', () => {
    expect(ownsCardTap(tap(70, 40))).toBe(false)
    expect(ownsCardTap(tap(100, 100))).toBe(false)
    expect(ownsCardTap(tap(100, 200))).toBe(true)
  })
  it('does not swallow direct actions or synthetic taps without pointer coordinates', () => {
    expect(ownsCardTap()).toBe(true)
    expect(ownsCardTap({ object: card as unknown as View })).toBe(true)
    expect(ownsCardTap(tap(NaN, 50))).toBe(true)
  })
})
