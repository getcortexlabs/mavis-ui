import Home from './Home.lite'
import Missing from './Missing.lite'
import Notes from './Notes.lite'
import Place from './Place.lite'
import Search from './Search.lite'

export const routes = [
  { path: '/', component: Home },
  { path: '/places/:id', component: Place, props: true },
  { path: '/places/:id/notes', component: Notes, props: true },
  {
    path: '/search',
    component: Search,
    props: (route: { query: object; params: object }) => ({ ...route.query, ...route.params }),
  },
  { path: '/:pathMatch(.*)*', component: Missing },
]
