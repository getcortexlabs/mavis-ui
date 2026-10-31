import type { App } from 'nativescript-vue'
import {
  createThemeContext,
  themeKey,
  type ThemeContextOptions,
} from '@getcortexlabs/mavis-core/vue'
import { systemAppearance } from '../native/appearance'
import { MScreen } from './components/MScreen.js'
import { MBox, MRow, MColumn } from './components/layout.js'
import { MCard } from './components/MCard.js'
import { MText } from './components/MText.js'
import { MButton } from './components/MButton.js'
import { MCheckbox } from './components/MCheckbox.js'
import { MSwitch } from './components/MSwitch.js'
import { MSlider } from './components/MSlider.js'
import { MInput } from './components/MInput.js'
import { MIcon } from './components/MIcon.js'
import { MReveal } from './components/MReveal.js'
import { MSheet } from './components/MSheet.js'
import { systemBackKey, type ClaimSystemBack, type SystemBackClaimant } from './system-back.js'

export {
  MScreen,
  MBox,
  MRow,
  MColumn,
  MCard,
  MText,
  MButton,
  MSlider,
  MSwitch,
  MCheckbox,
  MInput,
  MIcon,
  MReveal,
  MSheet,
}
export { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
export type {
  MavisThemeContext,
  Appearance,
  AppearanceMode,
  AppearanceSource,
} from '@getcortexlabs/mavis-core/vue'
export type { Align, Justify } from './components/layout.js'
export type {} from '@getcortexlabs/mavis-core/vue'

export type { SystemBackClaimant, ClaimSystemBack }

export type MavisOptions = Omit<ThemeContextOptions, 'source'> & {
  /** Lets a router hand the Android back press to an open sheet first, e.g. vue-router-ns `claimSystemBack`. */
  claimSystemBack?: ClaimSystemBack
}

/** Create one plugin per application; `system` appearance follows the device. Vue also resolves MButton as <m-button>. */
export function createMavis(options: MavisOptions = {}) {
  return {
    install(app: App) {
      const { claimSystemBack, ...theme } = options
      const context = createThemeContext({ ...theme, source: systemAppearance() })
      app.provide(themeKey, context)
      app.provide(systemBackKey, claimSystemBack)
      app.onUnmount(() => context.dispose())
      for (const [name, component] of Object.entries({
        MScreen,
        MBox,
        MRow,
        MColumn,
        MCard,
        MText,
        MButton,
        MSlider,
        MSwitch,
        MCheckbox,
        MInput,
        MIcon,
        MReveal,
        MSheet,
      })) {
        app.component(name, component)
      }
    },
  }
}
