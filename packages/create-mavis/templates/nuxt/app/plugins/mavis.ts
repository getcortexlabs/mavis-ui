import { createMavis, mavis, midnight, useMavisTheme } from '@getcortexlabs/mavis-web'
export default defineNuxtPlugin(({ vueApp }) => {
  const saved = useCookie<string>('appearance')
  const initial = useState<'light' | 'dark'>('mavis:appearance', () =>
    saved.value === 'dark' ? 'dark' : saved.value === 'light' ? 'light' : '__MAVIS_APPEARANCE__',
  )
  vueApp.use(createMavis({ theme: mavis, darkTheme: midnight, appearance: initial.value }))
  const context = vueApp.runWithContext(useMavisTheme)
  onNuxtReady(() =>
    context.setAppearance(
      saved.value === 'dark' || saved.value === 'light' ? saved.value : 'system',
    ),
  )
})
