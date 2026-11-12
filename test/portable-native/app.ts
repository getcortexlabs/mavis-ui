import { createApp } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import App from './App.vue'
import { hosts } from './fixtures'
const app = createApp(App).use(
  createMavis({ theme: mavis, darkTheme: midnight, appearance: 'light' }),
)
// What each fixture's app provides: its host services and stores.
for (const install of hosts) install(app)
app.start()
