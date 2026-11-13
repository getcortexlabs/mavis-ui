import { inject, readonly, ref, type InjectionKey } from 'vue'

export interface DeferredWork {
  load(): Promise<string>
  cancel(): void
  finish(): void
}

export function createWork(host: DeferredWork) {
  const status = ref('Idle')
  const cancelled = ref(0)
  const committed = ref(0)
  let generation = 0

  async function load() {
    const current = generation
    status.value = 'Loading'
    try {
      const value = await host.load()
      // A host can finish after cancellation. The shared guard protects all renderers.
      if (current !== generation) return
      status.value = value
      committed.value += 1
    } catch {
      if (current === generation) status.value = 'Failed'
    }
  }
  function cancel() {
    generation += 1
    cancelled.value += 1
    host.cancel()
    status.value = 'Cancelled'
  }
  function finish() {
    host.finish()
  }
  return {
    status: readonly(status),
    cancelled: readonly(cancelled),
    committed: readonly(committed),
    load,
    cancel,
    finish,
  }
}
export type Work = ReturnType<typeof createWork>
export const workKey: InjectionKey<Work> = Symbol('work')
export function useWork() {
  const work = inject(workKey)
  if (!work) throw new Error('Install work at the host.')
  return work
}
