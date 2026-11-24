import { onBeforeUnmount, onMounted, type Directive } from 'vue'

export type MavisKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

const keys = new Set<string>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

/** Keys pressed while a stack or one of its rows has focus. Text editing keeps its own keys. */
export function mavisKey(event: KeyboardEvent, handle: (key: MavisKey) => void) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey)
    return
  if (!keys.has(event.key)) return
  const target = event.target as Element | null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  event.preventDefault()
  handle(event.key as MavisKey)
}

type Shortcut = { key: string; mod?: boolean; disabled?: () => boolean; run: () => void }

/**
 * Keys for the buttons that declare a shortcut, anywhere on the page: Control or Command with
 * a key, or a function key on its own when the shortcut says mod: false.
 */
export function useMavisShortcuts(shortcuts: Shortcut[]) {
  const listen = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat || event.altKey || event.shiftKey) return
    const mod = event.metaKey || event.ctrlKey
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const match = shortcuts.find(
      (shortcut) => shortcut.key === key && (shortcut.mod ?? true) === mod,
    )
    if (!match) return
    event.preventDefault()
    if (!match.disabled?.()) match.run()
  }
  // Before the focused field sees the key, as a menu shortcut would be.
  onMounted(() => document.addEventListener('keydown', listen, true))
  onBeforeUnmount(() => document.removeEventListener('keydown', listen, true))
}

const editable = (element: Element): element is HTMLInputElement | HTMLTextAreaElement =>
  element instanceof HTMLTextAreaElement ||
  (element instanceof HTMLInputElement && element.selectionStart !== null)

type Mover = Element & { moveBefore?: (node: Node, child: Node | null) => void }

/**
 * On the element whose children are a keyed list. Vue reorders rows with insertBefore,
 * and browsers drop focus from a moved element: an edited row would lose its caret.
 * Moves that carry the focused element use moveBefore where the browser has it, or put
 * focus and the text selection back right away.
 */
export const vMavisKeepFocus: Directive<HTMLElement> = {
  mounted(element) {
    const insert = element.insertBefore
    element.insertBefore = function <T extends Node>(this: Mover, node: T, child: Node | null): T {
      const active = document.activeElement
      if (!node.isConnected || !(active instanceof HTMLElement) || !node.contains(active))
        return insert.call(this, node, child) as T
      if (typeof this.moveBefore === 'function') {
        try {
          this.moveBefore(node, child)
          return node
        } catch {}
      }
      const selection = editable(active)
        ? ([active.selectionStart, active.selectionEnd, active.selectionDirection] as const)
        : undefined
      insert.call(this, node, child)
      active.focus({ preventScroll: true })
      if (selection && editable(active) && selection[0] !== null && selection[1] !== null)
        active.setSelectionRange(selection[0], selection[1], selection[2] ?? undefined)
      return node
    }
  },
  beforeUnmount(element) {
    Reflect.deleteProperty(element, 'insertBefore')
  },
}
