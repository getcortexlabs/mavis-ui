import Details from './Details.vue'
import Home from './Home.vue'

export const routes = [
  { path: '/', component: Home },
  { path: '/details/:id', component: Details, props: true },
]
