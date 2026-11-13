import { inject, readonly, ref, type InjectionKey } from 'vue'
export interface ScrollProbe {
  run(): Promise<string>
}
export function createScrollProbe(host: ScrollProbe) {
  const report = ref('Ready')
  async function run() {
    report.value = 'Checking'
    try {
      const result = await host.run()
      report.value = result
    } catch {
      report.value = 'Failed navigation checks'
    }
  }
  return { report: readonly(report), run }
}
export type ScrollProbeStore = ReturnType<typeof createScrollProbe>
export const scrollProbeKey: InjectionKey<ScrollProbeStore> = Symbol('scroll-probe')
export function useScrollProbe() {
  const store = inject(scrollProbeKey)
  if (!store) throw new Error('Install the scroll probe')
  return store
}
