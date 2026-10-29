import type { App } from 'nativescript-vue'
import { mavis } from '../theme/themes.js'
import type { MavisTheme } from '../theme/types.js'
import { createThemeContext, themeKey } from './theme.js'
import { MScreen } from './components/MScreen.js'
import { MBox, MRow, MColumn } from './components/layout.js'
import { MCard } from './components/MCard.js'
import { MText } from './components/MText.js'
import { MButton } from './components/MButton.js'
import { MSlider } from './components/MSlider.js'
import { MReveal } from './components/MReveal.js'

export { MScreen, MBox, MRow, MColumn, MCard, MText, MButton, MSlider, MReveal }
export { useMavisTheme } from './theme.js'
export type { MavisThemeContext } from './theme.js'
export type { Align, Justify } from './components/layout.js'
export type {} from './global-components.js'

/** Create one plugin per application. Vue also resolves MButton as <m-button>. */
export function createMavis(options: { theme?: MavisTheme } = {}) {
  return {
    install(app: App) {
      app.provide(themeKey, createThemeContext(options.theme ?? mavis))
      for (const [name, component] of Object.entries({
        MScreen,
        MBox,
        MRow,
        MColumn,
        MCard,
        MText,
        MButton,
        MSlider,
        MReveal,
      })) {
        app.component(name, component)
      }
    },
  }
}
