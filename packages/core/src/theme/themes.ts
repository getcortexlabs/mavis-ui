import type { MavisTheme, ThemeOptions } from './types.js'
import {
  validateTypography,
  validateComponentTheme,
  validateShadow,
  freezeFamily,
} from './typography.js'
import { resolvePressScale } from '../motion.js'

const foundation: MavisTheme = {
  name: 'mavis',
  appearance: 'light',
  colors: {
    background: '#FAF7FA',
    surface: '#FFFFFF',
    elevated: '#F0EBF3',
    text: '#251E32',
    muted: '#706479',
    primary: '#B83670',
    onPrimary: '#FFFFFF',
    primarySoft: '#FCE7F0',
    accent: '#4262C4',
    onAccent: '#FFFFFF',
    accentSoft: '#E8EEFF',
    border: '#EAE3ED',
    warning: '#9A5A10',
    success: '#237354',
    danger: '#B33545',
  },
  space: { none: 0, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  radius: { none: 0, sm: 10, md: 16, lg: 24, full: 999 },
  typography: {
    display: {
      fontSize: 56,
      fontWeight: '600',
      letterSpacing: -0.04,
      fontFamily: 'system',
      lineHeight: 1.3,
    },
    title: {
      fontSize: 34,
      fontWeight: '600',
      letterSpacing: -0.035,
      fontFamily: 'system',
      lineHeight: 1.3,
    },
    heading: {
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: -0.02,
      fontFamily: 'system',
      lineHeight: 1.3,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      letterSpacing: 0,
      fontFamily: 'system',
      lineHeight: 1.3,
    },
    caption: {
      fontSize: 13,
      fontWeight: 'normal',
      letterSpacing: 0,
      fontFamily: 'system',
      lineHeight: 1.3,
    },
    overline: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.12,
      fontFamily: 'system',
      lineHeight: 1.3,
    },
  },
  control: {
    sm: { height: 44, fontSize: 14, padding: 16 },
    md: { height: 52, fontSize: 16, padding: 20 },
    lg: { height: 60, fontSize: 17, padding: 24 },
  },
  elevation: {
    none: { x: 0, y: 0, blur: 0, spread: 0, color: 'transparent' },
    sm: { x: 0, y: 2, blur: 6, spread: 0, color: 'rgba(37, 30, 50, 0.10)' },
    md: { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(37, 30, 50, 0.14)' },
    lg: { x: 0, y: 16, blur: 40, spread: 0, color: 'rgba(37, 30, 50, 0.20)' },
  },
  components: {
    button: { fontWeight: '600', lineHeight: 1.3, paddingY: 12, radius: 'md', elevation: 'none' },
    input: { fontWeight: 'normal', lineHeight: 1.5, paddingX: 16, paddingY: 14, radius: 'md' },
    card: { padding: 'lg', radius: 'lg', elevation: 'none' },
  },
  motion: { pressScale: 0.97 },
}

/** Derive a complete theme without changing the original. */
export function defineTheme(options: ThemeOptions, base: MavisTheme = foundation): MavisTheme {
  const typography = { ...base.typography }
  for (const variant of Object.keys(typography) as (keyof typeof typography)[]) {
    const type = {
      ...typography[variant],
      ...options.typography?.[variant],
    }
    validateTypography(type)
    typography[variant] = Object.freeze({ ...type, fontFamily: freezeFamily(type.fontFamily) })
  }
  const control = { ...base.control }
  for (const size of Object.keys(control) as (keyof typeof control)[]) {
    control[size] = Object.freeze({ ...control[size], ...options.control?.[size] })
  }
  const elevation = { ...base.elevation }
  for (const level of Object.keys(elevation) as (keyof typeof elevation)[]) {
    const shadow = { ...elevation[level], ...options.elevation?.[level] }
    validateShadow(shadow)
    elevation[level] = Object.freeze(shadow)
  }
  const components = {
    button: { ...base.components.button, ...options.components?.button },
    input: { ...base.components.input, ...options.components?.input },
    card: { ...base.components.card, ...options.components?.card },
  }
  validateComponentTheme(components)
  for (const component of [components.button, components.input]) {
    if (component.fontFamily) component.fontFamily = freezeFamily(component.fontFamily)
  }
  const theme: MavisTheme = {
    name: options.name,
    appearance: options.appearance ?? base.appearance,
    colors: Object.freeze({ ...base.colors, ...options.colors }),
    space: Object.freeze({ ...base.space, ...options.space }),
    radius: Object.freeze({ ...base.radius, ...options.radius }),
    typography: Object.freeze(typography),
    control: Object.freeze(control),
    elevation: Object.freeze(elevation),
    components: Object.freeze({
      button: Object.freeze(components.button),
      input: Object.freeze(components.input),
      card: Object.freeze(components.card),
    }),
    motion: Object.freeze({ ...base.motion, ...options.motion }),
  }
  for (const [key, value] of [...Object.entries(theme.space), ...Object.entries(theme.radius)]) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`Invalid theme token: ${key}`)
  }
  resolvePressScale(theme.motion.pressScale)
  return Object.freeze(theme)
}

export const mavis = defineTheme({ name: 'mavis' })

export const midnight = defineTheme({
  name: 'midnight',
  appearance: 'dark',
  colors: {
    background: '#15121C',
    surface: '#211C2B',
    elevated: '#2E2539',
    text: '#FAF4FC',
    muted: '#B5A6BF',
    primary: '#F2A9C8',
    onPrimary: '#371326',
    primarySoft: '#3A2233',
    accent: '#ADC1FF',
    onAccent: '#172247',
    accentSoft: '#242E4A',
    border: '#3C3046',
    warning: '#F4C579',
    success: '#9FD5BE',
    danger: '#FFA8A8',
  },
})
