import { createRenderer } from 'vue'

export interface TestNode {
  tag: string
  props: Record<string, unknown>
  children: TestNode[]
  parent: TestNode | null
  text: string
}

export function node(tag: string, text = ''): TestNode {
  return { tag, text, props: {}, children: [], parent: null }
}

export const renderer = createRenderer<TestNode, TestNode>({
  createElement: (tag) => node(tag),
  createText: (text) => node('#text', text),
  createComment: (text) => node('#comment', text),
  setText: (el, text) => {
    el.text = text
  },
  setElementText: (el, text) => {
    el.text = text
  },
  parentNode: (el) => el.parent,
  nextSibling: (el) => el.parent?.children[el.parent.children.indexOf(el) + 1] ?? null,
  patchProp: (el, key, _previous, next) => {
    el.props[key] = next
  },
  insert(el, parent, anchor) {
    if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index < 0) parent.children.push(el)
    else parent.children.splice(index, 0, el)
    el.parent = parent
  },
  remove(el) {
    if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1)
    el.parent = null
  },
})

export function find(root: TestNode, tag: string): TestNode {
  if (root.tag === tag) return root
  for (const child of root.children) {
    try {
      return find(child, tag)
    } catch {
      /* Search the next branch. */
    }
  }
  throw new Error(`No ${tag} in rendered tree`)
}

export function fire(
  el: TestNode,
  event: string,
  data: unknown = new Event(event, { cancelable: true }),
) {
  const listeners = el.props[event]
  for (const listener of Array.isArray(listeners) ? listeners : [listeners]) {
    if (typeof listener === 'function') listener(data)
  }
}
