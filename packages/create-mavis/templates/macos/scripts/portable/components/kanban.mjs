import { flexRuntime } from './flex.mjs'
import { expression, handlerJs } from '../js-text.mjs'
import { swiftRecord } from './choices.mjs'
import { content, event, field, named, records, slotOf } from './list-parts.mjs'

const columns = records(
  'MKanban',
  'columns',
  { id: 'string', title: 'string', limit: 'number?' },
  '{ id: string; title: string; limit?: number }[]',
)
const cards = records(
  'MKanban',
  'cards',
  { id: 'string', column: 'string', title: 'string', description: 'string?', disabled: 'boolean?' },
  '{ id: string; column: string; title: string }[]',
)
const labels = ['moveLabel', 'upLabel', 'downLabel', 'emptyLabel', 'fullLabel']

export const kanbanPolicy = `struct MavisKanbanColumnData: Equatable {
    let id: String
    let title: String
    var limit: Double? = nil
}
struct MavisKanbanCardData: Equatable {
    let id: String
    let column: String
    let title: String
    var disabled: Bool = false
}
struct MavisKanbanMove: Equatable {
    let id: String
    let from: String
    let to: String
    let before: String?
}
func mavisKanbanValid(_ columns: [MavisKanbanColumnData], _ cards: [MavisKanbanCardData]) -> Bool {
    guard (1...12).contains(columns.count), cards.count <= 500,
        Set(columns.map(\\.id)).count == columns.count, Set(cards.map(\\.id)).count == cards.count else { return false }
    for column in columns {
        guard !column.id.isEmpty, !column.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return false }
        if let limit = column.limit, !limit.isFinite || limit < 1 || limit.rounded(.towardZero) != limit { return false }
    }
    return cards.allSatisfy { card in !card.id.isEmpty && !card.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && columns.contains { $0.id == card.column } }
}
func mavisKanbanMove(_ columns: [MavisKanbanColumnData], _ cards: [MavisKanbanCardData], id: String, to: String, before: String? = nil) -> (order: [String], move: MavisKanbanMove)? {
    guard mavisKanbanValid(columns, cards), let card = cards.first(where: { $0.id == id }), !card.disabled,
        let target = columns.first(where: { $0.id == to }), before != id else { return nil }
    if let before, !cards.contains(where: { $0.id == before && $0.column == to }) { return nil }
    if card.column != to, let limit = target.limit, Double(cards.filter { $0.column == to }.count) >= limit { return nil }
    var next = cards.filter { $0.id != id }
    let index = before.flatMap { key in next.firstIndex { $0.id == key } } ?? next.count
    next.insert(MavisKanbanCardData(id: card.id, column: to, title: card.title, disabled: card.disabled), at: index)
    if card.column == to && cards.filter({ $0.column == to }).map(\\.id) == next.filter({ $0.column == to }).map(\\.id) { return nil }
    return (next.map(\\.id), MavisKanbanMove(id: id, from: card.column, to: to, before: before))
}`

