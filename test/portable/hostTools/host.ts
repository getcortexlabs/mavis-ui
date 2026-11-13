import type { App } from 'vue'
import { formatNumber } from '@getcortexlabs/mavis-core'
import { formatDateTime } from '#mavis'
import { createUtilities, utilitiesKey, type Scheduler, type PlatformTools } from './utilities'

// Real timer mechanics behind the app's declared contract. Cancellation settles the promise.
export function makeScheduler(): Scheduler {
  let pending:
    { handle: ReturnType<typeof setTimeout>; resolve: (elapsed: boolean) => void } | undefined
  const cancel = () => {
    if (!pending) return
    const current = pending
    pending = undefined
    clearTimeout(current.handle)
    current.resolve(false)
  }
  return {
    cancel,
    wait(milliseconds) {
      cancel()
      if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 2147483647)
        return Promise.reject(new RangeError('Timer delay must fit the host scheduler.'))
      return new Promise((resolve) => {
        pending = {
          handle: setTimeout(() => {
            pending = undefined
            resolve(true)
          }, milliseconds),
          resolve,
        }
      })
    },
  }
}
// Clipboard and navigation are recording adapters: conformance must not alter the real host.
// Production hosts implement these two methods with their platform clipboard and URL opener.
export function makePlatformTools(): PlatformTools {
  let clipboard = ''
  const opened: string[] = []
  return {
    async formatNumber(value) {
      return formatNumber(value, 'pt-BR')
    },
    async formatTime(milliseconds, timeZone) {
      return formatDateTime(milliseconds, { locale: 'en-GB', timeZone, timeStyle: 'short' })
    },
    async copy(text) {
      clipboard = text
      return clipboard === text
    },
    async open(url) {
      if (!url.startsWith('https://')) return false
      opened.push(url)
      return true
    },
  }
}
export function install(app: App) {
  app.provide(utilitiesKey, createUtilities(makePlatformTools(), makeScheduler()))
}
