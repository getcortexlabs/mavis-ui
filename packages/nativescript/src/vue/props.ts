import type { Dimension, MavisTheme } from '@getcortexlabs/mavis-core'
import {
  resolveSpace,
  resolveRadius,
  resolveDimension,
  nonNegative,
} from '@getcortexlabs/mavis-core'
import type { BoxProps } from '@getcortexlabs/mavis-core/vue'
export { boxProps, spacingProp } from '@getcortexlabs/mavis-core/vue'

export interface BoxStyle {
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  borderRadius?: number
  flexGrow: number
  flexShrink: number
  minWidth: number
  width?: Dimension
  height?: Dimension
  backgroundColor?: string
}

// A prop that was not given leaves its style untouched, so a plain attribute such as
// `paddingTop` or `borderRadius` on the element survives every render.
export function boxStyle(theme: MavisTheme, props: BoxProps, defaultShrink = 0): BoxStyle {
  const style: BoxStyle = {
    flexGrow: nonNegative(props.grow, 'grow'),
    flexShrink: nonNegative(props.shrink ?? defaultShrink, 'shrink'),
    minWidth: 0,
  }
  const padding = props.padding === undefined ? undefined : resolveSpace(theme, props.padding)
  const x = props.paddingX === undefined ? padding : resolveSpace(theme, props.paddingX)
  const y = props.paddingY === undefined ? padding : resolveSpace(theme, props.paddingY)
  if (x !== undefined) {
    style.paddingLeft = x
    style.paddingRight = x
  }
  if (y !== undefined) {
    style.paddingTop = y
    style.paddingBottom = y
  }
  if (props.radius !== undefined) style.borderRadius = resolveRadius(theme, props.radius)
  const width = resolveDimension(props.width)
  if (width !== undefined) style.width = width
  const height = resolveDimension(props.height)
  if (height !== undefined) style.height = height
  if (props.backgroundColor !== undefined) style.backgroundColor = props.backgroundColor
  return style
}
