import { icons } from './icons.js'

export type IconName = keyof typeof icons
export const iconFontFamily = 'lucide'
export const iconSizes = { sm: 16, md: 20, lg: 24 } as const
export type IconSize = keyof typeof iconSizes | number

/** The private-use character of an icon in the bundled Lucide font. */
export function iconGlyph(name: IconName): string {
  const code = icons[name]
  if (!code) throw new RangeError(`Unknown icon: ${String(name)}`)
  return String.fromCodePoint(code)
}

/** A control that shows only an icon still needs a name for assistive technology. */
export function checkIconOnly(text: string, hasIcon: boolean, label: string | undefined) {
  if (hasIcon && !text && !label) {
    throw new RangeError('An icon-only button needs accessibilityLabel')
  }
}

export function resolveIconSize(size: IconSize): number {
  if (typeof size === 'number') {
    if (!Number.isFinite(size) || size <= 0) throw new RangeError(`Invalid icon size: ${size}`)
    return size
  }
  const value = iconSizes[size]
  if (!value) throw new RangeError(`Invalid icon size: ${String(size)}`)
  return value
}
