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

export interface Typography {
  fontSize: number
  fontWeight: 'normal' | '500' | '600' | 'bold'
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
  motion?: Partial<MavisTheme['motion']>
}
