import { defineTheme, mavis, midnight, type ThemeOptions } from '@getcortexlabs/mavis-core'

const sans = {
  web: "'Helvetica Neue', Arial, sans-serif",
  ios: 'Helvetica Neue',
  android: 'sans-serif',
}
const serif = {
  web: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  ios: 'Baskerville',
  android: 'serif',
}
const typography: ThemeOptions['typography'] = {
  display: {
    fontFamily: serif,
    fontSize: 64,
    fontWeight: 'normal',
    lineHeight: 1.02,
    letterSpacing: -0.045,
  },
  title: {
    fontFamily: serif,
    fontSize: 40,
    fontWeight: 'normal',
    lineHeight: 1.08,
    letterSpacing: -0.03,
  },
  heading: { fontFamily: sans, fontSize: 20, fontWeight: '500', lineHeight: 1.25 },
  body: { fontFamily: sans, fontSize: 16, lineHeight: 1.55 },
  caption: { fontFamily: sans, fontSize: 12, lineHeight: 1.5 },
  overline: { fontFamily: sans, fontSize: 10, fontWeight: '600', letterSpacing: 0.14 },
}
const components: ThemeOptions['components'] = {
  button: { radius: 'full', paddingY: 12, fontFamily: sans, fontWeight: '500' },
  card: { radius: 0, elevation: 'none', padding: 24 },
  input: { radius: 'sm', fontFamily: sans },
}
export const atlas = defineTheme(
  {
    name: 'atlas-paper',
    typography,
    components,
    colors: {
      background: '#F1EFE7',
      surface: '#FAF9F4',
      elevated: '#E7E4DA',
      text: '#252720',
      muted: '#64665A',
      primary: '#A73924',
      onPrimary: '#FFFFFF',
      primarySoft: '#EDE1D7',
      accent: '#A73924',
      onAccent: '#FFFFFF',
      accentSoft: '#EDE1D7',
      border: '#D1D0C5',
    },
    motion: { enterDuration: 240, releaseDuration: 480, releaseBounce: 0.12 },
  },
  mavis,
)
export const atlasNight = defineTheme(
  {
    name: 'atlas-ink',
    typography,
    components,
    colors: {
      background: '#20231F',
      surface: '#292D26',
      elevated: '#35392F',
      text: '#F1EFE7',
      muted: '#B4B9A8',
      primary: '#F5B395',
      onPrimary: '#252720',
      primarySoft: '#49392F',
      accent: '#F5B395',
      onAccent: '#252720',
      accentSoft: '#49392F',
      border: '#4C5144',
    },
    motion: atlas.motion,
  },
  midnight,
)
/** A fixed photo scope keeps captions readable independently of the surrounding paper. */
export const atlasPhoto = defineTheme(
  {
    name: 'atlas-photograph',
    typography,
    components,
    colors: {
      text: '#FFFFFF',
      muted: '#EFEFE8',
      primary: '#F1EFE7',
      onPrimary: '#252720',
      surface: '#1E292B',
      elevated: '#344044',
      background: '#1E292B',
      primarySoft: '#344044',
      accent: '#FFFFFF',
      border: '#86908B',
    },
    motion: atlas.motion,
  },
  midnight,
)
