import { createApp } from 'vue'
import { createMavis, mavis, midnight } from '@getcortexlabs/mavis-web'
import Welcome from '__MAVIS_SHARED__/Welcome.vue'
import { projectServiceKey } from '__MAVIS_SHARED__/services'
import '@getcortexlabs/mavis-web/style.css'
import './style.css'

createApp(Welcome)
  .use(createMavis({ theme: mavis, darkTheme: midnight, appearance: '__MAVIS_APPEARANCE__' }))
  .provide(projectServiceKey, {
    async save(_name) {
      /* Replace with your application service. */
    },
  })
  .mount('#app')
