// Walking the view model: elements, texts, Show, For, shared components and slots.

/**
 * The nodes directly below a view node, whatever its kind. The content a parent passes to a
 * component's slots is the parent's own: it is written, focused and laid out there.
 */
export const children = (node) => [
  ...(node.children ?? []),
  ...(node.then ?? []),
  ...(node.else ?? []),
  ...(node.body ? [node.body] : []),
  ...(node.slots ?? []).flatMap((slot) => slot.body),
  ...(node.fallback ?? []),
]

/** The animated For whose rows are this element's own children, through Show. */
export const animatedFor = (node) =>
  children(node)
    .map((child) =>
      child.v === 'for' && child.animate ? child : child.v === 'show' ? animatedFor(child) : null,
    )
    .find(Boolean)

export const walk = (node, visit) => {
  visit(node)
  children(node).forEach((child) => walk(child, visit))
}

export const nodesWhere = (view, test) => {
  const found = []
  walk(view, (node) => test(node) && found.push(node))
  return found
}
