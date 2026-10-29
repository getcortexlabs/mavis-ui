import { createApp } from 'nativescript-vue'
import { createMavis } from '@mavis-ui/nativescript/vue'
import { mavis } from '@mavis-ui/core'
import { router } from './router'
import App from './App.vue'
import { createCatalog, catalogKey } from '../shared/context'

createApp(App)
  .use(createMavis({ theme: mavis }))
  .provide(
    catalogKey,
    createCatalog({ push: (path) => router.push(path), back: () => router.back() }),
  )
  .use(router)
  .start()
