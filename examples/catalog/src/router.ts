import { createRouter } from 'vue-router-ns'
import { catalogRoutes } from '../shared/routes'

declare const __PERFORMANCE_CHECK__: boolean
export const router = createRouter({
  routes: [
    ...catalogRoutes,
    ...(__PERFORMANCE_CHECK__
      ? [
          {
            path: '/checks/performance',
            component: () => import('../shared/checks/performance/Performance.vue'),
          },
        ]
      : []),
  ],
})
