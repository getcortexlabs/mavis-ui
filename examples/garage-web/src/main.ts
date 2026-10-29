import { createApp, nextTick } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createMavis, midnight } from '@mavis-ui/web'
import { createGarage, garageKey } from '../../garage/shared/context'
import App from './App.vue'
import '@mavis-ui/web/style.css'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('../../garage/shared/pages/Garage.vue') },
    { path: '/details', component: () => import('../../garage/shared/pages/Details.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

const app = createApp(App)
app.use(createMavis({ theme: midnight }))
app.provide(
  garageKey,
  createGarage({
    push: (path) => router.push(path),
    back: () => (window.history.state?.back ? router.back() : router.replace('/')),
  }),
)
app.use(router)
router.afterEach(async () => {
  await nextTick()
  document.title =
    router.currentRoute.value.path === '/details' ? 'Meu veículo · Mavis UI' : 'Garage · Mavis UI'
  document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true })
})
router.isReady().then(() => app.mount('#app'))
