import { nextTick, ref, watch } from '@vue/runtime-core'
import type { DialogCloseReason } from '../dialog.js'

type State = Readonly<{ open: boolean; loading: boolean; dismissible: boolean }>
type Events = {
  (event: 'update:open', value: boolean): void
  (event: 'close', reason: DialogCloseReason): void
  (event: 'confirm'): void
}

/** @internal Controlled decisions share the same event semantics in both renderers. */
export function useDialogState(props: State, emit: Events) {
  const presented = ref(props.open)
  const visible = ref(props.open)
  let requested: DialogCloseReason | undefined
  let confirming = false
  let generation = 0
  watch(
    () => props.open,
    (open) => {
      generation++
      confirming = false
      visible.value = open
      if (open) presented.value = true
      else if (presented.value && !requested) emit('close', 'program')
      requested = undefined
    },
    { flush: 'sync' },
  )
  function request(reason: DialogCloseReason) {
    const navigation = reason === 'navigation'
    if (!props.open || requested || (!navigation && props.loading)) return
    if (!navigation && reason !== 'cancel' && !props.dismissible) return
    requested = reason
    const current = generation
    if (navigation) {
      visible.value = false
      presented.value = false
    }
    emit('update:open', false)
    emit('close', reason)
    // The parent can reject a request. Do not leave the still-open dialog inert afterward.
    void nextTick(() => {
      if (current === generation) requested = undefined
    })
  }
  return {
    presented,
    visible,
    request,
    confirm() {
      if (!props.open || props.loading || confirming || requested) return
      confirming = true
      emit('confirm')
      void nextTick(() => {
        confirming = false
      })
    },
    left() {
      if (!visible.value) presented.value = false
    },
  }
}
