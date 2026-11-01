import type { MavisTheme, ThemeOptions } from './types.js'

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
    display: { fontSize: 56, fontWeight: '600', letterSpacing: -0.04 },
    title: { fontSize: 34, fontWeight: '600', letterSpacing: -0.035 },
    heading: { fontSize: 20, fontWeight: '600', letterSpacing: -0.02 },
    body: { fontSize: 16, fontWeight: 'normal', letterSpacing: 0 },
    caption: { fontSize: 13, fontWeight: 'normal', letterSpacing: 0 },
    overline: { fontSize: 11, fontWeight: '600', letterSpacing: 0.12 },
  },
  control: {
    sm: { height: 44, fontSize: 14, padding: 16 },
    md: { height: 52, fontSize: 16, padding: 20 },
    lg: { height: 60, fontSize: 17, padding: 24 },
  },
  motion: { pressScale: 0.97 },
}

/** Derive a complete theme without changing the original. */
export function defineTheme(options: ThemeOptions, base: MavisTheme = foundation): MavisTheme {
  const typography = { ...base.typography }
  for (const variant of Object.keys(typography) as (keyof typeof typography)[]) {
    typography[variant] = Object.freeze({
      ...typography[variant],
      ...options.typography?.[variant],
    })
  }
  const control = { ...base.control }
  for (const size of Object.keys(control) as (keyof typeof control)[]) {
    control[size] = Object.freeze({ ...control[size], ...options.control?.[size] })
  }
  const theme: MavisTheme = {
    name: options.name,
    appearance: options.appearance ?? base.appearance,
    colors: Object.freeze({ ...base.colors, ...options.colors }),
    space: Object.freeze({ ...base.space, ...options.space }),
    radius: Object.freeze({ ...base.radius, ...options.radius }),
    typography: Object.freeze(typography),
    control: Object.freeze(control),
    motion: Object.freeze({ ...base.motion, ...options.motion }),
  }
  for (const [key, value] of [...Object.entries(theme.space), ...Object.entries(theme.radius)]) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`Invalid theme token: ${key}`)
  }
  if (!(theme.motion.pressScale > 0 && theme.motion.pressScale <= 1)) {
    throw new RangeError('pressScale must be greater than 0 and at most 1')
  }
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
