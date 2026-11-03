import { iconOptionsKey, type MavisIconOptions } from './icons.js'
export type { MavisIconOptions } from './icons.js'
import type { App } from 'vue'
import type { MavisNavigation } from '@getcortexlabs/mavis-core'
import {
  createThemeContext,
  installAppToast,
  themeKey,
  navigationKey,
  platformKey,
  createPlatformContext,
  type ThemeContextOptions,
} from '@getcortexlabs/mavis-core/vue'
import { systemAppearance } from './appearance.js'

export type MavisServiceOptions = Omit<ThemeContextOptions, 'source'> &
  MavisIconOptions & {
    toast?: { closeLabel?: string }
    navigation?: MavisNavigation
  }

/** Application-owned services without global component registration. */
export function createMavisServices(options: MavisServiceOptions = {}) {
  return {
    install(app: App) {
      app.provide(platformKey, createPlatformContext('web'))
      installAppToast(app, options.toast)
      const { toast: _toast, icons, iconFallback, navigation, ...theme } = options
      const context = createThemeContext({ ...theme, source: systemAppearance() })
      app.provide(themeKey, context)
      app.provide(iconOptionsKey, { icons, iconFallback })
      app.provide(navigationKey, navigation)
      app.onUnmount(() => {
        context.dispose()
        navigation?.dispose?.()
      })
    },
  }
}
