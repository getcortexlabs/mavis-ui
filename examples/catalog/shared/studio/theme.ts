import {
  defineTheme,
  mavis,
  midnight,
  type FontFamily,
  type ThemeOptions,
} from '@getcortexlabs/mavis-core'

const editorial: FontFamily = {
  web: 'Georgia, "Times New Roman", serif',
  ios: 'Georgia',
  android: 'serif',
}
const body: FontFamily = {
  web: '"Avenir Next", "Segoe UI", sans-serif',
  ios: 'Avenir Next',
  android: 'sans-serif',
}
const typography: ThemeOptions['typography'] = {
  display: {
    fontFamily: editorial,
    fontSize: 48,
    fontWeight: 'normal',
    lineHeight: 1.12,
    letterSpacing: -0.025,
  },
  title: { fontFamily: editorial, fontSize: 32, fontWeight: 'normal', lineHeight: 1.2 },
  heading: { fontFamily: editorial, fontSize: 23, fontWeight: 'normal', lineHeight: 1.25 },
  body: { fontFamily: body, lineHeight: 1.55 },
  caption: { fontFamily: body, lineHeight: 1.45 },
  overline: { fontFamily: body, fontWeight: '600', letterSpacing: 0.14 },
}
const components: ThemeOptions['components'] = {
  button: { radius: 'full', paddingY: 14, fontWeight: '600', lineHeight: 1.35 },
  input: { radius: 'sm', fontSize: 17, lineHeight: 1.5, paddingX: 18, paddingY: 16 },
  card: { padding: 28, radius: 24, elevation: 'md' },
}
export const atelier = defineTheme(
  {
    name: 'atelier',
    colors: {
      background: '#F8F3EC',
      surface: '#FFFDF8',
      elevated: '#F0E7DF',
      text: '#332B37',
      muted: '#776673',
      primary: '#9E345E',
      primarySoft: '#F4DFE7',
      border: '#E7DCD5',
    },
    typography,
    components,
  },
  mavis,
)
export const atelierNight = defineTheme(
  {
    name: 'atelier-night',
    colors: {
      background: '#211B25',
      surface: '#2C2331',
      elevated: '#3B2C3C',
      text: '#FAF0E5',
      muted: '#C7B4BE',
      primary: '#EEAFC8',
      onPrimary: '#3B1729',
      primarySoft: '#4A2B40',
      border: '#57424F',
    },
    typography,
    components,
    elevation: { md: { color: 'rgba(0, 0, 0, 0.3)' } },
  },
  midnight,
)
