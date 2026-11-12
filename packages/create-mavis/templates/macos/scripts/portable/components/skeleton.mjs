import { flexRuntime } from './flex.mjs'
import { flexItem, flexProps, radius, union } from './shared.mjs'

const effects = ['pulse', 'shimmer']
// The contract's defaults: a line of text 16 units tall with the small radius.
const height = { expr: { e: 'lit', value: 16, type: { k: 'number' } } }

// skeletonProps: a block of the border color where content is still loading, which assistive
// technology does not see. Without a width it stretches across its column, whatever the column's
// align, and with one it sits at the start. The shimmer is Jolt's loading effect.
export const MSkeleton = {
  props: {
    id: 'string',
    ...flexProps,
    width: 'dimension',
    height: 'dimension',
    radius: 'radius',
    animated: 'boolean',
    effect: 'string',
  },
  uses: [flexRuntime],
  declaration: `declare function MSkeleton(props: MavisFlexItem & { id?: string; width?: MavisDimension; height?: MavisDimension; radius?: MavisRadius; animated?: boolean; effect?: ${union(effects)} }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const shimmer =
      props.effect &&
      ('lit' in props.effect
        ? String(props.effect.lit === 'shimmer')
        : `${emit.expr(props.effect.expr)} == "shimmer"`)
    const args = [
      ...(props.radius ? [`radius: ${radius(props.radius, context)}`] : []),
      ...(props.animated ? [`animated: ${emit.value(props.animated)}`] : []),
      ...(shimmer && shimmer !== 'false' ? [`shimmer: ${shimmer}`] : []),
    ]
    const sized = props.width && !('lit' in props.width && props.width.lit === 'auto')
    const align = `align: ${sized ? '.start' : '.stretch'}`
    const [item] = flexItem({ ...props, height: props.height ?? height }, context)
    return [
      `${pad}MavisSkeleton(${args.join(', ')})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
      item ? item.replace(/\)$/, `, ${align})`) : `${pad}    .mavisItem(${align})`,
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
  }) => `/// MSkeleton: a block of the border color in place of content that is loading. It takes the
/// size its stack gives it and asks for none of its own. With shimmer, Jolt sweeps a highlight
/// over it while it is on screen; Reduce Motion and animated false leave it still.
struct MavisSkeleton: View {
    var radius: Double = ${theme.radius.sm}
    var animated: Bool = true
    var shimmer: Bool = false

    private var block: some View {
        RoundedRectangle(cornerRadius: radius)
            .fill(MavisTokens.border)
            .frame(idealWidth: 0, maxWidth: .infinity, idealHeight: 0, maxHeight: .infinity)
    }

    var body: some View {
        Group {
            if shimmer && animated {
                MavisShimmer { block }
            } else {
                block
            }
        }
        .accessibilityHidden(true)
        .allowsHitTesting(false)
    }
}

/// Jolt's shimmer, owned by the view that shows it: it sweeps only while that view is on screen.
@MainActor private struct MavisShimmer<Content: View>: View {
    @StateObject private var shimmer: JoltShimmer
    @ViewBuilder private let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        _shimmer = StateObject(wrappedValue: try! JoltShimmer())
        self.content = content
    }

    var body: some View {
        content().joltShimmer(shimmer)
    }
}`,
}
