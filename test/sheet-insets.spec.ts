import { describe, expect, it } from 'vitest'
import type { View } from '@nativescript/core'
import {
  contentInsets,
  expandLayerHost,
  safeAreaOf,
} from '../packages/nativescript/src/native/sheet.ios.js'

describe('iOS sheet insets', () => {
  it('reads the Page controller’s view and extends the host over both safe areas', () => {
    // Page.ios is a UIViewController; safeAreaInsets belongs to its UIView.
    const host = {
      page: { ios: { view: { safeAreaInsets: { top: 62, right: 0, bottom: 34, left: 0 } } } },
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    } as unknown as View

    expandLayerHost(host)

    expect(host.marginTop).toBe(-62)
    expect(host.marginBottom).toBe(-34)
    expect(safeAreaOf(host)).toEqual({ top: 62, bottom: 0 })
    expect(contentInsets(host)).toEqual({ left: 0, right: 0, bottom: 34 })
  })

  it('uses current insets after attachment and rotation', () => {
    const native = { safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 } }
    const host = {
      page: { ios: { view: native } },
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    } as unknown as View
    const safeArea = safeAreaOf(host)

    native.safeAreaInsets = { top: 62, right: 0, bottom: 34, left: 0 }
    expandLayerHost(host)
    expect(safeArea.top).toBe(62)

    native.safeAreaInsets = { top: 0, right: 62, bottom: 21, left: 62 }
    expandLayerHost(host)
    expect(host.marginTop).toBeCloseTo(0)
    expect(host.marginBottom).toBe(-21)
    expect(host.marginLeft).toBe(-62)
    expect(host.marginRight).toBe(-62)
    expect(safeArea.top).toBe(0)
    expect(contentInsets(host)).toEqual({ left: 62, right: 62, bottom: 21 })
  })

  it('does not alter an unattached host', () => {
    const host = { marginTop: 0, marginBottom: 0 } as View
    expandLayerHost(host)
    expect(host.marginTop).toBe(0)
    expect(host.marginBottom).toBe(0)
    expect(safeAreaOf(host)).toEqual({ top: 0, bottom: 0 })
    expect(contentInsets(host)).toEqual({ left: 0, right: 0, bottom: 0 })
  })
})
