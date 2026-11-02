import {
  getCurrentScope,
  inject,
  onScopeDispose,
  ref,
  shallowRef,
  watch,
  type App,
  type InjectionKey,
  type Ref,
} from '@vue/runtime-core'
import {
  createToastController,
  connectToast,
  disposeToast,
  type ToastController,
  type ToastConnection,
  type ToastSnapshot,
} from '../toast.js'

type AppToast = { controller: ToastController; requested: Ref<boolean>; closeLabel: string }
const appToastKey: InjectionKey<AppToast> = Symbol('mavis.appToast')

/** @internal Each plugin instance owns one queue, never a process-wide SSR singleton. */
export function installAppToast(app: App, options: { closeLabel?: string } = {}) {
  const controller = createToastController({ persistent: true })
  app.provide(appToastKey, {
    controller,
    requested: ref(false),
    closeLabel: options.closeLabel ?? 'Dismiss notification',
  })
  app.onUnmount(() => disposeToast(controller))
}

/** @internal Screens only mount their application host after an app queue is requested. */
export function useAppToastHost() {
  return inject(appToastKey, undefined)
}

/** Local by default. The app queue is owned by createMavis and hosted by each active Screen. */
export function useToast(options: { scope?: 'local' | 'app' } = {}): ToastController {
  if (!getCurrentScope()) throw new Error('useToast must run inside a Vue setup or effect scope')
  if (options.scope === 'app') {
    const app = inject(appToastKey, undefined)
    if (!app) throw new Error('App Toast needs createMavis on the current Vue app')
    app.requested.value = true
    return app.controller
  }
  const controller = createToastController()
  onScopeDispose(() => disposeToast(controller))
  return controller
}

/** @internal Shared renderer binding; platform lifecycles activate and pause its clock. */
export function useToastHost(controller: () => ToastController) {
  const snapshot = shallowRef<ToastSnapshot>({ visible: false })
  let connection: ToastConnection | undefined
  let active = false
  const pauses = new Set<string>()
  watch(
    controller,
    (next) => {
      connection?.dispose()
      connection = connectToast(next, (value) => {
        snapshot.value = value
      })
      for (const reason of pauses) connection.pause(reason, true)
      if (active) connection.activate()
    },
    { immediate: true, flush: 'sync' },
  )
  onScopeDispose(() => connection?.dispose())
  return {
    snapshot,
    activate() {
      active = true
      connection?.activate()
    },
    deactivate() {
      active = false
      pauses.clear()
      connection?.deactivate()
    },
    pause(reason: string, paused: boolean) {
      if (paused) pauses.add(reason)
      else pauses.delete(reason)
      connection?.pause(reason, paused)
    },
    begin(id: number) {
      connection?.begin(id)
    },
    entered(id: number) {
      connection?.entered(id)
    },
    left(id: number) {
      connection?.left(id)
    },
  }
}
