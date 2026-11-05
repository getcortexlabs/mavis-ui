import OrbitSignature from './OrbitSignature.vue'
import './orbit-signature.css'
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import DevelopmentBadge from './DevelopmentBadge.vue'
import CatalogLegend from './CatalogLegend.vue'
import ComponentPreview from './ComponentPreview.vue'
import { createMavis } from '@getcortexlabs/mavis-web'
import '@getcortexlabs/mavis-web/style.css'
import ComponentGallery from './ComponentGallery.vue'
import CapabilityTable from './CapabilityTable.vue'
import ContractReference from './ContractReference.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(createMavis())
    app.component('ComponentPreview', ComponentPreview)
    app.component('ComponentGallery', ComponentGallery)
    app.component('CapabilityTable', CapabilityTable)
    app.component('ContractReference', ContractReference)
  },
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(OrbitSignature),
      'nav-bar-title-after': () => h(DevelopmentBadge),
      'sidebar-nav-after': () => h(CatalogLegend),
    }),
}
