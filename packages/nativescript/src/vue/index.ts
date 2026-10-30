import type { App } from 'nativescript-vue'
import { mavis } from '@mavis-ui/core'
import type { MavisTheme } from '@mavis-ui/core'
import { createThemeContext, themeKey } from '@mavis-ui/core/vue'
import { MScreen } from './components/MScreen.js'
import { MBox, MRow, MColumn } from './components/layout.js'
import { MCard } from './components/MCard.js'
import { MText } from './components/MText.js'
import { MButton } from './components/MButton.js'
import { MSlider } from './components/MSlider.js'
import { MInput } from './components/MInput.js'
import { MReveal } from './components/MReveal.js'

export { MScreen, MBox, MRow, MColumn, MCard, MText, MButton, MSlider, MInput, MReveal }
export { useMavisTheme } from '@mavis-ui/core/vue'
export type { MavisThemeContext } from '@mavis-ui/core/vue'
export type { Align, Justify } from './components/layout.js'
export type {} from '@mavis-ui/core/vue'

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
        MInput,
        MReveal,
      })) {
        app.component(name, component)
      }
    },
  }
}
