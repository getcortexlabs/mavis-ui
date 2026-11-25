import { computed, inject, readonly, shallowRef, type InjectionKey } from '@vue/runtime-core'
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

export interface ThemePair {
  light: MavisTheme
  dark: MavisTheme
}

export function checkedThemePair({ light, dark }: ThemePair): ThemePair {
  if (light?.appearance !== 'light' || dark?.appearance !== 'dark')
    throw new RangeError(
      'A theme pair requires a light theme under light and a dark theme under dark.',
    )
  return { light, dark }
}

const modes: readonly AppearanceMode[] = ['system', 'light', 'dark']

function checkMode(mode: AppearanceMode) {
  if (!modes.includes(mode)) throw new RangeError(`Unknown appearance mode: ${String(mode)}`)
  return mode
}

export function createThemeContext(options: MavisTheme | ThemeContextOptions = {}) {
  const config: ThemeContextOptions = 'colors' in options ? { theme: options } : options
  const initial = config.theme ?? mavis
  const variants: Partial<ThemePair> = { [initial.appearance]: initial }
  if (config.darkTheme) {
    if (config.darkTheme.appearance !== 'dark')
      throw new RangeError('darkTheme must have dark appearance')
    variants.dark = config.darkTheme
  }
  const selection = shallowRef({ variants, mode: checkMode(config.appearance ?? 'system') })
  const themes = computed(() => selection.value.variants)
  const appearance = computed(() => selection.value.mode)
  const systemAppearance = shallowRef(config.source?.current())
  const theme = computed(() => {
    const wanted =
      appearance.value === 'system'
        ? (systemAppearance.value ?? initial.appearance)
        : appearance.value
    return themes.value[wanted] ?? themes.value[wanted === 'dark' ? 'light' : 'dark'] ?? initial
  })
  const stop = config.source?.observe((next) => {
    systemAppearance.value = next
  })
  return {
    theme: readonly(theme),
    themes: readonly(themes),
    systemAppearance: readonly(systemAppearance),
    /** The selection: `system` follows the device; `light` and `dark` are explicit overrides. */
    appearance: readonly(appearance),
    setAppearance(mode: AppearanceMode) {
      selection.value = { ...selection.value, mode: checkMode(mode) }
    },
    /** Registers the theme for its own appearance and pins that appearance. */
    setTheme(next: MavisTheme) {
      selection.value = {
        variants: { ...themes.value, [next.appearance]: next },
        mode: next.appearance,
      }
    },
    /** Replaces both palettes in one reactive write, preserving the appearance selection. */
    setThemePair(pair: ThemePair) {
      selection.value = { variants: checkedThemePair(pair), mode: appearance.value }
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
