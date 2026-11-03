import type { App } from 'nativescript-vue'
import type { MavisNavigation } from '@getcortexlabs/mavis-core'
import {
  createThemeContext,
  installAppToast,
  themeKey,
  navigationKey,
  type ThemeContextOptions,
} from '@getcortexlabs/mavis-core/vue'
import { systemAppearance } from '../native/appearance'
import { systemBackKey, type ClaimSystemBack } from './system-back.js'

export type MavisServiceOptions = Omit<ThemeContextOptions, 'source'> & {
  toast?: { closeLabel?: string }
  claimSystemBack?: ClaimSystemBack
  navigation?: MavisNavigation
}

/** Application-owned services without global component registration. */
export function createMavisServices(options: MavisServiceOptions = {}) {
  return {
    install(app: App) {
      installAppToast(app, options.toast)
      const { toast: _toast, claimSystemBack, navigation, ...theme } = options
      const context = createThemeContext({ ...theme, source: systemAppearance() })
      app.provide(themeKey, context)
      app.provide(systemBackKey, claimSystemBack)
      app.provide(navigationKey, navigation)
      app.onUnmount(() => context.dispose())
    },
  }
}
