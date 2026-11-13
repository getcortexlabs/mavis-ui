import Home from './Home.lite'
import Details from './Details.lite'

export const routes = [
  { path: '/', component: Home },
  { path: '/details/:id', component: Details, props: true },
]
