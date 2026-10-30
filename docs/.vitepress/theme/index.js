import OrbitSignature from './OrbitSignature.vue'
import './orbit-signature.css'
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import DevelopmentBadge from './DevelopmentBadge.vue'
import ComponentPreview from './ComponentPreview.vue'
import { createMavis } from '@getcortexlabs/mavis-web'
import '@getcortexlabs/mavis-web/style.css'
import ComponentGallery from './ComponentGallery.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(createMavis())
    app.component('ComponentPreview', ComponentPreview)
    app.component('ComponentGallery', ComponentGallery)
  },
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(OrbitSignature),
      'nav-bar-title-after': () => h(DevelopmentBadge),
    }),
}
