import type { App } from 'vue'
import {
  createToastController,
  connectToast,
  disposeToast,
  type ToastSnapshot,
} from '@getcortexlabs/mavis-core'
import { createToastProbe, toastProbeKey } from './probe'
export function install(app: App) {
  app.provide(
    toastProbeKey,
    createToastProbe({
      async run() {
        let checks = 0
        const check = (passed: boolean) => {
          if (!passed) throw new Error(`Toast check ${checks + 1}`)
          checks++
        }
        const local = createToastController()
        let snapshot: ToastSnapshot = { visible: false }
        const host = connectToast(local, (value) => {
          snapshot = value
        })
        const first = local.show({ message: 'First', duration: 0 })!
        check(typeof first === 'number' && !snapshot.visible)
        host.activate()
        host.begin(first)
        host.entered(first)
        check(snapshot.visible && snapshot.message?.message === 'First')
        const removed = local.show({ message: 'Remove', duration: 0 })!
        local.show({ message: 'Next', duration: 0 })
        local.dismiss(removed)
        local.dismiss(first)
        host.left(first)
        check(snapshot.message?.message === 'Next')
        host.deactivate()
        check(local.show({ message: 'Too late' }) === undefined && !snapshot.visible)
        disposeToast(local)
        host.activate()
        check(local.show({ message: 'Disposed' }) === undefined)
        host.dispose()

        const appQueue = createToastController({ persistent: true })
        const saved = appQueue.show({ message: 'Saved', duration: 0 })!
        let active: ToastSnapshot = { visible: false }
        const firstHost = connectToast(appQueue, () => {})
        const secondHost = connectToast(appQueue, (value) => {
          active = value
        })
        firstHost.activate()
        firstHost.begin(saved)
        firstHost.entered(saved)
        appQueue.show({ message: 'Queued', duration: 0 })
        firstHost.deactivate()
        const hidden = appQueue.show({ message: 'While hidden', duration: 0 })
        secondHost.activate()
        secondHost.begin(saved)
        secondHost.entered(saved)
        check(hidden !== undefined && active.visible && active.message?.message === 'Saved')
        firstHost.deactivate()
        check(active.visible && active.message?.message === 'Saved')
        appQueue.clear()
        secondHost.left(saved)
        check(active.message === undefined)
        disposeToast(appQueue)
        check(appQueue.show({ message: 'Disposed app' }) === undefined)
        firstHost.dispose()
        secondHost.dispose()

        const leaving = createToastController({ persistent: true })
        const a = leaving.show({ message: 'Leaving', duration: 0 })!
        leaving.show({ message: 'Kept', duration: 0 })
        let next: ToastSnapshot = { visible: false }
        const old = connectToast(leaving, () => {})
        const replacement = connectToast(leaving, (value) => {
          next = value
        })
        old.activate()
        old.begin(a)
        leaving.dismiss(a)
        old.deactivate()
        replacement.activate()
        old.left(a)
        check(next.message?.message === 'Kept' && next.visible)
        disposeToast(leaving)
        old.dispose()
        replacement.dispose()
        return `${checks} toast checks passed`
      },
    }),
  )
}
