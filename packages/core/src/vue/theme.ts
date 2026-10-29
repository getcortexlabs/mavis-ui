import { inject, readonly, shallowRef, type InjectionKey } from '@vue/runtime-core'
import { mavis } from '../theme/themes.js'
import type { MavisTheme } from '../theme/types.js'

export function createThemeContext(initial: MavisTheme) {
  const theme = shallowRef(initial)
  return {
    theme: readonly(theme),
    setTheme(next: MavisTheme) {
      theme.value = next
    },
  }
}

export type MavisThemeContext = ReturnType<typeof createThemeContext>
export const themeKey: InjectionKey<MavisThemeContext> = Symbol('mavis.theme')

/** Without the plugin, individually imported components use the default theme. */
export function useMavisTheme(): MavisThemeContext {
  return inject(themeKey, () => createThemeContext(mavis), true)
}
