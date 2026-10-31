import type { FlexboxLayout, View } from '@nativescript/core'
import { flexShrinkProperty } from '@nativescript/core/ui/layouts/flexbox-layout'

const source = flexShrinkProperty.sourceKey

/** Children without their own shrink keep their natural height in a column, like Mavis children. */
export function applyColumnShrink(layout: FlexboxLayout, child: View) {
  if (!layout.flexDirection.startsWith('column')) return
  // Core records the value source even when a local value equals the default, unlike isSet.
  const declared = (child.style as unknown as Record<symbol, number | undefined>)[source]
  if (!declared) child.style.flexShrink = 0
}
