import {
  fontFamily,
  nonNegative,
  resolveDimension,
  resolveRadius,
  resolveSpace,
  shadowStyle,
  validateWeight,
  type MavisTheme,
} from '@getcortexlabs/mavis-core'
import { isAndroid } from '@nativescript/core'
import type { MBoxProps, MTextProps, MButtonProps } from './contracts.js'

export function nativeBoxStyle(theme: MavisTheme, props: MBoxProps, shrink = 0) {
  const padding = props.padding === undefined ? undefined : resolveSpace(theme, props.padding)
  const x = props.paddingX === undefined ? padding : resolveSpace(theme, props.paddingX)
  const y = props.paddingY === undefined ? padding : resolveSpace(theme, props.paddingY)
  return {
    paddingLeft: x ?? 0,
    paddingRight: x ?? 0,
    paddingTop: y ?? 0,
    paddingBottom: y ?? 0,
    borderRadius: props.radius === undefined ? 0 : resolveRadius(theme, props.radius),
    width: resolveDimension(props.width) ?? 'auto',
    height: resolveDimension(props.height) ?? 'auto',
    backgroundColor: props.backgroundColor ?? 'transparent',
    flexGrow: nonNegative(props.grow ?? 0, 'grow'),
    flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
    minWidth: 0,
  }
}

export function nativeTextStyle(theme: MavisTheme, props: MTextProps, shrink = 0) {
  const type = theme.typography[props.variant ?? 'body']
  return {
    ...type,
    fontFamily: fontFamily(type.fontFamily, isAndroid ? 'android' : 'ios'),
    fontWeight: props.weight === undefined ? type.fontWeight : validateWeight(props.weight),
    lineHeight: type.fontSize * (type.lineHeight - 1),
    color: theme.colors[props.tone ?? 'text'],
    textAlignment: props.align ?? 'left',
    flexGrow: nonNegative(props.grow ?? 0, 'grow'),
    flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
    minWidth: 0,
  }
}

export function nativeButtonStyle(theme: MavisTheme, props: MButtonProps, shrink = 0) {
  const tokens = theme.components.button
  const size = theme.control[props.size ?? 'md']
  const primary = (props.variant ?? 'primary') === 'primary'
  return {
    minHeight: Math.max(size.height, isAndroid ? 48 : 44),
    minWidth: isAndroid ? 48 : 44,
    paddingLeft: size.padding,
    paddingRight: size.padding,
    paddingTop: tokens.paddingY,
    paddingBottom: tokens.paddingY,
    fontSize: size.fontSize,
    fontWeight: tokens.fontWeight,
    fontFamily: fontFamily(
      tokens.fontFamily ?? theme.typography.body.fontFamily,
      isAndroid ? 'android' : 'ios',
    ),
    lineHeight: size.fontSize * (tokens.lineHeight - 1),
    textTransform: 'none',
    backgroundColor: primary
      ? theme.colors.primary
      : props.variant === 'secondary'
        ? theme.colors.elevated
        : 'transparent',
    color: primary ? theme.colors.onPrimary : theme.colors.text,
    borderRadius: resolveRadius(theme, tokens.radius),
    borderWidth: 0,
    androidElevation: 0,
    androidDynamicElevationOffset: 0,
    margin: 0,
    boxShadow:
      props.variant === 'ghost' ? 'none' : shadowStyle(theme.elevation[tokens.elevation], 'native'),
    opacity: props.disabled ? 0.45 : 1,
    flexGrow: nonNegative(props.grow ?? 0, 'grow'),
    flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
  }
}
