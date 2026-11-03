import {
  createMavis,
  createNuxtMavisNavigation,
  mavis,
  midnight,
  useMavisTheme,
} from '@getcortexlabs/mavis-web'

export default defineNuxtPlugin((app) => {
  const { vueApp } = app
  app.$router.beforeEach((to) => (to.path === '/portable/blocked' ? false : undefined))
  const navigation = createNuxtMavisNavigation(app, {
    transition: { name: 'slide', duration: 160 },
  })
  const saved = useCookie<string>('appearance')
  // Nuxt transfers the request/build snapshot, including for prerendered pages
  // whose build could not know the visitor's cookie or device preference.
  const initial = useState<'light' | 'dark'>('mavis:appearance', () =>
    saved.value === 'dark' ? 'dark' : 'light',
  )
  vueApp.use(
    createMavis({ theme: mavis, darkTheme: midnight, appearance: initial.value, navigation }),
  )
  const context = vueApp.runWithContext(useMavisTheme)
  onNuxtReady(() =>
    context.setAppearance(
      saved.value === 'dark' || saved.value === 'light' ? saved.value : 'system',
    ),
  )
})
