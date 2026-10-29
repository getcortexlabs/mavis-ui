import type { PropType } from 'nativescript-vue'
import type { Spacing, Radius } from '../theme/types.js'
import type { MavisTheme } from '../theme/types.js'
import { resolveSpace } from '../theme/resolve.js'

export const spacingProp = { type: [String, Number] as PropType<Spacing>, default: undefined }

export const boxProps = {
  padding: spacingProp,
  paddingX: spacingProp,
  paddingY: spacingProp,
  radius: { type: [String, Number] as PropType<Radius | number>, default: undefined },
  grow: { type: Number, default: 0 },
  shrink: { type: Number, default: undefined },
}

export interface BoxProps {
  padding?: Spacing
  paddingX?: Spacing
  paddingY?: Spacing
  radius?: Radius | number
  grow: number
  shrink?: number
}

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
  }
}
