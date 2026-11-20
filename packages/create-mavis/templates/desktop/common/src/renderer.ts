import { createRenderer } from 'vue'

/** Vue owns the tree; a desktop host owns native views, geometry and event delivery. */
export interface NativeNode {
  kind: string
  text: string
  props: Record<string, any>
  children: NativeNode[]
  parent: NativeNode | null
  native?: any
  content?: any
  dispose?: () => void
}
export interface NativeHost {
  create(kind: string): NativeNode
  update(node: NativeNode): void
  attach(node: NativeNode, parent: NativeNode): void
  detach(node: NativeNode): void
  layout(): void
}

export function desktopRenderer(host: NativeHost) {
  const remove = (node: NativeNode) => {
    for (const child of [...node.children]) remove(child)
    node.dispose?.()
    host.detach(node)
    const siblings = node.parent?.children
    if (siblings) siblings.splice(siblings.indexOf(node), 1)
    node.parent = null
    host.layout()
  }
  return createRenderer<NativeNode, NativeNode>({
    createElement: (kind) => host.create(kind),
    createText(text) {
      const node = host.create('#text')
      node.text = text
      return node
    },
    createComment: () => host.create('#comment'),
    insert(node, parent, anchor) {
      // A keyed move retains native view/delegate, first responder and animation.
      if (node.parent) {
        const siblings = node.parent.children
        siblings.splice(siblings.indexOf(node), 1)
      }
      node.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
      host.attach(node, parent)
      host.update(parent)
      host.layout()
    },
    remove,
    setText(node, text) {
      node.text = text
      host.update(node.parent ?? node)
      host.layout()
    },
    setElementText(node, text) {
      for (const child of [...node.children]) remove(child)
      node.text = text
      host.update(node)
      host.layout()
    },
    parentNode: (node) => node.parent,
    nextSibling: (node) => {
      const siblings = node.parent?.children ?? []
      return siblings[siblings.indexOf(node) + 1] ?? null
    },
    patchProp(node, key, _old, value) {
      node.props[key] = value
      host.update(node)
      host.layout()
    },
  })
}
