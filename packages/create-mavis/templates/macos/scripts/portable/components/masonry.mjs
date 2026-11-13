import { spacing } from './shared.mjs'

// items: records with an id string, such as the MasonryItem the slot hands back.
function items({ attribute, value, ctx, expr, fail, fields }) {
  const list = expr(value, ctx)
  const record = list.type.k === 'array' && list.type.of.k === 'record' ? list.type.of.name : null
  const own = record ? fields(record) : []
  const id = own.find((field) => field.name === 'id')
  const height = own.find((field) => field.name === 'estimatedHeight')
  if (!id || id.type.k !== 'string')
    fail(
      attribute,
      'MMasonry takes items with an id string: a list of records such as { id: string; title: string }.',
    )
  if (height && (height.type.k === 'optional' ? height.type.of : height.type).k !== 'number')
    fail(attribute, "An item's estimatedHeight is a number.")
  return { expr: list, record, estimated: Boolean(height) }
}

// A literal is checked while generating, as the Web checks it while laying out.
const bounded =
  (key, test, message) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !test(number.value)) fail(attribute, `${key} ${message}`)
    return { expr: number }
  }

// masonryProps: items in as many columns of at least minColumnWidth as fit, at most columns.
// Each item goes to the shortest column, in order, at its own height; assistive technology
// reads them in item order. The item slot hands the item, its index and the column width.
export const MMasonry = {
  props: {
    id: 'string',
    label: 'string',
    items,
    minColumnWidth: bounded('minColumnWidth', (value) => value >= 40, 'is at least 40.'),
    columns: bounded(
      'columns',
      (value) => Number.isInteger(value) && value >= 1 && value <= 12,
      'is a whole number from 1 to 12.',
    ),
    gap: 'space',
    animated: 'boolean',
    emptyLabel: 'string',
  },
  required: ['label', 'items'],
  slots: ['item'],
  scoped: {
    item: (props, { record, T }) => [
      { name: 'item', type: record('MasonryItem') },
      { name: 'index', type: T.number },
      { name: 'width', type: T.number },
    ],
  },
  types: () =>
    '/** What MMasonry places, and what its item slot hands back: look the rest up by id. */\ntype MasonryItem = { id: string; estimatedHeight?: number }',
  records: { MasonryItem: 'the Mavis masonry item type' },
  declaration:
    'declare function MMasonry(props: { id?: string; label: string; items: readonly { readonly id: string; readonly estimatedHeight?: number }[]; minColumnWidth?: number; columns?: number; gap?: MavisSpacing; animated?: boolean; emptyLabel?: string; slotItem?: (props: { item: MasonryItem; index: number; width: number }) => JSX.Element }): JSX.Element',
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const slot = node.slots?.find((each) => each.name === 'item')
    const list = emit.expr(props.items.expr)
    // The slot always hands MasonryItem, as on the Web: other records become one.
    const placed =
      props.items.record === 'MasonryItem'
        ? list
        : `${emit.wrap(props.items.expr)}.map { MasonryItem(id: $0.id, estimatedHeight: ${props.items.estimated ? '$0.estimatedHeight' : 'nil'}) }`
    const args = [
      `label: ${emit.value(props.label)}`,
      `items: ${placed}`,
      'id: \\.id',
      ...(props.minColumnWidth ? [`minColumnWidth: ${emit.expr(props.minColumnWidth.expr)}`] : []),
      ...(props.columns ? [`columns: ${emit.expr(props.columns.expr)}`] : []),
      `gap: ${spacing(props.gap, context, 'md')}`,
      ...(props.animated ? [`animated: ${emit.value(props.animated)}`] : []),
      ...(props.emptyLabel ? [`emptyLabel: ${emit.value(props.emptyLabel)}`] : []),
    ]
    const names = slot
      ? slot.params.map((param, index) =>
          param.unused ? ['mavisItem', 'mavisIndex', 'mavisWidth'][index] : param.name,
        )
      : ['item', 'index', 'width']
    // Each item's content is a row of its own: fields in it take focus per item.
    emit.forKeys.push(`${names[0]}.id`)
    const body = slot
      ? slot.body.map((child) => emit.view(child, indent + 4, tokens)).join('\n')
      : `${pad}    Text(verbatim: ${names[0]}.id)\n${pad}        .font(${tokens.font('body')})\n${pad}        .foregroundStyle(${tokens.color('text')})`
    emit.forKeys.pop()
    return [
      `${pad}MavisMasonry(${args.join(', ')}) { (${names[0]}: MasonryItem, ${names[1]}: Double, ${names[2]}: Double) in`,
      body || `${pad}    EmptyView()`,
      `${pad}}`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
    metric,
    defaultMetric,
  }) => `/// MMasonry's placement, as masonryLayout in the Mavis core: as many columns of at least
/// minColumnWidth as fit, at most columns, and each item at the bottom of the shortest one.
struct MavisMasonryLayout: Layout {
    var minColumnWidth: Double
    var columns: Double
    var gap: Double

    func columnCount(_ width: Double) -> Int {
        let fit = ((width + gap) / (minColumnWidth + gap)).rounded(.down)
        return Int(Swift.max(1, Swift.min(columns.rounded(.down), fit)))
    }

    func itemWidth(_ width: Double) -> Double {
        let count = Double(columnCount(width))
        return Swift.max(0, (width - gap * (count - 1)) / count)
    }

    private func frames(_ subviews: Subviews, width: Double) -> (frames: [CGRect], height: Double) {
        let item = itemWidth(width)
        var bottoms = Array(repeating: 0.0, count: columnCount(width))
        var frames: [CGRect] = []
        for subview in subviews {
            let column = bottoms.firstIndex(of: bottoms.min() ?? 0) ?? 0
            let height = subview.sizeThatFits(ProposedViewSize(width: item, height: nil)).height
            frames.append(CGRect(x: Double(column) * (item + gap), y: bottoms[column], width: item, height: height))
            bottoms[column] += height + gap
        }
        return (frames, Swift.max(0, (bottoms.max() ?? 0) - (subviews.isEmpty ? 0 : gap)))
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = Double(proposal.width ?? CGFloat(minColumnWidth))
        return CGSize(width: width, height: frames(subviews, width: width).height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (subview, frame) in zip(subviews, frames(subviews, width: bounds.width).frames) {
            subview.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY), proposal: ProposedViewSize(width: frame.width, height: frame.height))
        }
    }
}

private struct MavisMasonryEntry: Identifiable {
    let id: String
    let index: Int
}

private struct MavisMasonryWidth: PreferenceKey {
    static let defaultValue: Double = -1
    static func reduce(value: inout Double, nextValue: () -> Double) { value = nextValue() }
}

/// MMasonry: the items in their columns, named by label. Jolt moves them when the list changes;
/// Reduce Motion puts them in place at once.
struct MavisMasonry<Item, Content: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let items: [Item]
    let id: KeyPath<Item, String>
    var minColumnWidth: Double = 220
    var columns: Double = 4
${defaultMetric('gap', 'space.md')}
    var animated: Bool = true
    var emptyLabel: String = "No items"
    @ViewBuilder let content: (Item, Double, Double) -> Content
    @State private var width: Double = -1

    var body: some View {
        let layout = MavisMasonryLayout(minColumnWidth: minColumnWidth, columns: columns, gap: gap)
        // Before the first measurement the Web lays out one column of minColumnWidth too.
        let itemWidth = layout.itemWidth(width < 0 ? minColumnWidth : width)
        Group {
            if items.isEmpty {
                Text(verbatim: emptyLabel)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.muted)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                layout {
                    ForEach(items.indices.map { MavisMasonryEntry(id: items[$0][keyPath: id], index: $0) }) { entry in
                        content(items[entry.index], Double(entry.index), itemWidth)
                            .frame(maxWidth: .infinity, alignment: .topLeading)
                            // Read in item order, whichever column each one is in.
                            .accessibilitySortPriority(Double(items.count - entry.index))
                    }
                }
                .joltLayout(value: animated ? items.map { $0[keyPath: id] } : [], transition: .spring(.smooth))
                // Each item is as wide as its column, whatever width or grow it asks of a stack.
                .environment(\\.mavisInFlex, false)
            }
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .background(GeometryReader { proxy in
            Color.clear.preference(key: MavisMasonryWidth.self, value: proxy.size.width)
        })
        .onPreferenceChange(MavisMasonryWidth.self) { next in
            if abs(next - width) > 0.5 { width = next }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
}
