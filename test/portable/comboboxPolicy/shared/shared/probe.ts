import { inject, readonly, ref, type InjectionKey } from 'vue'
export interface SearchProbe {
  run(): Promise<string>
}
export function createSearchProbe(host: SearchProbe) {
  const report = ref('Ready')
  async function run() {
    report.value = 'Checking'
    try {
      const result = await host.run()
      report.value = result
    } catch {
      report.value = 'Failed search checks'
    }
  }
  return { report: readonly(report), run }
}
export type SearchProbeStore = ReturnType<typeof createSearchProbe>
export const searchProbeKey: InjectionKey<SearchProbeStore> = Symbol('search-probe')
export function useSearchProbe() {
  const store = inject(searchProbeKey)
  if (!store) throw new Error('Install the search probe')
  return store
}
