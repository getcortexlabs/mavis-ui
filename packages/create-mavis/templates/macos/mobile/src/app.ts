import { createApp } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import App from './App.vue'
createApp(App)
  .use(createMavis({ theme: mavis, darkTheme: midnight, appearance: '__MAVIS_APPEARANCE__' }))
  .start()
