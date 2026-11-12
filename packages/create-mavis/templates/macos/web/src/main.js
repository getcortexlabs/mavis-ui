import { createApp, h } from 'vue'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import {
  MButton,
  MCard,
  MCheckbox,
  MColumn,
  MGrid,
  MInput,
  MReveal,
  MRow,
  MScreen,
  MSelect,
  MText,
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
  MGrid,
  MCard,
  MText,
  MButton,
  MInput,
  MCheckbox,
  MSelect,
  MReveal,
}))
  app.component(name, component)
app
  .use(
    createMavisServices({ theme: mavis, darkTheme: midnight, appearance: '__MAVIS_APPEARANCE__' }),
  )
  .mount('#app')
