import { createApp, h } from 'vue'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import {
  MAlert,
  MBadge,
  MBox,
  MButton,
  MCard,
  MCheckbox,
  MChip,
  MCollapsibleHeader,
  MColumn,
  MEmptyState,
  MGrid,
  MIcon,
  MInput,
  MMasonry,
  MPlatform,
  MProgress,
  MRefreshControl,
  MResizablePanels,
  MReveal,
  MRow,
  MScreen,
  MSelect,
  MSeparator,
  MSkeleton,
  MSpan,
  MStack,
  MText,
  MThemeProvider,
  MToast,
  MTooltip,
  MVirtualList,
  mavis,
  midnight,
} from '@getcortexlabs/mavis-web'
import Root, { screen } from './generated/entry'
import '@getcortexlabs/mavis-web/style.css'
import './style.css'

// A screen with an MScreen of its own fills the window; any other gets a page around it.
const app = createApp(screen ? Root : () => h('main', { class: 'mavis-page' }, h(Root)))
for (const [name, component] of Object.entries({
  MScreen,
  MColumn,
  MRow,
  MStack,
  MGrid,
  MBox,
  MCard,
  MText,
  MSpan,
  MSeparator,
  MThemeProvider,
  MPlatform,
  MButton,
  MInput,
  MCheckbox,
  MSelect,
  MMasonry,
  MResizablePanels,
  MVirtualList,
  MCollapsibleHeader,
  MRefreshControl,
  MIcon,
  MBadge,
  MProgress,
  MSkeleton,
  MAlert,
  MEmptyState,
  MChip,
  MTooltip,
  MToast,
  MReveal,
}))
  app.component(name, component)
app
  .use(
    createMavisServices({ theme: mavis, darkTheme: midnight, appearance: '__MAVIS_APPEARANCE__' }),
  )
  .mount('#app')
