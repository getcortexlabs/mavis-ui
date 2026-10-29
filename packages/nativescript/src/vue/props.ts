import type { MavisTheme } from '@mavis-ui/core'
import { resolveSpace } from '@mavis-ui/core'
import type { BoxProps } from '@mavis-ui/core/vue'
export { boxProps, spacingProp } from '@mavis-ui/core/vue'

export function boxStyle(theme: MavisTheme, props: BoxProps, defaultShrink = 0) {
  const padding = resolveSpace(theme, props.padding ?? 'none')
  return {
    paddingLeft: props.paddingX === undefined ? padding : resolveSpace(theme, props.paddingX),
    paddingRight: props.paddingX === undefined ? padding : resolveSpace(theme, props.paddingX),
    paddingTop: props.paddingY === undefined ? padding : resolveSpace(theme, props.paddingY),
    paddingBottom: props.paddingY === undefined ? padding : resolveSpace(theme, props.paddingY),
    borderRadius:
      typeof props.radius === 'number' ? props.radius : theme.radius[props.radius ?? 'none'],
    flexGrow: props.grow,
    flexShrink: props.shrink ?? defaultShrink,
    minWidth: 0,
    width: props.width,
    height: props.height,
    backgroundColor: props.backgroundColor,
  }
}
