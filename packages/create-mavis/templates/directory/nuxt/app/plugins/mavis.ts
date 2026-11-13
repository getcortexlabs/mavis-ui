import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import { createRouterNavigation, mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { createDirectory, directoryKey } from '__MAVIS_SHARED__/directory-store'
import { createDirectoryStorage } from '../utils/directory-storage'

export default defineNuxtPlugin(({ vueApp, $router }) => {
  const saved = useCookie<string>('appearance')
  const initial = useState<'light' | 'dark'>('mavis:appearance', () =>
    saved.value === 'dark' ? 'dark' : saved.value === 'light' ? 'light' : '__MAVIS_APPEARANCE__',
  )
  vueApp.use(
    createMavisServices({
      theme: mavis,
      darkTheme: midnight,
      appearance: initial.value,
      navigation: createRouterNavigation($router),
    }),
  )
  const theme = vueApp.runWithContext(useMavisTheme)
  // Each server request has its own store. Storage is accessed only after hydration.
  const directory = createDirectory(
    createDirectoryStorage({
      async read() {
        return localStorage.getItem('mavis:directory')
      },
      async write(value) {
        localStorage.setItem('mavis:directory', value)
      },
    }),
  )
  vueApp.provide(directoryKey, directory)
  onNuxtReady(() => {
    theme.setAppearance(saved.value === 'dark' || saved.value === 'light' ? saved.value : 'system')
    void directory.restore()
  })
})
