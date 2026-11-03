import { iconOptionsKey, type MavisIconOptions } from './icons.js'
export type { MavisIconOptions } from './icons.js'
import type { App } from 'vue'
import {
  createThemeContext,
  installAppToast,
  themeKey,
  type ThemeContextOptions,
} from '@getcortexlabs/mavis-core/vue'
import { systemAppearance } from './appearance.js'

export type MavisServiceOptions = Omit<ThemeContextOptions, 'source'> &
  MavisIconOptions & {
    toast?: { closeLabel?: string }
  }

/** Application-owned services without global component registration. */
export function createMavisServices(options: MavisServiceOptions = {}) {
  return {
    install(app: App) {
      installAppToast(app, options.toast)
      const { toast: _toast, icons, iconFallback, ...theme } = options
      const context = createThemeContext({ ...theme, source: systemAppearance() })
      app.provide(themeKey, context)
      app.provide(iconOptionsKey, { icons, iconFallback })
      app.onUnmount(() => context.dispose())
    },
  }
}
