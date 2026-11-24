import { inject, readonly, ref, type InjectionKey } from 'vue'

// Application-owned contracts. Implementations belong to each app, never the shared screen.
export interface PlatformTools {
  formatNumber(value: number): Promise<string>
  formatTime(milliseconds: number, timeZone: string): Promise<string>
  copy(text: string): Promise<boolean>
  open(url: string): Promise<boolean>
}
export interface Scheduler {
  wait(milliseconds: number): Promise<boolean>
  cancel(): void
}
export function createUtilities(platform: PlatformTools, scheduler: Scheduler) {
  const summary = ref('Not formatted')
  const timer = ref('Idle')
  const completed = ref(0)
  const cancelled = ref(0)
  let generation = 0
  async function demonstrate() {
    try {
      const amount = await platform.formatNumber(1234.5)
      const before = await platform.formatTime(1710052200000, 'America/New_York')
      const after = await platform.formatTime(1710055800000, 'America/New_York')
      const copied = await platform.copy(amount)
      const opened = await platform.open('https://mavis-ui.getcortexlabs.com/')
      const refused = await platform.open('javascript:alert(1)')
      summary.value = `${amount}; ${before} → ${after}; copy ${copied}; open ${opened}; refused ${!refused}`
    } catch {
      summary.value = 'Host unavailable'
    }
  }
  async function run(milliseconds: number) {
    generation += 1
    const current = generation
    scheduler.cancel()
    timer.value = 'Waiting'
    try {
      const elapsed = await scheduler.wait(milliseconds)
      if (current !== generation) return
      if (elapsed) {
        completed.value += 1
        timer.value = 'Elapsed'
      } else {
        timer.value = 'Cancelled'
      }
    } catch {
      if (current === generation) timer.value = 'Timer failed'
    }
  }
  function cancel() {
    generation += 1
    cancelled.value += 1
    scheduler.cancel()
    timer.value = 'Cancelled'
  }
  return {
    summary: readonly(summary),
    timer: readonly(timer),
    completed: readonly(completed),
    cancelled: readonly(cancelled),
    demonstrate,
    run,
    cancel,
  }
}
export type Utilities = ReturnType<typeof createUtilities>
export const utilitiesKey: InjectionKey<Utilities> = Symbol('utilities')
export function useUtilities() {
  const value = inject(utilitiesKey)
  if (!value) throw new Error('Install platform tools and the scheduler in the host.')
  return value
}
