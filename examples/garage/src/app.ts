import { createApp } from 'nativescript-vue'
import { createMavis } from '@mavis-ui/nativescript/vue'
import { midnight } from '@mavis-ui/nativescript'
import { router } from './router'
import App from './App.vue'

createApp(App)
  .use(createMavis({ theme: midnight }))
  .use(router)
  .start()
