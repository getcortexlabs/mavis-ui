import { createApp, h } from 'vue'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import {
  MBox,
  MButton,
  MCard,
  MCheckbox,
  MCollapsibleHeader,
  MColumn,
  MGrid,
  MIcon,
  MInput,
  MMasonry,
  MPlatform,
  MRefreshControl,
  MResizablePanels,
  MReveal,
  MRow,
  MScreen,
  MSelect,
  MSeparator,
  MSheet,
  MSpan,
  MStack,
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
  MSheet,
  MReveal,
}))
  app.component(name, component)
app
  .use(
    createMavisServices({ theme: mavis, darkTheme: midnight, appearance: '__MAVIS_APPEARANCE__' }),
  )
  .mount('#app')
