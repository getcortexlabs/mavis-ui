import {
  resolveSpace,
  resolveRadius,
  resolveDimension,
  nonNegative,
  type MavisTheme,
} from '@mavis-ui/core'
import type { BoxProps } from '@mavis-ui/core/vue'
import type { CSSProperties } from 'vue'

export function length(value: number | string | undefined) {
  return typeof value === 'number' ? `${value}px` : value
}

export function boxStyle(theme: MavisTheme, props: BoxProps, defaultShrink = 0): CSSProperties {
  const padding = resolveSpace(theme, props.padding ?? 'none')
  const x = props.paddingX === undefined ? padding : resolveSpace(theme, props.paddingX)
  const y = props.paddingY === undefined ? padding : resolveSpace(theme, props.paddingY)
  return {
    boxSizing: 'border-box',
    padding: `${y}px ${x}px`,
    borderRadius: length(resolveRadius(theme, props.radius)),
    flexGrow: nonNegative(props.grow, 'grow'),
    flexShrink: nonNegative(props.shrink ?? defaultShrink, 'shrink'),
    minWidth: 0,
    width: length(resolveDimension(props.width)),
    height: length(resolveDimension(props.height)),
    backgroundColor: props.backgroundColor,
  }
}

/** Native accessibility labels have the same meaning on the DOM renderer. */
export function webAttrs(attrs: Record<string, unknown>) {
  const { accessibilityLabel, accessibilityValue, accessibilityHidden, ...rest } = attrs
  return {
    ...rest,
    ...(accessibilityLabel === undefined ? {} : { 'aria-label': accessibilityLabel }),
    ...(accessibilityValue === undefined ? {} : { 'aria-valuetext': accessibilityValue }),
    ...(accessibilityHidden === undefined ? {} : { 'aria-hidden': accessibilityHidden }),
  }
}
