import { Comment, Fragment, Text, type VNode } from 'nativescript-vue'

/** Native text controls accept text, not an arbitrary tree of child views. */
export function textContent(nodes: VNode[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === Comment) return ''
      if (node.type === Text) return String(node.children ?? '')
      if (node.type === Fragment) return textContent(node.children as VNode[])
      throw new TypeError(
        'MText and MButton accept text in their default slot. Use a layout to compose views.',
      )
    })
    .join('')
    .trim()
}
