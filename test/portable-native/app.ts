import { createApp } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import { mavis } from '@getcortexlabs/mavis-core'
import App from './App.vue'
createApp(App)
  .use(createMavis({ theme: mavis, appearance: 'light' }))
  .start()
