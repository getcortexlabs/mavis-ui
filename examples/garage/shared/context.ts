import { inject, ref, type InjectionKey } from 'vue'

interface Navigation {
  push(path: string): unknown
  back(): unknown
}

export function createGarage(navigation: Navigation) {
  return {
    navigation,
    locked: ref(true),
    climate: ref(true),
    temperature: ref(21),
    preferences: ref(false),
    chargeLimit: ref(80),
  }
}

export const garageKey: InjectionKey<ReturnType<typeof createGarage>> = Symbol('garage')

export function useGarage() {
  const garage = inject(garageKey)
  if (!garage) throw new Error('Garage must be provided when starting the app')
  return garage
}
