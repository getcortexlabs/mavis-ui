import type { DefineComponent } from '@vue/runtime-core'
import type { ButtonVariant, Palette, Radius, Size, Spacing, TextVariant } from '../theme/types.js'

export interface BoxProps {
  padding?: Spacing
  paddingX?: Spacing
  paddingY?: Spacing
  radius?: Radius | number
  grow?: number
  shrink?: number
  width?: number | string
  height?: number | string
  backgroundColor?: string
}

export interface LayoutProps extends BoxProps {
  gap?: Spacing
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
}

/** The common template API; each renderer may also accept its own native attributes. */
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    MScreen: DefineComponent<{ scroll?: boolean }>
    MBox: DefineComponent<BoxProps>
    MRow: DefineComponent<LayoutProps>
    MColumn: DefineComponent<LayoutProps>
    MCard: DefineComponent<
      BoxProps & {
        gap?: Spacing
        interactive?: boolean
        disabled?: boolean
        accessibilityLabel?: string
        onClick?: () => void
      }
    >
    MText: DefineComponent<{
      text?: string
      variant?: TextVariant
      tone?: keyof Palette
      align?: 'left' | 'center' | 'right'
      wrap?: boolean
      grow?: number
      shrink?: number
      as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    }>
    MButton: DefineComponent<{
      text?: string
      variant?: ButtonVariant
      size?: Size
      disabled?: boolean
      loading?: boolean
      loadingText?: string
      grow?: number
      shrink?: number
      accessibilityLabel?: string
      onClick?: () => void
    }>
    MSlider: DefineComponent<{
      modelValue?: number
      min?: number
      max?: number
      step?: number
      disabled?: boolean
      label: string
      'onUpdate:modelValue'?: (value: number) => void
    }>
    MReveal: DefineComponent<{ show?: boolean }>
  }
}
