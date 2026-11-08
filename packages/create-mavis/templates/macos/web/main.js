import { createApp } from 'vue'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import { MColumn, MRow, MText, MButton, mavis, midnight } from '@getcortexlabs/mavis-web'
import Welcome from './Welcome.generated.vue'
import '@getcortexlabs/mavis-web/style.css'
import './style.css'

const app = createApp(Welcome)
for (const [name, component] of Object.entries({ MColumn, MRow, MText, MButton }))
  app.component(name, component)
app
  .use(
    createMavisServices({ theme: mavis, darkTheme: midnight, appearance: '__MAVIS_APPEARANCE__' }),
  )
  .mount('#app')
