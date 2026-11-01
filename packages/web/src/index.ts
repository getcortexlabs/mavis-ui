import type { App } from 'vue'
import {
  createThemeContext,
  themeKey,
  type ThemeContextOptions,
} from '@getcortexlabs/mavis-core/vue'
import { systemAppearance } from './appearance.js'
import { MScreen } from './components/MScreen.js'
import { MBox, MRow, MColumn } from './components/layout.js'
import { MCard } from './components/MCard.js'
import { MText } from './components/MText.js'
import { MButton } from './components/MButton.js'
import { MToast } from './components/MToast.js'
import { MDialog } from './components/MDialog.js'
import { MAvatar } from './components/MAvatar.js'
import { MBadge } from './components/MBadge.js'
import { MSkeleton } from './components/MSkeleton.js'
import { MTabs } from './components/MTabs.js'
import { MSelect } from './components/MSelect.js'
import { MRadioGroup } from './components/MRadioGroup.js'
import { MCheckbox } from './components/MCheckbox.js'
import { MSwitch } from './components/MSwitch.js'
import { MSlider } from './components/MSlider.js'
import { MInput } from './components/MInput.js'
import { MIcon } from './components/MIcon.js'
import { MReveal } from './components/MReveal.js'
import { MSheet } from './components/MSheet.js'

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
  MRadioGroup,
  MSelect,
  MToast,
  MDialog,
  MTabs,
  MSkeleton,
  MAvatar,
  MBadge,
  MInput,
  MIcon,
  MReveal,
  MSheet,
}
export { useMavisTheme, useToast } from '@getcortexlabs/mavis-core/vue'
export type {
  MavisThemeContext,
  Appearance,
  AppearanceMode,
  AppearanceSource,
} from '@getcortexlabs/mavis-core/vue'
export type { Align, Justify } from './components/layout.js'
export * from '@getcortexlabs/mavis-core'

export type MavisOptions = Omit<ThemeContextOptions, 'source'>

/** Create one plugin per application; `system` appearance follows `prefers-color-scheme`. */
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
        MSwitch,
        MCheckbox,
        MRadioGroup,
        MSelect,
        MToast,
        MDialog,
        MTabs,
        MSkeleton,
        MAvatar,
        MBadge,
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
