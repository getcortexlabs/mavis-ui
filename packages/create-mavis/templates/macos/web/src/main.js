import { createApp } from 'vue'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import {
  MButton,
  MCheckbox,
  MColumn,
  MInput,
  MReveal,
  MRow,
  MSelect,
  MText,
  mavis,
  midnight,
} from '@getcortexlabs/mavis-web'
import Welcome from './generated/Welcome.vue'
import '@getcortexlabs/mavis-web/style.css'
import './style.css'

const app = createApp(Welcome)
for (const [name, component] of Object.entries({
  MColumn,
  MRow,
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
