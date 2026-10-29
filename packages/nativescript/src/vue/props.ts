import type { MavisTheme } from '@mavis-ui/core'
import { resolveSpace, resolveRadius, resolveDimension, nonNegative } from '@mavis-ui/core'
import type { BoxProps } from '@mavis-ui/core/vue'
export { boxProps, spacingProp } from '@mavis-ui/core/vue'

export function boxStyle(theme: MavisTheme, props: BoxProps, defaultShrink = 0) {
  const padding = resolveSpace(theme, props.padding ?? 'none')
  return {
    paddingLeft: props.paddingX === undefined ? padding : resolveSpace(theme, props.paddingX),
    paddingRight: props.paddingX === undefined ? padding : resolveSpace(theme, props.paddingX),
    paddingTop: props.paddingY === undefined ? padding : resolveSpace(theme, props.paddingY),
    paddingBottom: props.paddingY === undefined ? padding : resolveSpace(theme, props.paddingY),
    borderRadius: resolveRadius(theme, props.radius),
    flexGrow: nonNegative(props.grow, 'grow'),
    flexShrink: nonNegative(props.shrink ?? defaultShrink, 'shrink'),
    minWidth: 0,
    width: resolveDimension(props.width),
    height: resolveDimension(props.height),
    backgroundColor: props.backgroundColor,
  }
}
