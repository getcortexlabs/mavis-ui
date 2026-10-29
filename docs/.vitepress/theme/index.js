import OrbitSignature from './OrbitSignature.vue'
import './orbit-signature.css'
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import DevelopmentBadge from './DevelopmentBadge.vue'
import ComponentPreview from './ComponentPreview.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ComponentPreview', ComponentPreview)
  },
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(OrbitSignature),
      'nav-bar-title-after': () => h(DevelopmentBadge),
    }),
}
