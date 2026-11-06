import { createRenderer } from 'vue'
import { vi } from 'vitest'

// This renderer has no DOM or layout. Real presentation, cancellation and geometry
// are exercised with the unmocked adapters in the browser suite.
vi.mock('../packages/web/src/connected-motion.js', () => ({ useConnectedMotion() {} }))
vi.mock('../packages/web/src/component-motion.js', async (original) => {
  const { ref } = await import('vue')
  return {
    ...(await original<typeof import('../packages/web/src/component-motion.js')>()),
    useSelectionIndicator: () => ref(),
  }
})

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

/** Native event source for controls whose handlers follow loaded/unloaded lifetime. */
export function nativeEvents<T extends object>(state: T) {
  const listeners = new Map<string, Set<(event: unknown) => void>>()
  return Object.assign(state, {
    on(name: string, handler: (event: unknown) => void) {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name)!.add(handler)
    },
    off(name: string, handler: (event: unknown) => void) {
      listeners.get(name)?.delete(handler)
    },
    notify(name: string, event: unknown) {
      for (const fn of listeners.get(name) ?? []) fn(event)
    },
    observerCount(name: string) {
      return listeners.get(name)?.size ?? 0
    },
  })
}
