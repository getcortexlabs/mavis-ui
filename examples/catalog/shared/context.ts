import { inject, ref, type InjectionKey } from 'vue'

interface Navigation {
  push(path: string): unknown
  back(fallback?: string): unknown
}

export function createCatalog(navigation: Navigation) {
  return {
    navigation,
    memberName: ref('Alex'),
    locked: ref(true),
    climate: ref(true),
    temperature: ref(21),
    preferences: ref(false),
    chargeLimit: ref(80),
  }
}

export const catalogKey: InjectionKey<ReturnType<typeof createCatalog>> = Symbol('catalog')

export function useCatalog() {
  const catalog = inject(catalogKey)
  if (!catalog) throw new Error('Catalog must be provided when starting the app')
  return catalog
}
