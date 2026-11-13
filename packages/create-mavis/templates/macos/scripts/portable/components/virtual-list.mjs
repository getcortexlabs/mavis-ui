import { flexRuntime } from './flex.mjs'
import { scrollRuntime } from './scroll.mjs'

// items: records the list keys by one of their fields.
function items({ attribute, value, ctx, expr, fail }) {
  const list = expr(value, ctx)
  if (list.type.k !== 'array' || list.type.of.k !== 'record')
    fail(
      attribute,
      'MVirtualList takes a list of records, such as { id: string; title: string }[].',
    )
  return { expr: list, record: list.type.of.name }
}

// The key is a field of every item, written out: the Mac keeps each row's identity by it.
function itemKey({ attribute, value, fail, ts }) {
  if (!ts.isStringLiteral(value))
    fail(attribute, 'itemKey names a field of the items, written out: itemKey="id".')
  return { lit: value.text }
}

// A literal is checked while generating, as the Web checks it while rendering.
const bounded =
  (key, test, message) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !test(number.value)) fail(attribute, `${key} ${message}`)
    return { expr: number }
  }
const whole = (value) => Number.isInteger(value) && value >= 0

function reference({ value, attribute, ctx, fail, ts }) {
  const handle = ts.isIdentifier(value)
    ? ctx.component.refs.find((ref) => ref.name === value.text)
    : null
  if (ctx.members.get(value.text) !== 'Ref' || handle?.kind !== 'list')
    fail(attribute, 'ref takes a list reference, for scrollToIndex.')
  if (ctx.inFor) fail(attribute, 'Repeated rows cannot share one list reference.')
  if (handle.field) fail(attribute, `${value.text} already belongs to another list.`)
  handle.field = true
  return { ref: value.text }
}

const keyField = (props, fields) =>
  fields(props.items.record).find((field) => field.name === (props.itemKey?.lit ?? 'id'))

