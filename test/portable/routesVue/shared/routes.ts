import Home from './Home.vue'
import Missing from './Missing.vue'
import Notes from './Notes.vue'
import Place from './Place.vue'

export const routes = [
  { path: '/', component: Home },
  { path: '/places/:id', component: Place, props: true },
  { path: '/places/:id/notes', component: Notes, props: true },
  {
    path: '/search',
    component: () => import('./Search.vue'),
    props: (route: { query: object; params: object }) => ({ ...route.query, ...route.params }),
  },
  { path: '/:pathMatch(.*)*', component: Missing },
]
