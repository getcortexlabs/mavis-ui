import type { Directive } from 'vue'
import { TextField, TextView, isIOS, type View } from '@nativescript/core'

type Editor = TextField | TextView
type Child = { nativeView?: View }
type Parent = Child & {
  insertBefore(child: Child, anchor: unknown): void
  appendChild(child: Child): void
}
type Selection = { ios?: unknown; start?: number; end?: number }

function focusedEditor(root: View | undefined): Editor | undefined {
  let found: Editor | undefined
  const visit = (view: View) => {
    if (found) return
    if ((view instanceof TextField || view instanceof TextView) && hasFocus(view)) found = view
    view.eachChildView((child) => {
      visit(child)
      return !found
    })
  }
  if (root) visit(root)
  return found
}

const hasFocus = (view: View) =>
  isIOS ? Boolean(view.ios?.isFirstResponder) : Boolean(view.android?.hasFocus())

function selection(editor: Editor): Selection {
  if (isIOS) return { ios: editor.ios?.selectedTextRange }
  const native = editor.android as { getSelectionStart(): number; getSelectionEnd(): number }
  return { start: native.getSelectionStart(), end: native.getSelectionEnd() }
}

function restore(editor: Editor, saved: Selection) {
  editor.focus()
  if (isIOS) {
    if (saved.ios) editor.ios.selectedTextRange = saved.ios
  } else if (saved.start !== undefined && saved.end !== undefined)
    (editor.android as { setSelection(start: number, end: number): void }).setSelection(
      saved.start,
      saved.end,
    )
}

/**
 * On the element whose children are a keyed list. NativeScript-Vue moves a row by removing
 * and adding its view, which ends editing: when the row holds the focused field, focus and
 * the text selection go back to it.
 */
export const vMavisKeepFocus: Directive<Parent> = {
  mounted(element) {
    const keep = (child: Child, move: () => void) => {
      const editor = focusedEditor(child.nativeView)
      const saved = editor && selection(editor)
      move()
      if (editor && saved && !hasFocus(editor)) restore(editor, saved)
    }
    const insertBefore = element.insertBefore.bind(element)
    const appendChild = element.appendChild.bind(element)
    element.insertBefore = (child, anchor) => keep(child, () => insertBefore(child, anchor))
    element.appendChild = (child) => keep(child, () => appendChild(child))
  },
  beforeUnmount(element) {
    Reflect.deleteProperty(element, 'insertBefore')
    Reflect.deleteProperty(element, 'appendChild')
  },
}