// virtualListProps: rows of one fixed height in a viewport of a fixed height; only the rows in
// view exist, with overscan more on each side, and each keeps its identity by itemKey. The row is
// the default slot: it takes the item, its index and its key.
export const MVirtualList = {
  macos: { rejectedProps: ['animated'] },
  props: {
    id: 'string',
    label: 'string',
    items,
    itemKey,
    rowHeight: bounded('rowHeight', (value) => value > 0, 'must be positive.'),
    height: bounded('height', (value) => value > 0, 'must be positive.'),
    overscan: bounded('overscan', whole, 'is a whole number, zero or more.'),
    initialIndex: bounded('initialIndex', whole, 'is a whole number, zero or more.'),
    emptyLabel: 'string',
    animated: ({ attribute, fail }) =>
      fail(
        attribute,
        'MVirtualList animated uses Jolt listChanges on Web and NativeScript; the Mac compiler does not support keyed list-change motion yet. Omit animated for the existing Mac list.',
      ),
    ref: reference,
  },
  required: ['label', 'items', 'rowHeight', 'height'],
  slots: ['default', 'empty'],
  scoped: {
    default(props, { fields, T }) {
      const key = keyField(props, fields)
      return [
        { name: 'item', type: T.record(props.items.record) },
        { name: 'index', type: T.number },
        { name: 'itemKey', type: key?.type ?? T.string },
      ]
    },
  },
  uses: [flexRuntime, scrollRuntime],
  types:
    () => `/** A list you can scroll from an action: const feedRef = useRef<MavisListRef>(null). */
interface MavisListRef { scrollToIndex(index: number): void }`,
  declaration:
    'declare function MVirtualList<T>(props: { id?: string; label: string; items: readonly T[]; itemKey?: Extract<keyof T, string>; rowHeight: number; height: number; overscan?: number; initialIndex?: number; emptyLabel?: string; animated?: boolean; ref?: MavisListRef; slotEmpty?: JSX.Element; children?: (props: { item: T; index: number; itemKey: string | number }) => JSX.Element }): JSX.Element',
  check({ tag, props, attrs, fail, fields }) {
    const key = keyField(props, fields)
    if (!key || !['string', 'number'].includes(key.type.k))
      fail(
        attrs.get('itemKey') ?? tag,
        `Every item needs the key ${props.itemKey?.lit ?? 'id'}, a string or a number: name another field with itemKey.`,
      )
    props.items.key = { name: key.name, number: key.type.k === 'number' }
  },
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const row = node.slots?.find((slot) => slot.name === 'default')
    const empty = node.slots?.find((slot) => slot.name === 'empty')
    const { name: key, number } = props.items.key
    const taken = (index, fallback) =>
      row && !row.params[index].unused ? row.params[index].name : fallback
    const item = taken(0, 'mavisItem')
    const index = taken(1, 'mavisIndex')
    const views = (nodes) =>
      nodes.map((child) => emit.view(child, indent + 8, tokens)).join('\n') ||
      `${pad}        EmptyView()`
    // Each row is a row of a list: fields in it take focus per item.
    emit.forKeys.push(number ? `mavisString(${item}.${key})` : `${item}.${key}`)
    const rows = row ? views(row.body) : `${pad}        EmptyView()`
    emit.forKeys.pop()
    const args = [
      `label: ${emit.value(props.label)}`,
      `items: ${emit.expr(props.items.expr)}`,
      `key: { ${number ? `mavisString($0.${key})` : `$0.${key}`} }`,
      `rowHeight: ${emit.expr(props.rowHeight.expr)}`,
      `height: ${emit.expr(props.height.expr)}`,
      ...(props.overscan ? [`overscan: ${emit.expr(props.overscan.expr)}`] : []),
      ...(props.initialIndex ? [`initialIndex: ${emit.expr(props.initialIndex.expr)}`] : []),
      ...(props.ref ? [`request: self.${props.ref.ref}`] : []),
    ].map((arg) => `${pad}    ${arg}`)
    return [
      `${pad}MavisVirtualList(`,
      [
        ...args,
        `${pad}    empty: {\n${
          empty
            ? views(empty.body)
            : `${pad}        Text(verbatim: ${props.emptyLabel ? emit.value(props.emptyLabel) : '"No items"'})\n${pad}            .font(${tokens.font('body')})\n${pad}            .foregroundStyle(${tokens.color('muted')})`
        }\n${pad}    }`,
        `${pad}    row: { (${item}: ${props.items.record}, ${index}: Double) in\n${
          row && !row.params[2].unused
            ? `${pad}        let ${row.params[2].name} = ${item}.${key}\n`
            : ''
        }${rows}\n${pad}    }`,
      ].join(',\n'),
      `${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime:
    () => `/// What an action asks of an MVirtualList through its reference: scrollToIndex.
struct MavisListRequest: Equatable {
    var index: Double = 0
    var serial = 0
}

/// MVirtualList: rows of one height in a viewport of a fixed height. Only the rows in view exist,
/// with overscan more on each side, as virtualWindow in the Mavis core decides for the Web, and
/// each row keeps its identity by its key. Jolt reads the scroll position from the scroll view.
struct MavisVirtualList<Item: Hashable, Row: View, Empty: View>: View {
    let label: String
    let items: [Item]
    let key: (Item) -> String
    let rowHeight: Double
    let height: Double
    var overscan: Double = 3
    var initialIndex: Double = 0
    var request = MavisListRequest()
    @ViewBuilder let empty: () -> Empty
    @ViewBuilder let row: (Item, Double) -> Row
    @StateObject private var scroll = mavisScrollProgress()
    // Where the list was sent and has not arrived yet: the rows there are built at once.
    @State private var sent: Double?
    @State private var move = MavisScrollMove()
    @State private var started = false

    private var extent: Double { Swift.max(0, Double(items.count) * rowHeight - height) }
    private func clamped(_ offset: Double) -> Double { Swift.min(Swift.max(0, offset), extent) }
    private var offset: Double { clamped(started ? sent ?? scroll.offset : initialIndex * rowHeight) }

    /// virtualWindow in the Mavis core.
    private var window: Range<Int> {
        let extra = Int(Swift.max(0, overscan))
        let first = Swift.max(0, Int((offset / rowHeight).rounded(.down)) - extra)
        let last = Swift.min(items.count, Int(((offset + height) / rowHeight).rounded(.up)) + extra)
        return first..<Swift.max(first, last)
    }

    private func go(to target: Double) {
        let next = clamped(target)
        guard abs(next - scroll.offset) > 0.5 else { return }
        sent = next
        move = MavisScrollMove(y: next, serial: move.serial + 1)
    }

    private var rows: some View {
        let shown = window
        return VStack(spacing: 0) {
            MavisGap(height: Double(shown.lowerBound) * rowHeight)
            ForEach(shown.map { MavisListRow(id: key(items[$0]), index: $0) }) { entry in
                MavisColumn { row(items[entry.index], Double(entry.index)) }
                    .frame(maxWidth: .infinity, minHeight: rowHeight, maxHeight: rowHeight, alignment: .topLeading)
                    .clipped()
            }
            MavisGap(height: Double(items.count - shown.upperBound) * rowHeight)
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .background(MavisScroller(move: move))
    }

    var body: some View {
        Group {
            if items.isEmpty {
                MavisColumn { empty() }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            } else {
                JoltScrollView(progress: scroll) { rows }
            }
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .frame(height: height)
        .onAppear {
            guard !started else { return }
            started = true
            go(to: initialIndex * rowHeight)
        }
        .onChange(of: scroll.offset) { _, next in
            if let target = sent, abs(next - target) <= 0.5 { sent = nil }
        }
        .onChange(of: request) { _, next in
            // An index outside the list is a RangeError on the Web; here it is left alone.
            guard next.index >= 0, next.index < Double(items.count), next.index == next.index.rounded() else { return }
            go(to: next.index * rowHeight)
        }
        // A list that changes keeps the first row in view where it was, as on the Web.
        .onChange(of: items) { before, after in
            let top = Int((offset / rowHeight).rounded(.down))
            guard before.indices.contains(top) else { return }
            let anchor = key(before[top])
            guard let index = after.firstIndex(where: { key($0) == anchor }) else { return }
            go(to: Double(index) * rowHeight + offset.truncatingRemainder(dividingBy: rowHeight))
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}

private struct MavisListRow: Identifiable {
    let id: String
    let index: Int
}`,
}
