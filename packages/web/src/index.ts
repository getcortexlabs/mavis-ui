import type { App } from 'vue'
import { mavis, type MavisTheme } from '@mavis-ui/core'
import { createThemeContext, themeKey } from '@mavis-ui/core/vue'
import { MScreen } from './components/MScreen.js'
import { MBox, MRow, MColumn } from './components/layout.js'
import { MCard } from './components/MCard.js'
import { MText } from './components/MText.js'
import { MButton } from './components/MButton.js'
import { MSlider } from './components/MSlider.js'
import { MReveal } from './components/MReveal.js'

export { MScreen, MBox, MRow, MColumn, MCard, MText, MButton, MSlider, MReveal }
export { useMavisTheme } from '@mavis-ui/core/vue'
export type { MavisThemeContext } from '@mavis-ui/core/vue'
export type { Align, Justify } from './components/layout.js'
export * from '@mavis-ui/core'

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
