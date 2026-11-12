// Walking the view model: elements, texts, Show, For and shared components.

/** The nodes directly below a view node, whatever its kind. */
export const children = (node) => [
  ...(node.children ?? []),
  ...(node.then ?? []),
  ...(node.else ?? []),
  ...(node.body ? [node.body] : []),
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
