import { flexRuntime } from './flex.mjs'
import { accessibility, background, boxProps, flexItem, padding, spacing } from './shared.mjs'

// gridProps: the box contract plus equal columns.
export const MGrid = {
  props: { ...boxProps, gap: 'space', columns: 'number', minColumnWidth: 'number' },
  children: 'elements',
  uses: [flexRuntime],
  declaration:
    'declare function MGrid(props: MavisBox & { gap?: MavisSpacing; columns?: number; minColumnWidth?: number; children?: unknown }): JSX.Element',
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    // Each cell reads as a whole, in source order. Without a group per cell,
    // assistive technology goes by position and interleaves the columns.
    const cells =
      node.children
        .map((childNode) =>
          [
            `${pad}    Group {`,
            emit.view(childNode, indent + 8, tokens),
            `${pad}    }`,
            `${pad}        .accessibilityElement(children: .contain)`,
          ].join('\n'),
        )
        .join('\n') || `${pad}    EmptyView()`
    const args = [
      ...(props.minColumnWidth ? [`minColumnWidth: ${emit.expr(props.minColumnWidth.expr)}`] : []),
      ...(props.columns ? [`columns: ${emit.expr(props.columns.expr)}`] : []),
      `spacing: ${spacing(props.gap, context, 'none')}`,
    ]
    return [
      `${pad}MavisGrid(${args.join(', ')}) {`,
      cells,
      `${pad}}`,
      // A cell sizes its content itself; only stacks resolve width and height for their children.
      `${pad}    .environment(\\.mavisInFlex, false)`,
      ...padding(props, context),
      ...background(props, context),
      ...accessibility(props, context, { container: true }),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime:
    () => `/// MGrid: equal columns, as many as fit minColumnWidth, like the Web and NativeScript grid.
struct MavisGrid: Layout {
    var minColumnWidth: Double? = nil
    var columns: Double? = nil
    var spacing: Double = 0

    private func count(_ width: CGFloat) -> Int {
        let limit = columns.map { max(1, Int($0)) }
        guard let minColumnWidth, width.isFinite else { return limit ?? 1 }
        let fit = max(1, Int((max(0, width) + spacing) / (minColumnWidth + spacing)))
        return limit.map { min($0, fit) } ?? fit
    }

    private func rows(_ subviews: Subviews, _ width: CGFloat) -> (count: Int, column: CGFloat, heights: [CGFloat]) {
        let count = count(width)
        let column = max(0, (width - spacing * CGFloat(count - 1)) / CGFloat(count))
        var heights: [CGFloat] = []
        for start in stride(from: 0, to: subviews.count, by: count) {
            let row = subviews[start..<min(start + count, subviews.count)]
            heights.append(row.map { $0.sizeThatFits(ProposedViewSize(width: column, height: nil)).height }.max() ?? 0)
        }
        return (count, column, heights)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? subviews.map { $0.sizeThatFits(.unspecified).width }.max() ?? 0
        let heights = rows(subviews, width).heights
        return CGSize(width: width, height: heights.reduce(0, +) + spacing * CGFloat(max(0, heights.count - 1)))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let layout = rows(subviews, bounds.width)
        var y = bounds.minY
        for (row, height) in layout.heights.enumerated() {
            for column in 0..<layout.count {
                let index = row * layout.count + column
                guard index < subviews.count else { break }
                subviews[index].place(
                    at: CGPoint(x: bounds.minX + CGFloat(column) * (layout.column + spacing), y: y),
                    anchor: .topLeading,
                    proposal: ProposedViewSize(width: layout.column, height: height)
                )
            }
            y += height + spacing
        }
    }
}`,
}
