import type { ComponentTheme, FontFamily, FontWeight, Shadow, Typography } from './types.js'

export const fontWeights: readonly FontWeight[] = [
  'normal',
  'bold',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
]
export function validateWeight(value: FontWeight) {
  if (!fontWeights.includes(value)) throw new RangeError(`Invalid font weight: ${String(value)}`)
  return value
}
export function freezeFamily(value: FontFamily): FontFamily {
  if (typeof value === 'string') {
    if (!value.trim()) throw new RangeError('A font family must not be blank')
    return value
  }
  if (
    !value ||
    typeof value.web !== 'string' ||
    !value.web.trim() ||
    typeof value.ios !== 'string' ||
    typeof value.android !== 'string'
  ) {
    throw new TypeError('A font family needs web, ios and android names')
  }
  return Object.freeze({ ...value })
}
export function fontFamily(value: FontFamily, platform: 'web' | 'ios' | 'android') {
  if (value === 'system')
    return platform === 'web'
      ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      : ''
  return typeof value === 'string' ? value : value[platform]
}
function finite(value: number, name: string, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum) throw new RangeError(`Invalid ${name}: ${value}`)
}
export function validateTypography(value: Typography) {
  finite(value.fontSize, 'fontSize', Number.EPSILON)
  finite(value.lineHeight, 'lineHeight', 1)
  if (!Number.isFinite(value.letterSpacing)) throw new RangeError('Invalid letterSpacing')
  validateWeight(value.fontWeight)
  freezeFamily(value.fontFamily)
}
export function validateShadow(value: Shadow) {
  for (const key of ['x', 'y', 'spread'] as const) finite(value[key], `shadow ${key}`, -Infinity)
  finite(value.blur, 'shadow blur')
  if (typeof value.color !== 'string' || !value.color.trim())
    throw new RangeError('A shadow needs a color')
}
export function validateComponentTheme(value: ComponentTheme) {
  for (const component of [value.button, value.input]) {
    validateWeight(component.fontWeight)
    finite(component.lineHeight, 'lineHeight', 1)
    finite(component.paddingY, 'paddingY')
    if (component.fontFamily !== undefined) freezeFamily(component.fontFamily)
  }
  finite(value.input.paddingX, 'paddingX')
  if (value.input.fontSize !== undefined) finite(value.input.fontSize, 'fontSize', Number.EPSILON)
  for (const component of [value.button, value.input, value.card]) {
    if (typeof component.radius === 'number') finite(component.radius, 'radius')
    else if (!['none', 'sm', 'md', 'lg', 'full'].includes(component.radius))
      throw new RangeError('Invalid component radius')
  }
  for (const component of [value.button, value.card]) {
    if (!['none', 'sm', 'md', 'lg'].includes(component.elevation))
      throw new RangeError('Invalid elevation')
  }
  if (typeof value.card.padding === 'number') finite(value.card.padding, 'padding')
  else if (!['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(value.card.padding))
    throw new RangeError('Invalid card padding')
}
export function shadowStyle(value: Shadow, platform: 'web' | 'native' = 'web') {
  const unit = platform === 'web' ? 'px' : 'dip'
  return `${value.x}${unit} ${value.y}${unit} ${value.blur}${unit} ${value.spread}${unit} ${value.color}`
}
