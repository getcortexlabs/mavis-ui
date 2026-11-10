import { createApp } from 'vue'
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
  MSelect,
  MText,
  mavis,
  midnight,
} from '@getcortexlabs/mavis-web'
import Root from './generated/__MAVIS_ROOT__.vue'
import '@getcortexlabs/mavis-web/style.css'
import './style.css'

const app = createApp(Root)
for (const [name, component] of Object.entries({
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
