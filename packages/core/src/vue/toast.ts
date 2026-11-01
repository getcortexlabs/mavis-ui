import { getCurrentScope, onScopeDispose, shallowRef, watch } from '@vue/runtime-core'
import {
  createToastController,
  connectToast,
  disposeToast,
  type ToastController,
  type ToastConnection,
  type ToastSnapshot,
} from '../toast.js'

/** One queue per calling scope. Declare one MToast host inside the owning screen. */
export function useToast(): ToastController {
  if (!getCurrentScope()) throw new Error('useToast must run inside a Vue setup or effect scope')
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
