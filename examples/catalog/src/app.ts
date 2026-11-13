declare const __ADVANCED_CHECK__: boolean
if (__ADVANCED_CHECK__) require('./advanced-check')
declare const __CREATIVE_CHECK__: boolean
declare const __DASHBOARD_CHECK__: boolean
if (__CREATIVE_CHECK__) require('./creative-check')
if (__DASHBOARD_CHECK__) require('./dashboard-check')
declare const __SCREEN_COMPONENTS_CHECK__: boolean
if (__SCREEN_COMPONENTS_CHECK__) require('./screen-components-check')
declare const __INTERACTIVE_CHECK__: boolean
if (__INTERACTIVE_CHECK__) require('./interactive-check')
declare const __WAYFINDING_CHECK__: boolean
if (__WAYFINDING_CHECK__) require('./wayfinding-check')
declare const __DISCOVERY_CHECK__: boolean
if (__DISCOVERY_CHECK__) require('./discovery-check')
declare const __COLLECTION_CHECK__: boolean
if (__COLLECTION_CHECK__) require('./collection-check')
declare const __CONFIGURATOR_CHECK__: boolean
declare const __PLATFORM_CHECK__: boolean
if (__PLATFORM_CHECK__) require('./platform-check')
declare const __JOLT15_CHECK__: boolean
if (__JOLT15_CHECK__) require('./jolt15-check')
declare const __VISUAL_CHECK__: boolean
if (__VISUAL_CHECK__) require('./visual-check')
declare const __POINTER_CHECK__: boolean
if (__POINTER_CHECK__) require('./pointer-check')
declare const __DEPTH_CHECK__: boolean
if (__DEPTH_CHECK__) require('./depth-check')
if (__CONFIGURATOR_CHECK__) require('./configurator-check')
import { catalogLocaleKey, createCatalogLocale } from '../shared/locale'
import { createAppIcons } from '@getcortexlabs/mavis/app-icons'
import { appIconChoices, appIconsKey } from '../shared/app-icons'
import { createApp } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { router } from './router'
import App from './App.vue'
import { createCatalog, catalogKey } from '../shared/context'

declare const __COMPOSITION_CHECK__: boolean
if (__COMPOSITION_CHECK__) require('./composition-check')

declare const __TYPOGRAPHY_CHECK__: boolean
if (__TYPOGRAPHY_CHECK__) require('./typography-check')

declare const __LAYOUT_CHECK__: boolean
if (__LAYOUT_CHECK__) require('./layout-check')
declare const __SCREEN_PROBE__: boolean
if (__SCREEN_PROBE__) require('./screen-check')
declare const __PERFORMANCE_CHECK__: boolean
if (__PERFORMANCE_CHECK__) require('./performance-check')

const app = createApp(App)
if (__ADVANCED_CHECK__) app.config.errorHandler = require('./advanced-check').recordError
if (__CREATIVE_CHECK__) app.config.errorHandler = require('./creative-check').recordError
if (__DASHBOARD_CHECK__) app.config.errorHandler = require('./dashboard-check').recordError
if (__SCREEN_COMPONENTS_CHECK__)
  app.config.errorHandler = require('./screen-components-check').recordError
if (__INTERACTIVE_CHECK__) app.config.errorHandler = require('./interactive-check').recordError
if (__WAYFINDING_CHECK__) app.config.errorHandler = require('./wayfinding-check').recordError
if (__DISCOVERY_CHECK__) app.config.errorHandler = require('./discovery-check').recordError
if (__COLLECTION_CHECK__) app.config.errorHandler = require('./collection-check').recordError
if (__PLATFORM_CHECK__) app.config.errorHandler = require('./platform-check').recordError
if (__JOLT15_CHECK__) app.config.errorHandler = require('./jolt15-check').recordError
if (__CONFIGURATOR_CHECK__) app.config.errorHandler = require('./configurator-check').recordError
if (__VISUAL_CHECK__) app.config.errorHandler = require('./visual-check').recordError
if (__DEPTH_CHECK__) app.config.errorHandler = require('./depth-check').recordError
if (__POINTER_CHECK__) {
  app.config.errorHandler = require('./pointer-check').recordError
  app.provide('mavis.afterglowDebug', true)
}
app
  .provide(catalogLocaleKey, createCatalogLocale())
  .provide(appIconsKey, createAppIcons({ primary: 'mavis', icons: appIconChoices }))
  .use(
    createMavis({
      theme: mavis,
      darkTheme: midnight,
      claimSystemBack: (claimant) => router.claimSystemBack(claimant),
    }),
  )
  .provide(
    catalogKey,
    createCatalog({ push: (path) => router.push(path), back: () => router.back() }),
  )
  .use(router)
  .start()
