import { validateChoices, type ChoiceOption, type ChoiceValue } from './choice.js'

export interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}
export interface HsvColor {
  h: number
  s: number
  v: number
  a: number
}
export function bounded(value: number, min: number, max: number) {
  if (![value, min, max].every(Number.isFinite) || max <= min)
    throw new RangeError('Values must be finite and max must exceed min.')
  return Math.min(max, Math.max(min, value))
}
/** Deliberately accepts only HEX and numeric RGB(A), never arbitrary CSS. */
export function parseColor(input: string): RgbaColor | null {
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(input.trim())
  if (hex) {
    let value = hex[1]!
    if (value.length <= 4) value = [...value].map((c) => c + c).join('')
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
      a: value.length === 8 ? parseInt(value.slice(6), 16) / 255 : 1,
    }
  }
  const rgb =
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i.exec(
      input.trim(),
    )
  if (!rgb) return null
  const [r, g, b, a] = [
    Number(rgb[1]),
    Number(rgb[2]),
    Number(rgb[3]),
    rgb[4] === undefined ? 1 : Number(rgb[4]),
  ]
  if ([r!, g!, b!].some((v) => v > 255) || a! > 1) return null
  return { r: Math.round(r!), g: Math.round(g!), b: Math.round(b!), a: a! }
}
export function colorHex(color: RgbaColor, alpha = false) {
  return (
    '#' +
    [color.r, color.g, color.b, ...(alpha ? [color.a * 255] : [])]
      .map((v) =>
        Math.round(bounded(v, 0, 255))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase()
  )
}
export function colorHsv(color: RgbaColor): HsvColor {
  const [r, g, b] = [color.r / 255, color.g / 255, color.b / 255]
  const max = Math.max(r!, g!, b!),
    min = Math.min(r!, g!, b!),
    delta = max - min
  const h = !delta
    ? 0
    : max === r
      ? ((g! - b!) / delta) % 6
      : max === g
        ? (b! - r!) / delta + 2
        : (r! - g!) / delta + 4
  return { h: (h * 60 + 360) % 360, s: max ? (delta / max) * 100 : 0, v: max * 100, a: color.a }
}
export function hsvColor(color: HsvColor): RgbaColor {
  const h = bounded(color.h, 0, 360) / 60,
    s = bounded(color.s, 0, 100) / 100,
    v = bounded(color.v, 0, 100) / 100
  const c = v * s,
    x = c * (1 - Math.abs((h % 2) - 1)),
    m = v - c
  const [r, g, b] =
    h < 1
      ? [c, x, 0]
      : h < 2
        ? [x, c, 0]
        : h < 3
          ? [0, c, x]
          : h < 4
            ? [0, x, c]
            : h < 5
              ? [x, 0, c]
              : [c, 0, x]
  return {
    r: Math.round((r! + m) * 255),
    g: Math.round((g! + m) * 255),
    b: Math.round((b! + m) * 255),
    a: bounded(color.a, 0, 1),
  }
}
export interface SwipeCard {
  id: ChoiceValue
  title: string
  description?: string
  image?: string
}
export type SwipeDecision = 'accept' | 'reject'
export function deckDecision(
  distance: number,
  velocity: number,
  threshold: number,
): SwipeDecision | null {
  if (![distance, velocity, threshold].every(Number.isFinite) || threshold <= 0)
    throw new RangeError('Invalid swipe geometry.')
  return Math.abs(distance) >= threshold || (Math.abs(distance) > 12 && Math.abs(velocity) > 600)
    ? distance + velocity * 0.08 >= 0
      ? 'accept'
      : 'reject'
    : null
}
export function validateCards(items: readonly SwipeCard[]) {
  validateChoices(
    items.map((item) => ({ value: item.id, label: item.title })),
    null,
  )
  return items
}
export interface TourStep {
  id: string
  title: string
  description: string
}
export function validateTour(steps: readonly TourStep[]) {
  validateChoices(
    steps.map((step) => ({ value: step.id, label: step.title })),
    null,
  )
  if (steps.some((step) => !step.id.trim()))
    throw new TypeError('Tour targets require nonempty ids.')
  return steps
}
export interface MarqueeItem {
  id: ChoiceValue
  label: string
  image?: string
}
export function transferValues(
  options: readonly ChoiceOption[],
  selected: readonly ChoiceValue[],
  checked: readonly ChoiceValue[],
  direction: 'add' | 'remove',
) {
  validateChoices(options, null)
  const enabled = new Set(
    options.filter((option) => !option.disabled).map((option) => option.value),
  )
  const changes = new Set(checked.filter((value) => enabled.has(value)))
  return direction === 'add'
    ? [...new Set([...selected, ...changes])]
    : selected.filter((value) => !changes.has(value))
}
export function gaugeGeometry(value: number, min: number, max: number, semi: boolean) {
  const clamped = bounded(value, min, max)
  return {
    value: clamped,
    ratio: (clamped - min) / (max - min),
    path: semi ? 'M 10 50 A 40 40 0 0 1 90 50' : 'M 50 10 A 40 40 0 1 1 49.999 10',
    viewBox: [0, 0, 100, semi ? 58 : 100] as const,
  }
}
