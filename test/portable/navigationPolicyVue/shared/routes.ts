import Home from './Home.vue'
import Details from './Details.vue'

export const routes = [
  { path: '/', component: Home },
  { path: '/details/:id', component: Details, props: true },
]
