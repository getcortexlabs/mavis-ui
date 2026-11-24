import { inject, readonly, ref, type InjectionKey } from 'vue'
export interface FileProbe {
  run(): Promise<string>
}
export function createFileProbe(host: FileProbe) {
  const report = ref('Ready')
  async function run() {
    report.value = 'Checking'
    try {
      const result = await host.run()
      report.value = result
    } catch {
      report.value = 'Failed file checks'
    }
  }
  return { report: readonly(report), run }
}
export type FileProbeStore = ReturnType<typeof createFileProbe>
export const fileProbeKey: InjectionKey<FileProbeStore> = Symbol('file-probe')
export function useFileProbe() {
  const store = inject(fileProbeKey)
  if (!store) throw new Error('Install the file probe')
  return store
}
