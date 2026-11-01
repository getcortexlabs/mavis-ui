import { createRouter } from 'vue-router-ns'
import { catalogRoutes } from '../shared/routes'

declare const __PRESS_CHECK__: boolean
declare const __PERFORMANCE_CHECK__: boolean
declare const __LAYOUT_CHECK__: boolean
export const router = createRouter({
  routes: [
    ...catalogRoutes,
    ...(__PRESS_CHECK__
      ? [{ path: '/checks/press', component: () => import('./pages/NativePressCheck.vue') }]
      : []),
    ...(__PERFORMANCE_CHECK__
      ? [
          {
            path: '/checks/performance',
            component: () => import('../shared/checks/performance/Performance.vue'),
          },
        ]
      : []),
    ...(__LAYOUT_CHECK__
      ? [
          {
            path: '/checks/layout/native',
            component: () => import('./pages/NativeLayoutCheck.vue'),
          },
        ]
      : []),
  ],
})
