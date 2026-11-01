export type Space = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type Spacing = Space | number
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'full'
export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'overline'
export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type Size = 'sm' | 'md' | 'lg'

export interface Palette {
  background: string
  surface: string
  elevated: string
  text: string
  muted: string
  primary: string
  onPrimary: string
  primarySoft: string
  accent: string
  onAccent: string
  accentSoft: string
  border: string
  warning: string
  success: string
  danger: string
}

export type FontWeight =
  'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
/** A shared installed family, or explicit platform names/stacks. Empty native names use the system font. */
export type FontFamily = string | Readonly<{ web: string; ios: string; android: string }>
export type Elevation = 'none' | 'sm' | 'md' | 'lg'
export interface Shadow {
  x: number
  y: number
  blur: number
  spread: number
  color: string
}
export interface ComponentTheme {
  button: {
    fontFamily?: FontFamily
    fontWeight: FontWeight
    lineHeight: number
    paddingY: number
    radius: Radius | number
    elevation: Elevation
  }
  input: {
    fontFamily?: FontFamily
    fontSize?: number
    fontWeight: FontWeight
    lineHeight: number
    paddingX: number
    paddingY: number
    radius: Radius | number
  }
  card: { padding: Spacing; radius: Radius | number; elevation: Elevation }
}

export interface Typography {
  fontSize: number
  fontWeight: FontWeight
  fontFamily: FontFamily
  /** Unitless line rhythm, at least 1; native renderers add leading to font metrics. */
  lineHeight: number
  letterSpacing: number
}

export interface MavisTheme {
  readonly name: string
  readonly appearance: 'light' | 'dark'
  readonly colors: Readonly<Palette>
  readonly space: Readonly<Record<Space, number>>
  readonly radius: Readonly<Record<Radius, number>>
  readonly typography: Readonly<Record<TextVariant, Readonly<Typography>>>
  readonly control: Readonly<
    Record<Size, Readonly<{ height: number; fontSize: number; padding: number }>>
  >
  readonly elevation: Readonly<Record<Elevation, Readonly<Shadow>>>
  readonly components: { readonly [K in keyof ComponentTheme]: Readonly<ComponentTheme[K]> }
  readonly motion: Readonly<{ pressScale: number }>
}

export interface ThemeOptions {
  name: string
  appearance?: MavisTheme['appearance']
  colors?: Partial<Palette>
  space?: Partial<MavisTheme['space']>
  radius?: Partial<MavisTheme['radius']>
  typography?: Partial<Record<TextVariant, Partial<Typography>>>
  control?: Partial<Record<Size, Partial<MavisTheme['control'][Size]>>>
  elevation?: Partial<Record<Elevation, Partial<Shadow>>>
  components?: { [K in keyof ComponentTheme]?: Partial<ComponentTheme[K]> }
  motion?: Partial<MavisTheme['motion']>
}
