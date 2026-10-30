import { createApp } from 'nativescript-vue'
import { createMavis } from '@mavis-ui/nativescript/vue'
import { mavis } from '@mavis-ui/core'
import { router } from './router'
import App from './App.vue'
import { createCatalog, catalogKey } from '../shared/context'

declare const __LAYOUT_CHECK__: boolean
if (__LAYOUT_CHECK__) require('./layout-check')
declare const __SCREEN_CHECK__: boolean
if (__SCREEN_CHECK__) require('./screen-check')
declare const __PERFORMANCE_CHECK__: boolean
if (__PERFORMANCE_CHECK__) require('./performance-check')

createApp(App)
  .use(createMavis({ theme: mavis }))
  .provide(
    catalogKey,
    createCatalog({ push: (path) => router.push(path), back: () => router.back() }),
  )
  .use(router)
  .start()
