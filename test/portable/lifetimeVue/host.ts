import type { App } from 'vue'
import { createWork, workKey } from './work'

export function install(app: App) {
  const pending: ((value: string) => void)[] = []
  let cancelled = false
  app.provide(
    workKey,
    createWork({
      load() {
        cancelled = false
        return new Promise((resolve) => pending.push(resolve))
      },
      cancel() {
        cancelled = true
      },
      finish() {
        for (const resolve of pending.splice(0)) resolve(cancelled ? 'Late result' : 'Loaded')
      },
    }),
  )
}
