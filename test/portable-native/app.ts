import { createApp } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import App from './App.vue'
import { navigation, router } from './navigation'

const app = createApp(App)
// Only a run with fixtures that navigate has a router (see navigation.ts, written for the run).
if (router) app.use(router)
app
  .use(createMavis({ theme: mavis, darkTheme: midnight, appearance: 'light', navigation }))
  .start()
