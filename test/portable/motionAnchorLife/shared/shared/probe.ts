import { inject, readonly, ref, type InjectionKey } from 'vue'
export interface MotionAnchorProbe {
  run(): Promise<string>
}
export function createMotionAnchorProbe(host: MotionAnchorProbe) {
  const report = ref('Ready')
  async function run() {
    try {
      const result = await host.run()
      report.value = result
    } catch {
      report.value = 'Failed attachment checks'
    }
  }
  return { report: readonly(report), run }
}
export type MotionAnchorProbeStore = ReturnType<typeof createMotionAnchorProbe>
export const motionAnchorProbeKey: InjectionKey<MotionAnchorProbeStore> =
  Symbol('motion-anchor-probe')
export function useMotionAnchorProbe() {
  const store = inject(motionAnchorProbeKey)
  if (!store) throw new Error('Install the motion anchor probe')
  return store
}
