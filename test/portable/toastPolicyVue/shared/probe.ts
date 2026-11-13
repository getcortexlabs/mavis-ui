import { inject, readonly, ref, type InjectionKey } from 'vue'
export interface ToastProbe {
  run(): Promise<string>
}
export function createToastProbe(host: ToastProbe) {
  const report = ref('Ready')
  async function run() {
    report.value = 'Checking'
    try {
      const result = await host.run()
      report.value = result
    } catch {
      report.value = 'Failed toast checks'
    }
  }
  return { report: readonly(report), run }
}
export type ToastProbeStore = ReturnType<typeof createToastProbe>
export const toastProbeKey: InjectionKey<ToastProbeStore> = Symbol('toast-probe')
export function useToastProbe() {
  const store = inject(toastProbeKey)
  if (!store) throw new Error('Install the toast probe')
  return store
}
