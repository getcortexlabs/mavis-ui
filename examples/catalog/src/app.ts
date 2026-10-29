import { createApp } from 'nativescript-vue'
import { createMavis } from '@mavis-ui/nativescript/vue'
import { mavis } from '@mavis-ui/core'
import { router } from './router'
import App from './App.vue'
import { createCatalog, catalogKey } from '../shared/context'
import { checkInputKey } from '../shared/checks/input'
import CheckInput from './CheckInput'

declare const __LAYOUT_CHECK__: boolean
if (__LAYOUT_CHECK__) require('./layout-check')
declare const __SCREEN_CHECK__: boolean
if (__SCREEN_CHECK__) require('./screen-check')

createApp(App)
  .provide(checkInputKey, CheckInput)
  .use(createMavis({ theme: mavis }))
  .provide(
    catalogKey,
    createCatalog({ push: (path) => router.push(path), back: () => router.back() }),
  )
  .use(router)
  .start()
