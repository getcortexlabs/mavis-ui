import { createApp } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import App from './App.vue'
import { navigation, router } from './navigation'
import { hosts } from './fixtures'
const app = createApp(App).use(
  createMavis({ theme: mavis, darkTheme: midnight, appearance: 'light', navigation }),
)
if (router) app.use(router)
for (const install of hosts) install(app)
app.start()
