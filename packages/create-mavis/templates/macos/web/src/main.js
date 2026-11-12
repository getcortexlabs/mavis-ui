import { createApp, h } from 'vue'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import {
  MAlert,
  MBadge,
  MAccordion,
  MBox,
  MButton,
  MCard,
  MCheckbox,
  MCollapsibleHeader,
  MColumn,
  MEmptyState,
  MGrid,
  MIcon,
  MInput,
  MListItem,
  MMasonry,
  MPlatform,
  MProgress,
  MRadioGroup,
  MRefreshControl,
  MResizablePanels,
  MReveal,
  MRow,
  MScreen,
  MSegmentedControl,
  MSelect,
  MSeparator,
  MSkeleton,
  MSlider,
  MSpan,
  MStack,
  MSwitch,
  MText,
  MThemeProvider,
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
  MSwitch,
  MSlider,
  MSegmentedControl,
  MRadioGroup,
  MListItem,
  MAccordion,
  MReveal,
}))
  app.component(name, component)
app
  .use(
    createMavisServices({ theme: mavis, darkTheme: midnight, appearance: '__MAVIS_APPEARANCE__' }),
  )
  .mount('#app')
