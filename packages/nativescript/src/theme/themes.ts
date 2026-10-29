import type { MavisTheme, ThemeOptions } from './types.js'

const foundation: MavisTheme = {
  name: 'mavis',
  appearance: 'light',
  colors: {
    background: '#F8F5F2',
    surface: '#FFFFFF',
    elevated: '#F0EBE7',
    text: '#24212A',
    muted: '#6C6470',
    primary: '#A5375B',
    onPrimary: '#FFFFFF',
    border: '#E7DFE4',
    success: '#237354',
    danger: '#B33545',
  },
  space: { none: 0, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  radius: { none: 0, sm: 10, md: 18, lg: 28, full: 999 },
  typography: {
    display: { fontSize: 56, fontWeight: '500', letterSpacing: -0.04 },
    title: { fontSize: 32, fontWeight: '600', letterSpacing: -0.035 },
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
    background: '#0B1110',
    surface: '#151E1A',
    elevated: '#202C25',
    text: '#F3F5E9',
    muted: '#A2B0A5',
    primary: '#D2FA7A',
    onPrimary: '#17200D',
    border: '#2A382E',
    success: '#B6E87B',
    danger: '#FFA8A8',
  },
  radius: { sm: 12, md: 20, lg: 32 },
})
