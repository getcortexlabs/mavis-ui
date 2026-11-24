import { inject, readonly, ref, type InjectionKey } from 'vue'
export type SearchOption = { value: string; label: string; disabled?: boolean; helperText?: string }
export interface CityService {
  search(query: string, limit: number): Promise<SearchOption[]>
}
export function createCities(service: CityService) {
  const cancelled = ref(0)
  const calls = ref(0)
  function cancel() {
    cancelled.value += 1
  }
  async function search(query: string, limit: number) {
    calls.value += 1
    const found = await service.search(query, limit)
    return found
  }
  return { cancelled: readonly(cancelled), calls: readonly(calls), cancel, search }
}
export type Cities = ReturnType<typeof createCities>
export const citiesKey: InjectionKey<Cities> = Symbol('cities')
export function useCities() {
  const store = inject(citiesKey)
  if (!store) throw new Error('Install the city service')
  return store
}
