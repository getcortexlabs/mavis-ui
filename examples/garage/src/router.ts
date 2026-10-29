import { createRouter } from 'vue-router-ns'

export const router = createRouter({
  routes: [
    { path: '/', component: () => import('../shared/pages/Garage.vue') },
    { path: '/details', component: () => import('../shared/pages/Details.vue') },
  ],
})
