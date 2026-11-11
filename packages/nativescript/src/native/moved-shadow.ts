import type { View } from '@nativescript/core'

// The shadow the component declared when application motion took it, and the last one rendered.
const moved = new WeakMap<View, unknown>()
const declared = new WeakMap<View, unknown>()

export function takeShadow(view: View, values: object) {
  if (!moved.has(view) && Object.keys(values).some((key) => key.startsWith('shadow')))
    moved.set(view, declared.get(view))
}
/** A rerender keeps the shadow the application animated until the component declares another. */
export function keepShadow(view: View | undefined, shadow: string | undefined): unknown {
  if (!view) return shadow
  let kept: unknown = shadow
  if (moved.has(view)) {
    const current = (view as View & { boxShadow?: unknown }).boxShadow
    if (moved.get(view) !== shadow) moved.delete(view)
    else if (current) kept = current
  }
  declared.set(view, shadow)
  return kept
}