export const MKanban = {
  props: {
    id: 'string',
    label: 'string',
    columns,
    value: cards,
    onChange: Object.assign(
      event(({ type }) => [type('value')]),
      { ts: 'KanbanCard[]' },
    ),
    onMove: Object.assign(
      event(({ record }) => [record('KanbanMove')]),
      { ts: 'KanbanMove' },
    ),
    query: 'string',
    disabled: 'boolean',
    animated: 'boolean',
    draggable: 'boolean',
    ...Object.fromEntries(labels.map((key) => [key, 'string'])),
  },
  required: ['label', 'columns', 'value'],
  slots: ['card'],
  control: true,
  scoped: {
    card: (props, { T }) => [
      { name: 'card', type: T.record(props.value.record) },
      { name: 'column', type: T.record(props.columns.record) },
    ],
  },
  uses: [flexRuntime],
  types: () =>
    'type KanbanColumn = { id: string; title: string; limit?: number }\ntype KanbanCard = { id: string; column: string; title: string; description?: string; disabled?: boolean }\ntype KanbanMove = { id: string; from: string; to: string; before: string | null }',
  records: {
    KanbanColumn: 'the Mavis kanban column type',
    KanbanCard: 'the Mavis kanban card type',
    KanbanMove: 'the Mavis kanban move type',
  },
  declaration: `declare function MKanban<T extends KanbanCard, C extends KanbanColumn>(props: { id?: string; label: string; columns: readonly C[]; value: readonly T[]; onChange?: (cards: T[]) => void; onMove?: (move: KanbanMove) => void; query?: string; disabled?: boolean; animated?: boolean; draggable?: boolean; ${labels.map((key) => `${key}?: string`).join('; ')}; slotCard?: (props: { card: T; column: C }) => JSX.Element }): JSX.Element`,
  check({ props, attrs, fail }) {
    if ('lit' in props.label && !props.label.lit.trim())
      fail(attrs.get('label'), 'MKanban needs a nonempty label.')
  },
  swift(node, context) {
    const { emit, indent } = context,
      props = node.props,
      pad = ' '.repeat(indent),
      cols = props.columns,
      rows = props.value,
      slot = slotOf(node, 'card')
    const args = [
      `label: ${emit.value(props.label)}`,
      `columns: ${emit.expr(cols.expr)}`,
      `cards: ${emit.expr(rows.expr)}`,
      'columnID: { $0.id }',
      'columnTitle: { $0.title }',
      `columnLimit: { ${field(cols.has, 'limit', 'nil')} }`,
      'cardID: { $0.id }',
      'cardColumn: { $0.column }',
      'cardTitle: { $0.title }',
      `cardDescription: { ${field(rows.has, 'description', '""')} }`,
      `cardDisabled: { ${field(rows.has, 'disabled', 'false')} }`,
      'setColumn: { card, column in var updated = card; updated.column = column; return updated }',
    ]
    if (props.onChange) args.push(`onChange: ${emit.handler(props.onChange, indent + 4)}`)
    if (props.onMove)
      args.push(
        `onMove: { move in (${emit.handler(props.onMove, indent + 4)})(${swiftRecord(emit, 'KanbanMove', { id: 'move.id', from: 'move.from', to: 'move.to', before: 'move.before' })}) }`,
      )
    args.push(...named(props, emit, ['query', 'disabled', 'animated', 'draggable', ...labels]))
    const params = slot
      ? slot.params.map((param, index) =>
          param.unused ? (index ? 'mavisColumn' : 'mavisCard') : param.name,
        )
      : ['mavisCard', 'mavisColumn']
    args.push(
      `card: { (${params[0]}: ${rows.record}, ${params[1]}: ${cols.record}) in\n${slot ? content(slot.body, context) : `${pad}        MavisKanbanDefault()`}\n${pad}    }`,
    )
    return `${pad}MavisKanban(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})${props.id ? `\n${pad}    .mavisIdentifier(${emit.value(props.id)})` : ''}`
  },
  swiftRuntime: ({ theme, font }) => `${kanbanPolicy}

struct MavisKanbanKeyed<Value>: Identifiable { let id: String; let index: Int; let value: Value }
struct MavisKanbanDefault: View { var body: some View { EmptyView() } }
struct MavisKanbanBounds: PreferenceKey {
    static var defaultValue: [String: CGRect] { [:] }
    static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) { value.merge(nextValue(), uniquingKeysWith: { _, next in next }) }
}
struct MavisKanbanDrop: Equatable { let column: String; let before: String? }

@MainActor final class MavisKanbanDrags: ObservableObject {
    @Published var models: [String: JoltDropZones] = [:]
    @Published var preview: MavisKanbanDrop?
    var frames: [String: CGRect] = [:]
    var snapshot: [String: CGRect] = [:]
    var columns: [MavisKanbanColumnData] = []
    var cards: [MavisKanbanCardData] = []
    var visible: Set<String> = []
    var active: String?
    var commit: (String, String, String?) -> Void = { _, _, _ in }

    func stop() {
        for model in models.values { model.dispose() }
        models = [:]
        active = nil
        snapshot = [:]
        preview = nil
    }
    func configure(_ columns: [MavisKanbanColumnData], cards: [MavisKanbanCardData], visible: Set<String>, enabled: Bool, commit: @escaping (String, String, String?) -> Void) {
        stop()
        self.columns = columns; self.cards = cards; self.visible = visible; self.commit = commit
        guard enabled, mavisKanbanValid(columns, cards) else { return }
        var next: [String: JoltDropZones] = [:]
        for card in cards where !card.disabled && visible.contains(card.id) {
            let id = card.id
            let targets = columns.enumerated().map { index, column in
                JoltDropTarget("c\\(index)", label: column.title, padding: try! JoltDropPadding(bottom: 60), accepts: { [weak self] in self?.drop(id, column.id) != nil })
            }
            next[id] = try? JoltDropZones(targets, onDrop: { [weak self] event in
                guard let self, let index = Int(event.id.dropFirst()), self.columns.indices.contains(index), let drop = self.drop(id, self.columns[index].id) else { return nil }
                self.preview = nil
                self.commit(id, drop.column, drop.before)
                self.models[id]?.cancel()
                return nil
            })
        }
        models = next
        report(frames, force: true)
    }
    func report(_ next: [String: CGRect], force: Bool = false) {
        guard force || frames != next else { return }
        frames = next
        for model in models.values {
            for index in columns.indices { try? model.targetBounds("c\\(index)", next["c\\(index)"]) }
        }
    }
    func begin(_ id: String) {
        if active != id { snapshot = frames; active = id }
    }
    func drop(_ id: String, _ column: String) -> MavisKanbanDrop? {
        guard let model = models[id], let source = (snapshot["i:" + id] ?? frames["i:" + id]) else { return nil }
        let center = source.midY + model.offset.height
        let before = cards.filter { $0.column == column && $0.id != id && visible.contains($0.id) }
            .compactMap { item -> (String, CGRect)? in (snapshot["i:" + item.id] ?? frames["i:" + item.id]).map { (item.id, $0) } }
            .sorted { $0.1.midY < $1.1.midY }
            .first { center < $0.1.midY }?.0
        guard mavisKanbanMove(columns, cards, id: id, to: column, before: before) != nil else { return nil }
        return MavisKanbanDrop(column: column, before: before)
    }
    func moved(_ id: String) {
        guard let model = models[id] else { return }
        if !model.dragging { if active == id { active = nil; preview = nil }; return }
        begin(id)
        let index = model.hovered.flatMap { Int($0.dropFirst()) }
        let next = index.flatMap { columns.indices.contains($0) ? drop(id, columns[$0].id) : nil }
        if preview != next { preview = next }
    }
}

private struct MavisKanbanDrag: ViewModifier {
    let id: String
    @ObservedObject var model: JoltDropZones
    @ObservedObject var owner: MavisKanbanDrags
    func body(content: Content) -> some View {
        content.joltDropSource(model)
            .onChange(of: model.dragging) { _, _ in owner.moved(id) }
            .onChange(of: model.hovered) { _, _ in owner.moved(id) }
            .onChange(of: model.offset) { _, _ in owner.moved(id) }
    }
}

struct MavisKanban<Item: Equatable, Column: Equatable, Content: View>: View {
    let label: String
    let columns: [Column]
    let cards: [Item]
    let columnID: (Column) -> String
    let columnTitle: (Column) -> String
    let columnLimit: (Column) -> Double?
    let cardID: (Item) -> String
    let cardColumn: (Item) -> String
    let cardTitle: (Item) -> String
    let cardDescription: (Item) -> String
    let cardDisabled: (Item) -> Bool
    let setColumn: (Item, String) -> Item
    var onChange: ([Item]) -> Void = { _ in }
    var onMove: (MavisKanbanMove) -> Void = { _ in }
    var query = ""
    var disabled = false
    var animated = true
    var draggable = true
    var moveLabel = "Move card"
    var upLabel = "Move up"
    var downLabel = "Move down"
    var emptyLabel = "No cards"
    var fullLabel = "Column full"
    @ViewBuilder var card: (Item, Column) -> Content
    @StateObject private var drag = MavisKanbanDrags()
    @FocusState private var focused: String?
    private var columnData: [MavisKanbanColumnData] { columns.map { MavisKanbanColumnData(id: columnID($0), title: columnTitle($0), limit: columnLimit($0)) } }
    private var cardData: [MavisKanbanCardData] { cards.map { MavisKanbanCardData(id: cardID($0), column: cardColumn($0), title: cardTitle($0), disabled: cardDisabled($0)) } }
    private var visible: [Item] {
        let needle = mavisTrim(query).lowercased()
        return needle.isEmpty ? cards : cards.filter { (cardTitle($0) + " " + cardDescription($0)).lowercased().contains(needle) }
    }
    private func commit(_ id: String, _ column: String, _ before: String?) {
        guard !disabled, let result = mavisKanbanMove(columnData, cardData, id: id, to: column, before: before) else { return }
        let byID = Dictionary(uniqueKeysWithValues: cards.map { (cardID($0), $0) })
        let updated = result.order.compactMap { key -> Item? in byID[key].map { key == id ? setColumn($0, column) : $0 } }
        onChange(updated)
        onMove(result.move)
        focused = id
    }
    private func configure() { drag.configure(columnData, cards: cardData, visible: Set(visible.map(cardID)), enabled: !disabled && draggable, commit: commit) }
    private func move(_ item: Item, _ direction: String) {
        let current = cardColumn(item), id = cardID(item), list = visible.filter { cardColumn($0) == current }
        guard let index = list.firstIndex(where: { cardID($0) == id }), let column = columns.firstIndex(where: { columnID($0) == current }) else { return }
        if direction == "up", index > 0 { commit(id, current, cardID(list[index - 1])) }
        if direction == "down", index + 1 < list.count { commit(id, current, index + 2 < list.count ? cardID(list[index + 2]) : nil) }
        let next = column + (direction == "left" ? -1 : 1)
        if ["left", "right"].contains(direction), columns.indices.contains(next) { commit(id, columnID(columns[next]), nil) }
    }
    @ViewBuilder private func content(_ item: Item, _ column: Column, _ index: Int, _ total: Int) -> some View {
        let id = cardID(item), title = cardTitle(item)
        VStack(alignment: .leading, spacing: ${theme.space.sm}) {
            if Content.self == MavisKanbanDefault.self {
                Text(verbatim: title).font(${font('heading')}).foregroundStyle(MavisTokens.text)
                if !cardDescription(item).isEmpty { Text(verbatim: cardDescription(item)).font(${font('caption')}).foregroundStyle(MavisTokens.muted) }
            } else { card(item, column) }
            HStack(spacing: ${theme.space.xs}) {
                if let model = drag.models[id] {
                    MavisIcon("grip-vertical", size: 18).frame(width: 32, height: 32).contentShape(Rectangle()).joltDropHandle(model).accessibilityLabel(Text(verbatim: moveLabel + ": " + title))
                }
                Menu(moveLabel) {
                    ForEach(columns.enumerated().map { MavisKanbanKeyed(id: columnID($0.element), index: $0.offset, value: $0.element) }) { entry in
                        let target = entry.value
                        if columnID(target) != cardColumn(item) {
                            Button(columnTitle(target)) { commit(id, columnID(target), nil) }
                                .disabled(disabled || mavisKanbanMove(columnData, cardData, id: id, to: columnID(target)) == nil)
                        }
                    }
                }.disabled(disabled || cardDisabled(item)).accessibilityLabel(Text(verbatim: moveLabel + ": " + title))
                Button { move(item, "up") } label: { MavisIcon("chevron-up", size: 18) }.buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm)).disabled(disabled || cardDisabled(item) || index == 0).accessibilityLabel(Text(verbatim: upLabel + ": " + title))
                Button { move(item, "down") } label: { MavisIcon("chevron-down", size: 18) }.buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm)).disabled(disabled || cardDisabled(item) || index + 1 == total).accessibilityLabel(Text(verbatim: downLabel + ": " + title))
            }
        }
        .padding(${theme.space.md})
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
        .focusable(!disabled && !cardDisabled(item), interactions: .edit)
        .focused($focused, equals: id)
        .onKeyPress(.upArrow) { move(item, "up"); return .handled }
        .onKeyPress(.downArrow) { move(item, "down"); return .handled }
        .onKeyPress(.leftArrow) { move(item, "left"); return .handled }
        .onKeyPress(.rightArrow) { move(item, "right"); return .handled }
        .background(GeometryReader { proxy in Color.clear.preference(key: MavisKanbanBounds.self, value: ["i:" + id: proxy.frame(in: .global)]) })
    }
    @ViewBuilder private func row(_ item: Item, _ column: Column, _ index: Int, _ total: Int) -> some View {
        if let model = drag.models[cardID(item)] { content(item, column, index, total).modifier(MavisKanbanDrag(id: cardID(item), model: model, owner: drag)) }
        else { content(item, column, index, total) }
    }
    @ViewBuilder private func gap(_ column: String, _ before: String?) -> some View {
        if drag.preview == MavisKanbanDrop(column: column, before: before) {
            RoundedRectangle(cornerRadius: ${theme.radius.md}).fill(MavisTokens.primary).opacity(0.2).frame(height: 40).accessibilityHidden(true)
        }
    }
    var body: some View {
        let _ = precondition(mavisKanbanValid(columnData, cardData), "Invalid Kanban columns or cards.")
        VStack(alignment: .leading, spacing: ${theme.space.md}) {
            Text(verbatim: label).font(${font('heading')}).foregroundStyle(MavisTokens.text)
            MavisStack(spacing: ${theme.space.md}, breakpoints: [MavisBreakpoint(at: 760, axis: .horizontal)]) {
                ForEach(columns.enumerated().map { MavisKanbanKeyed(id: columnID($0.element), index: $0.offset, value: $0.element) }) { entry in
                    let columnIndex = entry.index, column = entry.value
                    let id = columnID(column), list = visible.filter { cardColumn($0) == id }, all = cards.filter { cardColumn($0) == id }
                    VStack(alignment: .leading, spacing: ${theme.space.sm}) {
                        Text(verbatim: columnTitle(column) + " · " + mavisString(Double(all.count)) + (columnLimit(column).map { " / " + mavisString($0) } ?? "")).font(${font('heading')}).foregroundStyle(MavisTokens.text)
                        if let limit = columnLimit(column), Double(all.count) >= limit { Text(verbatim: fullLabel).font(${font('caption')}).foregroundStyle(MavisTokens.muted) }
                        ForEach(list.enumerated().map { MavisKanbanKeyed(id: cardID($0.element), index: $0.offset, value: $0.element) }) { entry in gap(id, entry.id); row(entry.value, column, entry.index, list.count) }
                        gap(id, nil)
                        if list.isEmpty { Text(verbatim: emptyLabel).font(${font('caption')}).foregroundStyle(MavisTokens.muted) }
                    }
                    .padding(${theme.space.sm})
                    .frame(maxWidth: .infinity, minHeight: 180, alignment: .topLeading)
                    .background(MavisTokens.elevated, in: RoundedRectangle(cornerRadius: ${theme.radius.lg}))
                    .background(GeometryReader { proxy in Color.clear.preference(key: MavisKanbanBounds.self, value: ["c\\(columnIndex)": proxy.frame(in: .global)]) })
                    .mavisItem(grow: 1)
                    .joltLayout(value: list.map(cardID), transition: animated ? .spring(.snappy) : (try! JoltTransition.tween(milliseconds: 0)))
                }
            }
        }
        .onPreferenceChange(MavisKanbanBounds.self) { drag.report($0) }
        .onAppear { configure() }
        .onChange(of: columns) { _, _ in configure() }
        .onChange(of: cards) { _, _ in configure() }
        .onChange(of: query) { _, _ in configure() }
        .onChange(of: disabled) { _, _ in configure() }
        .onChange(of: draggable) { _, _ in configure() }
        .onDisappear { drag.stop() }
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['KanbanColumn', 'KanbanCard', 'KanbanMove'],
    attribute(name, value) {
      // Original Vue keeps null; generated TSX handlers use the model's missing value.
      if (name === 'onMove' && value.params.some((param) => !param.unused))
        return `@move="${expression(`(move) => (${handlerJs(value)})({ ...move, before: move.before ?? undefined })`)}"`
    },
  },
}
