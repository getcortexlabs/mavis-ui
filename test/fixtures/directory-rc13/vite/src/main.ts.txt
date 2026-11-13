import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import { createRouterNavigation, mavis, midnight } from '@getcortexlabs/mavis-core'
import { createDirectory, directoryKey } from '__MAVIS_SHARED__/directory-store'
import { routes } from '__MAVIS_SHARED__/routes'
import App from './App.vue'
import '@getcortexlabs/mavis-web/style.css'
import './style.css'

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })
const directory = createDirectory({
  async read() {
    return localStorage.getItem('mavis:directory')
  },
  async write(value) {
    localStorage.setItem('mavis:directory', value)
  },
})
const app = createApp(App)
  .use(router)
  .use(
    createMavisServices({
      theme: mavis,
      darkTheme: midnight,
      appearance: '__MAVIS_APPEARANCE__',
      navigation: createRouterNavigation(router),
    }),
  )
  .provide(directoryKey, directory)
void router.isReady().then(() => {
  app.mount('#app')
  void directory.restore()
})
