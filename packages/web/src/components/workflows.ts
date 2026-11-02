import { createWorkflows } from '@getcortexlabs/mavis-core/vue'
import { MColumn, MRow } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'

/** Restore only a focus lost because pagination removed/disabled its own action. */
function preserveFocus(root: unknown, currentId: string) {
  const element = (root as { $el?: HTMLElement } | undefined)?.$el
  const previous = element?.ownerDocument.activeElement as HTMLButtonElement | null
  if (!element || !previous || !element.contains(previous)) return () => {}
  return () => {
    const document = element.ownerDocument
    if (
      element.isConnected &&
      (document.activeElement === document.body || document.activeElement === previous) &&
      (!previous.isConnected || previous.disabled)
    ) {
      const target = document.getElementById(currentId)
      if (target && element.contains(target)) target.focus({ preventScroll: true })
    }
  }
}

export const { MFormGroup, MFormErrors, MSteps, MPagination } = createWorkflows(
  { Column: MColumn, Row: MRow, Text: MText, Button: MButton, preserveFocus },
  'web',
)
