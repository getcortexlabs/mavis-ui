import './orbit-signature.css'
import { defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'
import DocsLayout from './DocsLayout.vue'
import ComponentPreview from './ComponentPreview.vue'
import { createMavis } from '@getcortexlabs/mavis-web'
import '@getcortexlabs/mavis-web/style.css'
import ComponentGallery from './ComponentGallery.vue'
import CapabilityTable from './CapabilityTable.vue'
import ContractReference from './ContractReference.vue'
import './custom.css'
import './experience/experience.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(createMavis())
    app.component('ComponentPreview', ComponentPreview)
    app.component('ComponentGallery', ComponentGallery)
    app.component('CapabilityTable', CapabilityTable)
    app.component('ContractReference', ContractReference)
    app.component(
      'HomeExperience',
      defineAsyncComponent(() => import('./experience/HomeExperience.vue')),
    )
    app.component(
      'ShowcaseCollection',
      defineAsyncComponent(() => import('./experience/ShowcaseCollection.vue')),
    )
  },
  Layout: DocsLayout,
}
