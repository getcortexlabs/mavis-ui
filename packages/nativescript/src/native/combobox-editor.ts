import type { TextField } from '@nativescript/core'

/** iOS marked text must finish before a remote query can observe it. */
export function comboboxComposing(view: TextField | undefined): boolean {
  return Boolean(view?.ios?.markedTextRange)
}
