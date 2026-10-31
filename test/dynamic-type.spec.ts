import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyDynamicType,
  dynamicTypeScale,
  type DynamicTypeView,
} from '../packages/nativescript/src/native/dynamic-type.js'

vi.mock('@nativescript/core', () => {
  class Font {
    constructor(
      readonly fontSize: number,
      readonly fontScale = 1,
    ) {}
    static default = new Font(17)
    withFontSize(size: number) {
      return new Font(size, this.fontScale)
    }
    withFontScale(scale: number) {
      return new Font(this.fontSize, scale)
    }
  }
  return { Font }
})

// Point sizes from Apple's Dynamic Type table for the styles Mavis uses.
const sizes: Record<string, Record<string, number>> = {
  body: { XS: 14, L: 17, AX5: 53 },
  largeTitle: { XS: 31, L: 34, AX5: 60 },
}
const system = vi.hoisted(() => ({ category: 'L' }))
Object.assign(globalThis, {
  UIApplication: {
    sharedApplication: {
      get preferredContentSizeCategory() {
        return system.category
      },
    },
  },
  UITraitCollection: {
    traitCollectionWithPreferredContentSizeCategory: (category: string) => ({ category }),
  },
  UIFontMetrics: {
    metricsForTextStyle: (style: string) => ({
      scaledValueForValueCompatibleWithTraitCollection: (
        value: number,
        traits: { category: string },
      ) => (value * sizes[style]![traits.category]!) / sizes[style]!.L!,
    }),
  },
  UIButton: class {},
  UIFontTextStyleLargeTitle: 'largeTitle',
  UIFontTextStyleTitle1: 'title1',
  UIFontTextStyleTitle3: 'title3',
  UIFontTextStyleBody: 'body',
  UIFontTextStyleFootnote: 'footnote',
  UIFontTextStyleCaption2: 'caption2',
})

interface FakeFont {
  fontSize: number
  fontScale: number
}
function view(options: Partial<DynamicTypeView> = {}, fontSize = 16) {
  const layouts = vi.fn()
  const fake = {
    iosAccessibilityAdjustsFontSize: true,
    nativeTextViewProtected: { font: { pointSize: fontSize } },
    style: { fontInternal: undefined as FakeFont | undefined },
    requestLayout: layouts,
    ...options,
  }
  return {
    fake: fake as unknown as DynamicTypeView & { style: { fontInternal?: FakeFont } },
    layouts,
  }
}

afterEach(() => {
  system.category = 'L'
})

describe('iOS Dynamic Type scale', () => {
  it('follows the system curve of the text style instead of Core table', () => {
    system.category = 'XS'
    expect(dynamicTypeScale(view().fake, 17)).toBeCloseTo(14 / 17)
    expect(dynamicTypeScale(view({ dynamicTypeStyle: 'display' }).fake, 34)).toBeCloseTo(31 / 34)
    system.category = 'AX5'
    expect(dynamicTypeScale(view().fake, 17)).toBeCloseTo(53 / 17)
    expect(dynamicTypeScale(view({ dynamicTypeStyle: 'display' }).fake, 34)).toBeCloseTo(60 / 34)
    system.category = 'L'
    expect(dynamicTypeScale(view().fake, 17)).toBe(1)
  })

  it('keeps the size of views that do not adjust and honours explicit limits', () => {
    system.category = 'XS'
    expect(dynamicTypeScale(view({ iosAccessibilityAdjustsFontSize: false }).fake, 17)).toBe(1)
    expect(dynamicTypeScale(view({ iosAccessibilityMinFontScale: 0.9 }).fake, 17)).toBe(0.9)
    system.category = 'AX5'
    expect(dynamicTypeScale(view({ iosAccessibilityMaxFontScale: 2 }).fake, 17)).toBe(2)
  })

  it('asks the system for the size of the font, since the curve is not linear', () => {
    system.category = 'XS'
    const asked: number[] = []
    const metrics = (globalThis as unknown as { UIFontMetrics: { metricsForTextStyle: unknown } })
      .UIFontMetrics
    const original = metrics.metricsForTextStyle
    metrics.metricsForTextStyle = () => ({
      scaledValueForValueCompatibleWithTraitCollection: (value: number) => {
        asked.push(value)
        return value
      },
    })
    try {
      const { fake } = view({}, 16)
      applyDynamicType(fake)
      expect(asked).toEqual([16])
      expect(dynamicTypeScale(fake, 0)).toBe(1)
    } finally {
      metrics.metricsForTextStyle = original
    }
  })

  it('rewrites the font scale once and requests layout only when it changes', () => {
    system.category = 'XS'
    const { fake, layouts } = view()
    applyDynamicType(fake)
    expect(fake.style.fontInternal).toMatchObject({ fontSize: 16 })
    expect(fake.style.fontInternal!.fontScale).toBeCloseTo(14 / 17)
    expect(layouts).toHaveBeenCalledTimes(1)
    applyDynamicType(fake)
    expect(layouts).toHaveBeenCalledTimes(1)
    system.category = 'L'
    applyDynamicType(fake)
    expect(fake.style.fontInternal!.fontScale).toBe(1)
    expect(layouts).toHaveBeenCalledTimes(2)
  })
})
