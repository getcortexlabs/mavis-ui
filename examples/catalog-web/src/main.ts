import { createApp, nextTick } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createMavis, mavis, midnight } from '@getcortexlabs/mavis-web'
import { createCatalog, catalogKey } from '../../catalog/shared/context'
import { catalogRoutes } from '../../catalog/shared/routes'
import App from './App.vue'
import '@getcortexlabs/mavis-web/style.css'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...catalogRoutes,
    ...(import.meta.env.VITE_PERFORMANCE_CHECK === 'true'
      ? [
          {
            path: '/checks/performance',
            component: () => import('../../catalog/shared/checks/performance/Performance.vue'),
          },
        ]
      : []),
    {
      path: '/preview/:id',
      component: () => import('./Preview.vue'),
      props: (route) => ({
        id: route.params.id,
        appearance: route.query.theme,
        lang: route.query.lang === 'en' ? 'en' : 'pt',
      }),
    },
    { path: '/details', redirect: '/showcase/vehicle/details' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

const app = createApp(App)
app.use(createMavis({ theme: mavis, darkTheme: midnight }))
app.provide(
  catalogKey,
  createCatalog({
    push: (path) => router.push(path),
    back: (fallback = '/') =>
      window.history.state?.back ? router.back() : router.replace(fallback),
  }),
)
app.use(router)
router.afterEach(async () => {
  await nextTick()
  document.title = router.currentRoute.value.path.startsWith('/showcase')
    ? 'Showcase · Mavis UI'
    : 'Componentes · Mavis UI'
  document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true })
})
router.isReady().then(async () => {
  if (import.meta.env.VITE_PERFORMANCE_CHECK === 'true') {
    const { setupPerformance } = await import('./performance-check')
    setupPerformance(router)
  }
  app.mount('#app')
})
