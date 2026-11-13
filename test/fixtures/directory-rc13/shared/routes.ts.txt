import Directory from './Directory.vue'
import Details from './Details.vue'
import Edit from './Edit.vue'

export const routes = [
  { path: '/', component: Directory },
  { path: '/entries/:id', component: Details, props: true },
  { path: '/entries/:id/edit', component: Edit, props: true },
]
