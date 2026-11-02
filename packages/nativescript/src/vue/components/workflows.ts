import { createWorkflows } from '@getcortexlabs/mavis-core/vue'
import { MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'

import { isAndroid, type View } from '@nativescript/core'

function focused(root: View): View | undefined {
  if (isAndroid ? root.android?.isFocused() : root.ios?.isFirstResponder) return root
  let match: View | undefined
  root.eachChildView((child) => {
    match = focused(child)
    return !match
  })
  return match
}
function preserveFocus(instance: unknown, currentId: string) {
  const root = (instance as { $el?: { nativeView?: View } } | undefined)?.$el?.nativeView
  const previous = root && focused(root)
  if (!root || !previous) return () => {}
  return () => {
    if (!root.isLoaded || (previous.isLoaded && previous.isEnabled)) return
    const page = root.page
    if (
      !page ||
      page.frame?.currentPage !== page ||
      (!isAndroid && page.ios?.presentedViewController)
    )
      return
    const active = focused(page)
    if (!active || active === previous) root.getViewById<View>(currentId)?.focus()
  }
}

export const { MFormGroup, MFormErrors, MSteps, MPagination } = createWorkflows(
  { Column: MColumn, Row: MRow, Text: MText, Button: MButton, preserveFocus },
  'native',
)
