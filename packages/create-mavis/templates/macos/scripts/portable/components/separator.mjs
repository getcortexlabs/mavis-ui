import { flexRuntime } from './flex.mjs'
import { spacing, union } from './shared.mjs'

const orientations = ['horizontal', 'vertical']

// separatorProps: a line in the theme's border color, one unit thick, that assistive technology
// does not see. Without a length it stretches across its column or down its row, as
// align-self: stretch; a length is centered. spacing is the margin on each side across the line,
// inset the margin at each end.
export const MSeparator = {
  props: {
    id: 'string',
    orientation: 'string',
    length: 'factor',
    spacing: 'space',
    inset: 'space',
  },
  uses: [flexRuntime],
  types: () => `type MavisOrientation = ${union(orientations)}`,
  declaration:
    'declare function MSeparator(props: { id?: string; orientation?: MavisOrientation; length?: number; spacing?: MavisSpacing; inset?: MavisSpacing }): JSX.Element',
  check({ props, attrs, fail }) {
    if (
      props.orientation &&
      'lit' in props.orientation &&
      !orientations.includes(props.orientation.lit)
    )
      fail(attrs.get('orientation'), 'orientation is horizontal or vertical.')
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const vertical = !props.orientation
      ? 'false'
      : 'lit' in props.orientation
        ? String(props.orientation.lit === 'vertical')
        : `${emit.expr(props.orientation.expr)} == "vertical"`
    const args = [
      `vertical: ${vertical}`,
      ...(props.length ? [`length: ${emit.expr(props.length.expr)}`] : []),
      ...(props.spacing ? [`spacing: ${spacing(props.spacing, context)}`] : []),
      ...(props.inset ? [`inset: ${spacing(props.inset, context)}`] : []),
      ...(props.id ? [`id: ${emit.value(props.id)}`] : []),
    ]
    return [
      `${pad}MavisSeparator(${args.join(', ')})`,
      // Stretched without a length, centered with one.
      `${pad}    .mavisItem(shrink: 0, align: ${props.length ? '.center' : '.stretch'})`,
    ].join('\n')
  },
  swiftRuntime:
    () => `/// MSeparator: a line of the theme's border color, one point thick. Without a length it takes
/// the space it is offered along the line, and asks for none of its own.
struct MavisSeparator: View {
    var vertical: Bool = false
    var length: Double? = nil
    var spacing: Double = 0
    var inset: Double = 0
    var id: String? = nil

    var body: some View {
        let along: CGFloat? = length.map { CGFloat(max(0, $0)) }
        let least = along ?? 0
        let most = along ?? .infinity
        let line = Rectangle()
            .fill(MavisTokens.border)
            .frame(
                minWidth: vertical ? 1 : least, idealWidth: vertical ? 1 : least, maxWidth: vertical ? 1 : most,
                minHeight: vertical ? least : 1, idealHeight: vertical ? least : 1, maxHeight: vertical ? most : 1
            )
            .accessibilityHidden(true)
        // A test run reads the line's bounds from its corners; a shipped app adds nothing.
        Group {
            if let id { line.mavisIdentifier(id) } else { line }
        }
        .padding(.horizontal, vertical ? spacing : inset)
        .padding(.vertical, vertical ? inset : spacing)
        .allowsHitTesting(false)
    }
}`,
}
