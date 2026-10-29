import type { MScreen } from './components/MScreen.js'
import type { MBox, MRow, MColumn } from './components/layout.js'
import type { MCard } from './components/MCard.js'
import type { MText } from './components/MText.js'
import type { MButton } from './components/MButton.js'
import type { MSlider } from './components/MSlider.js'
import type { MReveal } from './components/MReveal.js'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    MScreen: typeof MScreen
    MBox: typeof MBox
    MRow: typeof MRow
    MColumn: typeof MColumn
    MCard: typeof MCard
    MText: typeof MText
    MButton: typeof MButton
    MSlider: typeof MSlider
    MReveal: typeof MReveal
  }
}
