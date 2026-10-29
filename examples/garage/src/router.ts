import { createRouter } from 'vue-router-ns'

export const router = createRouter({
  routes: [
    { path: '/', component: () => import('./pages/Garage.vue') },
    { path: '/details', component: () => import('./pages/Details.vue') },
  ],
})
