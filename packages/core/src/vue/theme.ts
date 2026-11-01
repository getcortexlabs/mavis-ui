import { inject, readonly, shallowRef, type InjectionKey } from '@vue/runtime-core'
import { mavis } from '../theme/themes.js'
import type { MavisTheme } from '../theme/types.js'

export type Appearance = MavisTheme['appearance']
export type AppearanceMode = Appearance | 'system'

/** Platform access to the device appearance; `current` is undefined while it is unknown, such as during SSR. */
export interface AppearanceSource {
  current(): Appearance | undefined
  observe(listener: (appearance: Appearance) => void): () => void
}

export interface ThemeContextOptions {
  theme?: MavisTheme
  darkTheme?: MavisTheme
  appearance?: AppearanceMode
  source?: AppearanceSource
}

const modes: readonly AppearanceMode[] = ['system', 'light', 'dark']

function checkMode(mode: AppearanceMode) {
  if (!modes.includes(mode)) throw new RangeError(`Unknown appearance mode: ${String(mode)}`)
  return mode
}

export function createThemeContext(options: MavisTheme | ThemeContextOptions = {}) {
  const config: ThemeContextOptions = 'colors' in options ? { theme: options } : options
  const initial = config.theme ?? mavis
  const themes = shallowRef<Partial<Record<Appearance, MavisTheme>>>({
    [initial.appearance]: initial,
  })
  if (config.darkTheme) {
    if (config.darkTheme.appearance !== 'dark')
      throw new RangeError('darkTheme must have dark appearance')
    themes.value.dark = config.darkTheme
  }
  const appearance = shallowRef(checkMode(config.appearance ?? 'system'))
  const theme = shallowRef(initial)
  const systemAppearance = shallowRef(config.source?.current())
  const resolve = () => {
    const wanted =
      appearance.value === 'system'
        ? (systemAppearance.value ?? initial.appearance)
        : appearance.value
    theme.value =
      themes.value[wanted] ?? themes.value[wanted === 'dark' ? 'light' : 'dark'] ?? initial
  }
  resolve()
  const stop = config.source?.observe((next) => {
    systemAppearance.value = next
    if (appearance.value === 'system') resolve()
  })
  return {
    theme: readonly(theme),
    themes: readonly(themes),
    systemAppearance: readonly(systemAppearance),
    /** The selection: `system` follows the device; `light` and `dark` are explicit overrides. */
    appearance: readonly(appearance),
    setAppearance(mode: AppearanceMode) {
      appearance.value = checkMode(mode)
      resolve()
    },
    /** Registers the theme for its own appearance and pins that appearance. */
    setTheme(next: MavisTheme) {
      themes.value = { ...themes.value, [next.appearance]: next }
      appearance.value = next.appearance
      resolve()
    },
    dispose() {
      stop?.()
    },
  }
}
export type MavisThemeContext = ReturnType<typeof createThemeContext>

export const themeKey: InjectionKey<MavisThemeContext> = Symbol('mavis.theme')

/** Without the plugin, individually imported components use the default theme. */
export function useMavisTheme(): MavisThemeContext {
  return inject(themeKey, () => createThemeContext(mavis), true)
}
