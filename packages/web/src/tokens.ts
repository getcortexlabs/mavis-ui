import { computed, type CSSProperties } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { fontFamily, shadowStyle, type MavisTheme } from '@getcortexlabs/mavis-core'

/** CSS values for one theme scope. No document mutation or application singleton. */
export function themeVariables(theme: MavisTheme): CSSProperties {
  const variables: Record<string, string | number> = {}
  for (const [name, value] of Object.entries(theme.colors)) variables[`--m-color-${name}`] = value
  for (const [name, value] of Object.entries(theme.space))
    variables[`--m-space-${name}`] = `${value}px`
  for (const [name, value] of Object.entries(theme.radius))
    variables[`--m-radius-${name}`] = `${value}px`
  for (const [name, value] of Object.entries(theme.elevation))
    variables[`--m-elevation-${name}`] = shadowStyle(value)
  for (const [name, type] of Object.entries(theme.typography)) {
    variables[`--m-type-${name}-font-family`] = fontFamily(type.fontFamily, 'web')
    variables[`--m-type-${name}-font-size`] = `${type.fontSize}px`
    variables[`--m-type-${name}-font-weight`] = type.fontWeight
    variables[`--m-type-${name}-line-height`] = type.lineHeight
    variables[`--m-type-${name}-letter-spacing`] = `${type.letterSpacing}em`
  }
  return variables as CSSProperties
}

/** Bind to a host's :style inside the desired MThemeProvider scope. Also works during SSR. */
export function useMavisTokens() {
  const { theme } = useMavisTheme()
  return computed(() => themeVariables(theme.value))
}
