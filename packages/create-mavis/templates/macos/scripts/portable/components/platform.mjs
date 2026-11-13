import { union } from './shared.mjs'

/** The targets an MPlatform names, as useMavisPlatform answers them. */
export const platformTargets = ['web', 'native', 'ios', 'android', 'macos']

// only: one target or a list of them, written out, so the Mac knows its branch while generating.
function only({ attribute, value, fail, ts }) {
  const written = "MPlatform takes only, written out: only=\"macos\" or only={['web', 'macos']}."
  let targets
  if (ts.isStringLiteral(value)) targets = [value.text]
  else if (ts.isArrayLiteralExpression(value) && value.elements.every(ts.isStringLiteral))
    targets = value.elements.map((item) => item.text)
  else fail(attribute, written)
  if (!targets.length) fail(attribute, 'only names at least one target.')
  for (const target of targets)
    if (!platformTargets.includes(target))
      fail(attribute, `${target} is not a target; only takes ${platformTargets.join(', ')}.`)
  return { lit: targets, list: !ts.isStringLiteral(value) }
}

/** Whether the Mac shows an MPlatform's content, rather than its fallback. */
export const onMac = (node) => node.props.only.lit.includes('macos')

// platformProps: the content shows on the targets only names, the fallback slot on the others.
// It adds no view: what shows sits in the stack around it. The Web and NativeScript keep both
// branches; the Mac gets the one it shows and nothing of the other.
export const MPlatform = {
  props: { only },
  required: ['only'],
  children: 'elements',
  slots: ['fallback'],
  types: () => `type MavisPlatformTarget = ${union(platformTargets)}`,
  declaration:
    'declare function MPlatform(props: { only: MavisPlatformTarget | readonly MavisPlatformTarget[]; slotFallback?: JSX.Element; children?: unknown }): JSX.Element',
  swift(node, { emit, indent, tokens }) {
    const shown = onMac(node)
      ? node.children
      : (node.slots?.find((slot) => slot.name === 'fallback')?.body ?? [])
    return (
      shown.map((child) => emit.view(child, indent, tokens)).join('\n') ||
      `${' '.repeat(indent)}EmptyView()`
    )
  },
  vue: {
    attribute(name, value) {
      if (name !== 'only') return
      return value.list
        ? `:only="[${value.lit.map((target) => `'${target}'`).join(', ')}]"`
        : `only="${value.lit[0]}"`
    },
  },
}
