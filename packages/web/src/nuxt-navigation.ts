import { createMavisNavigation, type WebNavigationRouter } from './router-navigation.js'
import type { NavigationTransition } from '@getcortexlabs/mavis-core'

export interface NuxtNavigationHost {
  $router: WebNavigationRouter
  hook(name: 'page:finish', callback: () => void): () => void
}
/** Subscribe before confirmation so synchronous and async Nuxt pages cannot miss page:finish. */
export function createNuxtMavisNavigation(
  app: NuxtNavigationHost,
  options: { transition?: NavigationTransition; focus?: () => HTMLElement | null } = {},
) {
  return createMavisNavigation(app.$router, {
    ...options,
    ready(signal, to, from) {
      if (to.matched?.at(-1) === from.matched?.at(-1)) return
      return new Promise<void>((resolve) => {
        const finish = () => {
          stop()
          signal.removeEventListener('abort', finish)
          resolve()
        }
        const stop = app.hook('page:finish', finish)
        signal.addEventListener('abort', finish, { once: true })
        if (signal.aborted) finish()
      })
    },
  })
}
