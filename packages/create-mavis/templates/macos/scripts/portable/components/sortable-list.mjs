import { flexRuntime } from './flex.mjs'
import { scrollRuntime } from './scroll.mjs'
import { expression, handlerJs } from '../js-text.mjs'
import { bounded, content, event, named, perItem, slotOf } from './list-parts.mjs'

// value: the items in their order, records the list keys by one of their fields.
function items({ attribute, value, ctx, expr, fail }) {
  const list = expr(value, ctx)
  if (list.type.k !== 'array' || list.type.of.k !== 'record')
    fail(
      attribute,
      'MSortableList takes a list of records, such as { id: string; title: string }[].',
    )
  return { expr: list, record: list.type.of.name }
}

function itemKey({ attribute, value, fail, ts }) {
  if (!ts.isStringLiteral(value))
    fail(
      attribute,
      'On the Mac, itemKey currently names a field of the items, written out: itemKey="id". Computed key callbacks are not supported by this component yet (#352).',
    )
  return { lit: value.text }
}

const keyField = (props, fields) =>
  fields(props.value.record).find((each) => each.name === (props.itemKey?.lit ?? 'id'))

// sortableListProps: rows in the order of value, each with a handle to drag it by, its content
// and a button to move it up and one to move it down. The order belongs to the source, as
// v-model on the Web and NativeScript: a move asks for the new list with onChange and says what
// moved with onReorder. The row is the default slot: it takes the item, its index and its key.
export const MSortableList = {
  props: {
    id: 'string',
    label: 'string',
    value: items,
    onChange: event(({ type, T }) => [type('value') ?? T.array(T.string)]),
    onReorder: event(({ record }) => [record('SortableMove')]),
    itemKey,
    itemLabel: perItem('MSortableList', 'value', 'string'),
    height: bounded('height', (value) => value > 0, 'must be positive.'),
    disabled: 'boolean',
    handleLabel: 'string',
    moveUpLabel: 'string',
    moveDownLabel: 'string',
    emptyLabel: 'string',
  },
  required: ['label', 'value'],
  slots: ['default', 'empty'],
  scoped: {
    default(props, { fields, T }) {
      const key = keyField(props, fields)
      return [
        { name: 'item', type: T.record(props.value.record) },
        { name: 'index', type: T.number },
        { name: 'itemKey', type: key?.type ?? T.string },
      ]
    },
  },
  control: true,
  uses: [flexRuntime, scrollRuntime],
  types: () =>
    '/** What MSortableList reports with onReorder: the item that moved, the one it now sits before and its places. */\ntype SortableMove = { key: string; beforeKey: string | null; fromIndex: number; toIndex: number }',
  records: { SortableMove: 'the Mavis sortable move type' },
  declaration:
    'declare function MSortableList<T>(props: { id?: string; label: string; value: readonly T[]; onChange?: (items: T[]) => void; onReorder?: (move: SortableMove) => void; itemKey?: Extract<keyof T, string>; itemLabel?: (item: T) => string; height?: number; disabled?: boolean; handleLabel?: string; moveUpLabel?: string; moveDownLabel?: string; emptyLabel?: string; slotEmpty?: JSX.Element; children?: (props: { item: T; index: number; itemKey: string }) => JSX.Element }): JSX.Element',
  check({ tag, props, attrs, fail, fields }) {
    if ('lit' in props.label && !props.label.lit.trim())
      fail(attrs.get('label'), 'MSortableList needs a label that is not empty.')
    const key = keyField(props, fields)
    if (!key || key.type.k !== 'string')
      fail(
        attrs.get('itemKey') ?? tag,
        `Every item needs the key ${props.itemKey?.lit ?? 'id'}, a string: a move names the items by it. Name another field with itemKey.`,
      )
    props.value.key = key.name
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const record = props.value.record
    const key = props.value.key
    const row = slotOf(node, 'default')
    const empty = slotOf(node, 'empty')
    const taken = (index, fallback) =>
      row && !row.params[index].unused ? row.params[index].name : fallback
    const item = taken(0, 'mavisItem')
    let rows = `${pad}        MavisSortableDefault()`
    if (row) {
      // Each row is a row of a list: fields in it take focus per item.
      emit.forKeys.push(`${item}.${key}`)
      rows = [
        ...(row.params[2].unused
          ? []
          : [`${pad}        let ${row.params[2].name} = ${item}.${key}`]),
        content(row.body, context),
      ].join('\n')
      emit.forKeys.pop()
    }
    const args = [
      `label: ${emit.value(props.label)}`,
      `items: ${emit.expr(props.value.expr)}`,
      `key: { $0.${key} }`,
      ...(props.itemLabel ? [`itemLabel: ${emit.closure(props.itemLabel.expr, 'String')}`] : []),
      ...(props.onChange ? [`onChange: ${emit.handler(props.onChange, indent + 4)}`] : []),
      ...(props.onReorder
        ? [
            [
              'onReorder: { mavisMove in',
              `${pad}        (${emit.handler(props.onReorder, indent + 8)})(SortableMove(key: mavisMove.key, beforeKey: mavisMove.beforeKey, fromIndex: mavisMove.fromIndex, toIndex: mavisMove.toIndex))`,
              `${pad}    }`,
            ].join('\n'),
          ]
        : []),
      ...(props.height ? [`height: ${emit.expr(props.height.expr)}`] : []),
      ...named(props, emit, [
        'disabled',
        'handleLabel',
        'moveUpLabel',
        'moveDownLabel',
        'emptyLabel',
      ]),
      `row: { (${item}: ${record}, ${taken(1, 'mavisIndex')}: Double) in\n${rows}\n${pad}    }`,
      `empty: {\n${empty ? content(empty.body, context) : `${pad}        MavisSortableDefault()`}\n${pad}    }`,
    ]
    return [
      `${pad}MavisSortable(`,
      args.map((arg) => `${pad}    ${arg}`).join(',\n'),
      `${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// What MSortableList reports with onReorder, without the shared record type.
struct MavisSortableMove: Equatable {
    let key: String
    let beforeKey: String?
    let fromIndex: Double
    let toIndex: Double
}

/// Stands for a row or an empty state the source left to the list.
struct MavisSortableDefault: View {
    var body: some View { EmptyView() }
}

/// The order Jolt keeps while a row is dragged: rows are measured, eight points apart.
@MainActor func mavisReorderModel() -> JoltReorderModel {
    try! JoltReorderModel([], rowHeight: 64, spacing: 8, measuresRows: true)
}

/// MSortableList: the items in their order, in a viewport of a fixed height. The order belongs
/// to the source: Jolt's reorder model decides where a dragged row lands and what a step up or
/// down moves, and the list asks the source for the new order as moveItem in the Mavis core
/// builds it. A handle drags its row, and takes the arrow keys while it has focus. Jolt moves
/// the rows; Reduce Motion places them.
struct MavisSortable<Item, Row: View, Empty: View>: View {
    let label: String
    let items: [Item]
    let key: (Item) -> String
    var itemLabel: ((Item) -> String)? = nil
    var onChange: ([Item]) -> Void = { _ in }
    var onReorder: (MavisSortableMove) -> Void = { _ in }
    var height: Double = 360
    var disabled: Bool = false
    var handleLabel: String = "Reorder"
    var moveUpLabel: String = "Move up"
    var moveDownLabel: String = "Move down"
    var emptyLabel: String = "No items"
    @ViewBuilder var row: (Item, Double) -> Row
    @ViewBuilder var empty: () -> Empty
    @StateObject private var model = mavisReorderModel()
    @StateObject private var scroll = mavisScrollProgress()
    @State private var heights: [String: Double] = [:]
    @State private var space = UUID()
    @State private var dragged: String?
    @GestureState private var dragging = false
    @FocusState private var focus: String?

    // The list's own padding, above the first row.
    private static var inset: Double { 6 }

    private var keys: [String] { items.map(key) }
    private func name(_ index: Int) -> String { itemLabel?(items[index]) ?? key(items[index]) }

    /// Jolt's model follows the source's order: a move the source kept out leaves no trace.
    private func prepare() {
        let current = keys
        if model.keys != current {
            try? model.replace(current)
            try? model.updateMeasurements(heights.filter { current.contains($0.key) })
        }
        if disabled { model.pause() } else { model.play() }
    }

    private func commit(_ move: JoltReorderMove) {
        guard items.indices.contains(move.fromIndex), items.indices.contains(move.toIndex) else { return }
        var next = items
        let moved = next.remove(at: move.fromIndex)
        next.insert(moved, at: move.toIndex)
        onChange(next)
        onReorder(MavisSortableMove(key: move.key, beforeKey: move.beforeKey, fromIndex: Double(move.fromIndex), toIndex: Double(move.toIndex)))
    }

    private func step(_ index: Int, _ delta: Int) {
        guard !disabled, items.indices.contains(index) else { return }
        prepare()
        if let move = model.move(key(items[index]), to: index + delta) { commit(move) }
    }

    private func measured(_ key: String, _ height: Double) {
        guard height >= 24, abs((heights[key] ?? 0) - height) > 0.5 else { return }
        heights[key] = height
        if model.keys.contains(key) { try? model.updateMeasurements([key: height]) }
    }

    private func drag(_ key: String) -> some Gesture {
        DragGesture(minimumDistance: 4, coordinateSpace: .named(space))
            .updating($dragging) { _, state, _ in state = true }
            .onChanged { event in
                guard !disabled else { return }
                if dragged == nil {
                    prepare()
                    dragged = key
                    focus = key
                    model.begin(key, pointerY: event.startLocation.y - Self.inset, scrollOffset: scroll.offset)
                }
                model.move(viewportY: event.location.y - Self.inset, scrollOffset: scroll.offset, viewportHeight: height)
            }
            .onEnded { _ in
                dragged = nil
                if let move = model.end() { commit(move) }
            }
    }

    private func arrow(_ icon: String, _ text: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) { MavisIcon(icon, size: 20) }
            .buttonStyle(MavisButtonStyle(variant: .ghost))
            .fixedSize()
            .disabled(!enabled)
            .accessibilityLabel(Text(verbatim: text))
    }

    private func line(_ index: Int) -> some View {
        let id = key(items[index])
        let title = name(index)
        return HStack(alignment: .center, spacing: ${theme.space.sm}) {
            MavisIcon("grip-vertical", size: 20)
                .foregroundStyle(MavisTokens.text)
                .frame(width: 44, height: ${theme.control.md.height})
                .contentShape(Rectangle())
                .opacity(disabled ? 0.45 : 1)
                .focusable(!disabled, interactions: .edit)
                .focused($focus, equals: id)
                .onKeyPress(.upArrow) {
                    step(index, -1)
                    return .handled
                }
                .onKeyPress(.downArrow) {
                    step(index, 1)
                    return .handled
                }
                .gesture(drag(id))
                .simultaneousGesture(TapGesture().onEnded { if !disabled { focus = id } })
                .accessibilityElement()
                .accessibilityLabel(Text(verbatim: handleLabel + ": " + title))
                .accessibilityAddTraits(.isButton)
            MavisColumn {
                if Row.self == MavisSortableDefault.self {
                    Text(verbatim: title)
                        .font(${font('body')})
                        .foregroundStyle(MavisTokens.text)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    row(items[index], Double(index))
                }
            }
            .accessibilityElement(children: .contain)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            VStack(spacing: ${theme.space.xs}) {
                arrow("chevron-up", moveUpLabel + ": " + title, enabled: !disabled && index > 0) { step(index, -1) }
                arrow("chevron-down", moveDownLabel + ": " + title, enabled: !disabled && index < items.count - 1) { step(index, 1) }
            }
        }
        // The border takes one unit of the row's box, as on the Web.
        .padding(${theme.space.sm + 1})
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
        .overlay(RoundedRectangle(cornerRadius: ${theme.radius.md}).strokeBorder(model.active == id ? MavisTokens.primary : MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
        .background(GeometryReader { proxy in
            Color.clear
                .onAppear { measured(id, proxy.size.height) }
                .onChange(of: proxy.size.height) { _, next in measured(id, next) }
        })
    }

    var body: some View {
        let current = keys
        let place = Dictionary(current.enumerated().map { ($1, $0) }, uniquingKeysWith: { first, _ in first })
        let order = (model.active != nil ? model.preview : current).filter { place[$0] != nil }
        JoltScrollView(progress: scroll) {
            if items.isEmpty {
                MavisColumn {
                    if Empty.self == MavisSortableDefault.self {
                        Text(verbatim: emptyLabel)
                            .font(${font('body')})
                            .foregroundStyle(MavisTokens.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        empty()
                    }
                }
                .padding(Self.inset)
            } else {
                VStack(spacing: 8) {
                    ForEach(order, id: \\.self) { key in line(place[key] ?? 0) }
                }
                .padding(Self.inset)
                .joltLayout(value: order, transition: .spring(.snappy))
            }
        }
        .coordinateSpace(name: space)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .frame(height: height)
        .onAppear { model.resume(); prepare() }
        .onDisappear { model.cancel(); model.suspend(); dragged = nil }
        .onChange(of: current) { _, _ in prepare() }
        .onChange(of: disabled) { _, _ in prepare() }
        .onChange(of: dragging) { _, active in
            if !active {
                if model.active != nil { model.cancel() }
                dragged = nil
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['SortableMove'],
    attribute(name, value) {
      // The portable model represents both kinds of absence as undefined in generated JS.
      if (name === 'onReorder' && value.params.some((param) => !param.unused))
        return `@reorder="${expression(`(move) => (${handlerJs(value)})({ ...move, beforeKey: move.beforeKey ?? undefined })`)}"`
    },
  },
}
