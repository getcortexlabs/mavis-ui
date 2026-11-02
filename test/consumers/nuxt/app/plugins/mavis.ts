import { createMavis, mavis, midnight, useMavisTheme } from '@getcortexlabs/mavis-web'

export default defineNuxtPlugin(({ vueApp }) => {
  const saved = useCookie<string>('appearance')
  // Nuxt transfers the request/build snapshot, including for prerendered pages
  // whose build could not know the visitor's cookie or device preference.
  const initial = useState<'light' | 'dark'>('mavis:appearance', () =>
    saved.value === 'dark' ? 'dark' : 'light',
  )
  vueApp.use(createMavis({ theme: mavis, darkTheme: midnight, appearance: initial.value }))
  const context = vueApp.runWithContext(useMavisTheme)
  onNuxtReady(() =>
    context.setAppearance(
      saved.value === 'dark' || saved.value === 'light' ? saved.value : 'system',
    ),
  )
})
