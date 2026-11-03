import { createRouter } from 'vue-router-ns'
import { catalogRoutes } from '../shared/routes'

declare const __GRID_CHECK__: boolean
declare const __PRESS_CHECK__: boolean
declare const __MOTION_CHECK__: string
declare const __PERFORMANCE_CHECK__: boolean
declare const __LAYOUT_CHECK__: boolean
export const router = createRouter({
  routes: [
    ...catalogRoutes,
    {
      path: '/checks/portable/:view?',
      component: () => import('./pages/NativePlatformMotionCheck.vue'),
    },
    ...(__GRID_CHECK__
      ? [{ path: '/checks/grid/native', component: () => import('./pages/NativeGridCheck.vue') }]
      : []),
    ...(__MOTION_CHECK__ === 'probe'
      ? [
          {
            path: '/checks/continuous/native',
            component: () => import('./pages/NativeContinuousCheck.vue'),
          },
        ]
      : []),
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
