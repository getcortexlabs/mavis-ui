import { createApp } from 'nativescript-vue'
import { ApplicationSettings } from '@nativescript/core'
import { createRouter } from 'vue-router-ns'
import { createMavisServices } from '@getcortexlabs/mavis/vue/services'
import { createRouterNavigation, mavis, midnight } from '@getcortexlabs/mavis-core'
import { createDirectory, directoryKey } from '__MAVIS_SHARED__/directory-store'
import { routes } from '__MAVIS_SHARED__/routes'
import App from './App.vue'

const router = createRouter({ routes })
const directory = createDirectory({
  async read() {
    return ApplicationSettings.getString('mavis:directory', '') || null
  },
  async write(value) {
    ApplicationSettings.setString('mavis:directory', value)
  },
})
createApp(App)
  .use(router)
  .use(
    createMavisServices({
      theme: mavis,
      darkTheme: midnight,
      appearance: '__MAVIS_APPEARANCE__',
      navigation: createRouterNavigation(router),
      claimSystemBack: (claimant) => router.claimSystemBack(claimant),
    }),
  )
  .provide(directoryKey, directory)
  .start()
void directory.restore()
