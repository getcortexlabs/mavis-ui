import {
  resolveSpace,
  resolveRadius,
  resolveDimension,
  nonNegative,
  type MavisTheme,
} from '@getcortexlabs/mavis-core'
import type { BoxProps } from '@getcortexlabs/mavis-core/vue'
import type { CSSProperties } from 'vue'

export function length(value: number | string | undefined) {
  return typeof value === 'number' ? `${value}px` : value
}

// A prop that was not given leaves its style untouched, so the host's CSS keeps applying.
export function boxStyle(theme: MavisTheme, props: BoxProps, defaultShrink = 0): CSSProperties {
  const style: CSSProperties = {
    boxSizing: 'border-box',
    flexGrow: nonNegative(props.grow, 'grow'),
    flexShrink: nonNegative(props.shrink ?? defaultShrink, 'shrink'),
    minWidth: 0,
  }
  const padding = props.padding === undefined ? undefined : resolveSpace(theme, props.padding)
  const x = props.paddingX === undefined ? padding : resolveSpace(theme, props.paddingX)
  const y = props.paddingY === undefined ? padding : resolveSpace(theme, props.paddingY)
  if (x !== undefined) {
    style.paddingLeft = `${x}px`
    style.paddingRight = `${x}px`
  }
  if (y !== undefined) {
    style.paddingTop = `${y}px`
    style.paddingBottom = `${y}px`
  }
  if (props.radius !== undefined) style.borderRadius = length(resolveRadius(theme, props.radius))
  const width = length(resolveDimension(props.width))
  if (width !== undefined) style.width = width
  const height = length(resolveDimension(props.height))
  if (height !== undefined) style.height = height
  if (props.backgroundColor !== undefined) style.backgroundColor = props.backgroundColor
  return style
}

/** Native accessibility labels have the same meaning on the DOM renderer. */
export function webAttrs(attrs: Record<string, unknown>) {
  const { accessibilityLabel, accessibilityValue, accessibilityHidden, ...rest } = attrs
  return {
    ...rest,
    ...(accessibilityLabel === undefined ? {} : { 'aria-label': accessibilityLabel }),
    ...(accessibilityValue === undefined ? {} : { 'aria-valuetext': accessibilityValue }),
    ...(accessibilityHidden === undefined
      ? {}
      : { 'aria-hidden': accessibilityHidden, inert: accessibilityHidden || undefined }),
  }
}
