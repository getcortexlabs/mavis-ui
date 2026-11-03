import { h, inject, type Component, type InjectionKey, type VNode } from 'vue'
import { iconFontFamily, iconGlyph, type IconName } from '@getcortexlabs/mavis-core'

export interface MavisIconOptions {
  /** Import only the SVG components the application uses. Missing entries use iconFallback. */
  icons?: Partial<Record<IconName, Component>>
  iconFallback?: 'font' | 'none'
}
export const iconOptionsKey: InjectionKey<MavisIconOptions> = Symbol('mavis.icons')

/** One app-scoped resolver shared by standalone icons and control adornments. */
export function useIconContent() {
  const options = inject(iconOptionsKey, undefined)
  return (name: IconName, size: number): { content: string | VNode; fontFamily?: string } => {
    const component = options?.icons?.[name]
    if (component)
      return {
        content: h(component, {
          width: size,
          height: size,
          'aria-hidden': 'true',
          focusable: 'false',
        }),
      }
    if (options?.iconFallback === 'none') return { content: '' }
    return { content: iconGlyph(name), fontFamily: iconFontFamily }
  }
}
