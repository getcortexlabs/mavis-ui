import type { AppearanceSource } from '@getcortexlabs/mavis-core/vue'

function query() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
  return window.matchMedia('(prefers-color-scheme: dark)')
}

/** `prefers-color-scheme`, read only when called so server builds never touch `window`. */
export function systemAppearance(): AppearanceSource {
  return {
    current() {
      const media = query()
      return media ? (media.matches ? 'dark' : 'light') : undefined
    },
    observe(listener) {
      const media = query()
      if (!media) return () => {}
      const handler = (event: MediaQueryListEvent) => listener(event.matches ? 'dark' : 'light')
      media.addEventListener('change', handler)
      return () => media.removeEventListener('change', handler)
    },
  }
}
