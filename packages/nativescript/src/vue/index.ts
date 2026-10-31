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
import { MSlider } from './components/MSlider.js'
import { MInput } from './components/MInput.js'
import { MReveal } from './components/MReveal.js'

export { MScreen, MBox, MRow, MColumn, MCard, MText, MButton, MSlider, MInput, MReveal }
export { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
export type {
  MavisThemeContext,
  Appearance,
  AppearanceMode,
  AppearanceSource,
} from '@getcortexlabs/mavis-core/vue'
export type { Align, Justify } from './components/layout.js'
export type {} from '@getcortexlabs/mavis-core/vue'

export type MavisOptions = Omit<ThemeContextOptions, 'source'>

/** Create one plugin per application; `system` appearance follows the device. Vue also resolves MButton as <m-button>. */
export function createMavis(options: MavisOptions = {}) {
  return {
    install(app: App) {
      const context = createThemeContext({ ...options, source: systemAppearance() })
      app.provide(themeKey, context)
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
        MInput,
        MReveal,
      })) {
        app.component(name, component)
      }
    },
  }
}
