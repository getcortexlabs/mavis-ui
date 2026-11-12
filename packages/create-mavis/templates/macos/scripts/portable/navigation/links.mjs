// What a link's destination is, as the Mavis core decides it for every target (link.ts).

/** Whether an href is a screen of the app rather than an address outside it. */
export const isAppDestination = (href) =>
  !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) && !href.includes('\\')

/** Why a destination written in the source cannot be followed, as linkDestination rejects it. */
export function destinationProblem(href) {
  const value = href.trim()
  if (!value || /[\u0000-\u001f\u007f]/.test(value))
    return 'A link needs a destination without control characters.'
  if (/^(?:javascript|data|vbscript):/i.test(value)) return 'A link cannot run a script.'
}

// Where each component reaches navigation, by component: the node of its useMavisNavigation()
// and of every href written out. They are checked against the route table once it is read.
const reached = new WeakMap()
const notes = (component) => {
  if (!reached.has(component)) reached.set(component, { navigator: undefined, links: [] })
  return reached.get(component)
}

export const noteNavigator = (component, node) => (notes(component).navigator = node)
export const noteLink = (component, node, href) => notes(component).links.push({ node, href })
export const navigationNotes = (component) => notes(component)
