import type { View } from '@nativescript/core'

const actions = new WeakMap<object, () => boolean>()

/** An input's own action is part of the active edit, not a tap outside it. */
export function keepEditingOn(action: View, editor: () => View | undefined): () => void {
  const native = action.ios as object | undefined
  if (!native) return () => {}
  actions.set(native, () => editor()?.ios?.isFirstResponder === true)
  return () => actions.delete(native)
}

export function isEditingAction(native: object) {
  return actions.get(native)?.() ?? false
}
