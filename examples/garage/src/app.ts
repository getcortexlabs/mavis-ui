import { createApp } from 'nativescript-vue'
import { createMavis } from '@mavis-ui/nativescript/vue'
import { midnight } from '@mavis-ui/core'
import { router } from './router'
import App from './App.vue'
import { createGarage, garageKey } from '../shared/context'

createApp(App)
  .use(createMavis({ theme: midnight }))
  .provide(garageKey, createGarage(router))
  .use(router)
  .start()
