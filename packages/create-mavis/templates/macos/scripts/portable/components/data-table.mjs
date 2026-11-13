import { expression, handlerJs } from '../js-text.mjs'
import { swiftString } from '../swift-text.mjs'
import { flexRuntime } from './flex.mjs'
import {
  content,
  event,
  field,
  listRuntime,
  named,
  perItem,
  records,
  slotOf,
} from './list-parts.mjs'

const columnFields = {
  key: 'string',
  label: 'string',
  sortable: 'boolean?',
  width: 'number?',
  align: 'string?',
}
const readColumns = records(
  'MDataTable',
  'columns',
  columnFields,
  '{ key: string; label: string }[]',
)

// items: the rows of the current page, records the table keys by one of their fields.
function items({ attribute, value, ctx, expr, fail }) {
  const list = expr(value, ctx)
  if (list.type.k !== 'array' || list.type.of.k !== 'record')
    fail(attribute, 'MDataTable takes a list of records, such as { id: string; name: string }[].')
  return { expr: list, record: list.type.of.name }
}

function itemKey({ attribute, value, fail, ts }) {
  if (!ts.isStringLiteral(value))
    fail(
      attribute,
      'itemKey names a field of the items, written out: itemKey="id". A function that computes the key needs shared functions, which the Mac does not have yet (#340).',
    )
  return { lit: value.text }
}

// A column's value function runs in the app's own code, which does not reach the Mac yet.
function columns(source) {
  const { attribute, value, fail, checker } = source
  const type = checker.getTypeAtLocation(value)
  const [element] = checker.isArrayType(type) ? checker.getTypeArguments(type) : []
  if (element && checker.getPropertyOfType(element, 'value'))
    fail(
      attribute,
      "A column's value function needs shared functions, which the Mac does not have yet (#340). Leave value out: a cell shows the field its column's key names, and the cell slot shows anything else.",
    )
  return readColumns(source)
}

const keyField = (props, fields) =>
  fields(props.items.record).find((each) => each.name === (props.itemKey?.lit ?? 'id'))

// What a cell shows without a cell slot: String(item[column.key] ?? '—') on the Web.
function cellText(type, read) {
  const optional = type.k === 'optional'
  const kind = (optional ? type.of : type).k
  if (kind === 'string') return optional ? `${read} ?? "—"` : read
  if (kind === 'number')
    return optional ? `${read}.map(mavisString) ?? "—"` : `mavisString(${read})`
  if (kind === 'boolean') return optional ? `${read}.map { String($0) } ?? "—"` : `String(${read})`
  return null
}

const defaulted = (pad) => `${pad}        MavisTableDefault()`

// dataTableProps: the rows of one page under a header of columns. A sortable column asks for a
// new sort, the checkboxes of a selectable table ask for a new list of selected keys, which
// keeps the keys of other pages, and both belong to the source. A cell shows the field its
// column's key names, or the cell slot.
export const MDataTable = {
  props: {
    id: 'string',
    label: 'string',
    items,
    itemKey,
    columns,
    sort: ({ value, ctx, expr, record, T }) => ({
      expr: expr(value, ctx, T.optional(record('DataSort'))),
    }),
    onSortChange: event(({ T, record }) => [T.optional(record('DataSort'))]),
    selected: ({ value, ctx, expr, T }) => ({ expr: expr(value, ctx, T.array(T.string)) }),
    onSelectedChange: event(({ T }) => [T.array(T.string)]),
    selectable: 'boolean',
    disabled: 'boolean',
    loading: 'boolean',
    rowDisabled: perItem('MDataTable', 'items', 'boolean'),
    rowLabel: perItem('MDataTable', 'items', 'string'),
    selectLabel: 'string',
    selectAllLabel: 'string',
    emptyLabel: 'string',
    loadingLabel: 'string',
  },
  required: ['label', 'items', 'columns'],
  slots: ['actions', 'cell', 'empty', 'footer'],
  scoped: {
    cell(props, { record, fields, T }) {
      const key = keyField(props, fields)
      return [
        { name: 'item', type: T.record(props.items.record) },
        { name: 'itemKey', type: key?.type ?? T.string },
        { name: 'column', type: record('DataColumn') },
        { name: 'index', type: T.number },
      ]
    },
  },
  control: true,
  uses: [flexRuntime, listRuntime],
  types: () => `/** A column of MDataTable: a cell shows the field of its row that key names. */
type DataColumn = { key: string; label: string; sortable?: boolean; width?: number; align?: 'start' | 'end' }
type DataSort = { key: string; direction: 'ascending' | 'descending' }`,
  records: {
    DataColumn: 'the Mavis data table column type',
    DataSort: 'the Mavis data table sort type',
  },
  declaration:
    "declare function MDataTable<T, S extends DataSort | null | undefined = DataSort | undefined>(props: { id?: string; label: string; items: readonly T[]; itemKey?: Extract<keyof T, string>; columns: readonly { readonly key: string; readonly label: string; readonly value?: unknown; readonly sortable?: boolean; readonly width?: number; readonly align?: 'start' | 'end' }[]; sort?: S; onSortChange?: (sort: DataSort | Extract<S, null | undefined>) => void; selected?: readonly string[]; onSelectedChange?: (selected: string[]) => void; selectable?: boolean; disabled?: boolean; loading?: boolean; rowDisabled?: (item: T) => boolean; rowLabel?: (item: T) => string; selectLabel?: string; selectAllLabel?: string; emptyLabel?: string; loadingLabel?: string; slotActions?: JSX.Element; slotCell?: (props: { item: T; itemKey: string; column: DataColumn; index: number }) => JSX.Element; slotEmpty?: JSX.Element; slotFooter?: JSX.Element }): JSX.Element",
  check({ tag, props, attrs, fail, fields }) {
    if ('lit' in props.label && !props.label.lit.trim())
      fail(attrs.get('label'), 'MDataTable needs a label that is not empty.')
    const key = keyField(props, fields)
    if (!key || key.type.k !== 'string')
      fail(
        attrs.get('itemKey') ?? tag,
        `Every row needs the key ${props.itemKey?.lit ?? 'id'}, a string: the selected keys are strings on the Mac. Name another field with itemKey.`,
      )
    props.items.key = key.name
    props.items.fields = fields(props.items.record)
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const row = props.items.record
    const key = props.items.key
    const cell = slotOf(node, 'cell')
    const { record, has } = props.columns
    // The cell slot always takes DataColumn, as on the Web: other records become one.
    const converted = cell && record !== 'DataColumn'
    const placed = converted
      ? `${emit.wrap(props.columns.expr)}.map { DataColumn(key: $0.key, label: $0.label, ${['sortable', 'width', 'align'].map((name) => `${name}: ${has[name] ? `$0.${name}` : 'nil'}`).join(', ')}) }`
      : emit.expr(props.columns.expr)
    const own =
      converted || record === 'DataColumn'
        ? { sortable: 'optional', width: 'optional', align: 'optional' }
        : has
    const texts = props.items.fields.flatMap((each) => {
      const text = cellText(each.type, `mavisRow.${each.name}`)
      return text ? [`${pad}        case ${swiftString(each.name)}: return ${text}`] : []
    })
    const args = [
      `label: ${emit.value(props.label)}`,
      `items: ${emit.expr(props.items.expr)}`,
      `key: { $0.${key} }`,
      `columns: ${placed}`,
      `column: { MavisTableColumn(key: $0.key, label: $0.label, sortable: ${field(own, 'sortable', 'false')}, width: ${own.width ? '$0.width' : 'nil'}, alignEnd: ${own.align ? `$0.align == "end"` : 'false'}) }`,
      [
        `text: { (mavisRow: ${row}, mavisKey: String) -> String in`,
        `${pad}        switch mavisKey {`,
        ...texts,
        `${pad}        default: return "—"`,
        `${pad}        }`,
        `${pad}    }`,
      ].join('\n'),
    ]
    if (props.sort) {
      const sort = emit.expr(props.sort.expr)
      args.push(
        props.sort.expr.type.k === 'optional'
          ? `sort: ${emit.wrap(props.sort.expr)}.map { MavisTableSort(key: $0.key, ascending: $0.direction == "ascending") }`
          : `sort: { MavisTableSort(key: $0.key, ascending: $0.direction == "ascending") }(${sort})`,
      )
    }
    if (props.onSortChange)
      args.push(
        [
          'onSortChange: { mavisSort in',
          `${pad}        (${emit.handler(props.onSortChange, indent + 8)})(mavisSort.map { DataSort(key: $0.key, direction: $0.ascending ? "ascending" : "descending") })`,
          `${pad}    }`,
        ].join('\n'),
      )
    if (props.selected) args.push(`selected: ${emit.expr(props.selected.expr)}`)
    if (props.onSelectedChange)
      args.push(`onSelectedChange: ${emit.handler(props.onSelectedChange, indent + 4)}`)
    args.push(...named(props, emit, ['selectable', 'disabled', 'loading']))
    if (props.rowDisabled) args.push(`rowDisabled: ${emit.closure(props.rowDisabled.expr, 'Bool')}`)
    if (props.rowLabel) args.push(`rowLabel: ${emit.closure(props.rowLabel.expr, 'String')}`)
    args.push(
      ...named(props, emit, ['selectLabel', 'selectAllLabel', 'emptyLabel', 'loadingLabel']),
    )
    const name = (index, fallback) =>
      cell && !cell.params[index].unused ? cell.params[index].name : fallback
    const item = name(0, 'mavisItem')
    const column = name(2, 'mavisColumn')
    let cells = defaulted(pad)
    if (cell) {
      // Each cell is a row of a list: fields in it take focus per row and column.
      emit.forKeys.push(`${item}.${key}`, `${column}.key`)
      cells = [
        ...(cell.params[1].unused
          ? []
          : [`${pad}        let ${cell.params[1].name} = ${item}.${key}`]),
        content(cell.body, context),
      ].join('\n')
      emit.forKeys.pop()
      emit.forKeys.pop()
    }
    const slot = (name) => {
      const filled = slotOf(node, name)
      return `${name}: {\n${filled ? content(filled.body, context) : name === 'empty' ? defaulted(pad) : `${pad}        EmptyView()`}\n${pad}    }`
    }
    args.push(
      `cell: { (${item}: ${row}, ${name(3, 'mavisIndex')}: Double, ${column}: ${cell ? 'DataColumn' : record}) in\n${cells}\n${pad}    }`,
      slot('actions'),
      slot('empty'),
      slot('footer'),
    )
    return [
      `${pad}MavisTable(`,
      args.map((arg) => `${pad}    ${arg}`).join(',\n'),
      `${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// What MDataTable reads of a column, without the shared record type so every project can use it.
struct MavisTableColumn: Hashable {
    let key: String
    let label: String
    var sortable: Bool = false
    var width: Double? = nil
    var alignEnd: Bool = false
}

/// The sort of an MDataTable: the column and the direction.
struct MavisTableSort: Equatable {
    let key: String
    let ascending: Bool
}

/// Stands for a cell or an empty state the source left to the table.
struct MavisTableDefault: View {
    var body: some View { EmptyView() }
}

private struct MavisTableRow: Identifiable {
    let id: String
    let index: Int
}

/// A checkbox of the selection column: its label names it, and it is not drawn.
private struct MavisTableCheck: View {
    let label: String
    let checked: Bool
    var mixed: Bool = false
    var disabled: Bool = false
    let onChange: (Bool) -> Void

    private var sources: [Binding<Bool>] {
        let source = Binding(get: { mixed ? false : checked }, set: { onChange($0) })
        return mixed ? [source, .constant(true)] : [source]
    }

    var body: some View {
        Toggle(sources: sources, isOn: \\.self) { Text(verbatim: label) }
            .toggleStyle(.checkbox)
            .labelsHidden()
            .mavisTint(.primary)
            .disabled(disabled)
            .mavisColorScheme()
    }
}

/// The bar a loading table shows above its rows. Jolt sweeps it; Reduce Motion leaves it still.
private struct MavisTableProgress: View {
    let label: String
    @StateObject private var shimmer = mavisTableShimmer()

    var body: some View {
        Rectangle()
            .fill(MavisTokens.primary)
            .frame(maxWidth: .infinity)
            .frame(height: 4)
            .joltShimmer(shimmer)
            .accessibilityElement()
            .accessibilityLabel(Text(verbatim: label))
    }
}

@MainActor private func mavisTableShimmer() -> JoltShimmer { try! JoltShimmer() }

/// MDataTable: the rows of one page under their columns, on the theme's surface. The sort and
/// the selected keys belong to the source: a sortable header asks for the next sort as
/// nextDataSort in the Mavis core decides it, and a checkbox for a new list of keys as selectPage
/// does, keeping the keys of other pages. Columns share the width of the table and scroll
/// sideways when they do not fit. Jolt moves the rows when the page changes.
struct MavisTable<Item, Column, Cell: View, Actions: View, Empty: View, Footer: View>: View {
    let label: String
    let items: [Item]
    let key: (Item) -> String
    let columns: [Column]
    let column: (Column) -> MavisTableColumn
    let text: (Item, String) -> String
    var sort: MavisTableSort? = nil
    var onSortChange: (MavisTableSort?) -> Void = { _ in }
    var selected: [String] = []
    var onSelectedChange: ([String]) -> Void = { _ in }
    var selectable: Bool = false
    var disabled: Bool = false
    var loading: Bool = false
    var rowDisabled: (Item) -> Bool = { _ in false }
    var rowLabel: ((Item) -> String)? = nil
    var selectLabel: String = "Select"
    var selectAllLabel: String = "Select this page"
    var emptyLabel: String = "No results"
    var loadingLabel: String = "Loading results"
    @ViewBuilder var cell: (Item, Double, Column) -> Cell
    @ViewBuilder var actions: () -> Actions
    @ViewBuilder var empty: () -> Empty
    @ViewBuilder var footer: () -> Footer
    @State private var width: Double = -1

    private var locked: Bool { disabled || loading }
    private var page: [String] { items.filter { !rowDisabled($0) }.map(key) }

    /// selectPage in the Mavis core.
    private func select(_ keys: [String], _ checked: Bool) {
        guard !locked else { return }
        let rest = selected.filter { !keys.contains($0) }
        onSelectedChange(checked ? rest + keys : rest)
    }

    /// nextDataSort in the Mavis core: ascending, descending, then no sort.
    private func sort(by key: String) {
        guard !locked else { return }
        if sort?.key != key {
            onSortChange(MavisTableSort(key: key, ascending: true))
        } else {
            onSortChange(sort?.ascending == true ? MavisTableSort(key: key, ascending: false) : nil)
        }
    }

    /// The width of each column with the padding of its cells: its own width or 144, and a
    /// share of what the table has left, as a table that fills its container on the Web.
    private func widths(_ shown: [MavisTableColumn]) -> [Double] {
        var each = shown.map { ($0.width ?? 144) + ${theme.space.md * 2} }
        let spare = width - (selectable ? 64 + ${theme.space.md * 2} : 0) - each.reduce(0, +)
        if spare > 0 {
            let open = each.indices.filter { shown[$0].width == nil }
            let growing = open.isEmpty ? Array(each.indices) : open
            for index in growing { each[index] += spare / Double(growing.count) }
        }
        return each
    }

    private func place<Content: View>(_ width: Double, end: Bool = false, @ViewBuilder _ content: () -> Content) -> some View {
        content()
            .padding(.horizontal, ${theme.space.md})
            .padding(.vertical, 12)
            .frame(width: width, alignment: end ? .trailing : .leading)
    }

    private func heading(_ column: MavisTableColumn) -> some View {
        Group {
            if column.sortable {
                Button(action: { sort(by: column.key) }) {
                    HStack(spacing: 8) {
                        MavisIcon(sort?.key != column.key ? "arrow-up-down" : sort?.ascending == true ? "arrow-up" : "arrow-down", size: 20)
                        Text(verbatim: column.label)
                    }
                }
                .buttonStyle(MavisButtonStyle(variant: .ghost))
                .fixedSize()
                .disabled(locked)
                .accessibilityLabel(Text(verbatim: column.label))
            } else {
                Text(verbatim: column.label)
                    .font(${font('caption')}.weight(.semibold))
                    .foregroundStyle(MavisTokens.text)
                    .multilineTextAlignment(column.alignEnd ? .trailing : .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func line<Content: View>(last: Bool, selected: Bool = false, @ViewBuilder _ content: () -> Content) -> some View {
        HStack(alignment: .center, spacing: 0) { content() }
            .background(selected ? MavisTokens.primarySoft : MavisColor.clear)
            .overlay(alignment: .bottom) {
                if !last {
                    Rectangle()
                        .fill(MavisTokens.border)
                        .frame(height: 1)
                        .accessibilityHidden(true)
                }
            }
    }

    private func table(_ shown: [MavisTableColumn]) -> some View {
        let sizes = widths(shown)
        let available = page
        let count = available.filter { selected.contains($0) }.count
        return VStack(alignment: .leading, spacing: 0) {
            line(last: false) {
                if selectable {
                    place(64 + ${theme.space.md * 2}) {
                        MavisTableCheck(label: selectAllLabel, checked: count > 0 && count == available.count, mixed: count > 0 && count < available.count, disabled: locked || available.isEmpty) { select(available, $0) }
                    }
                }
                ForEach(shown.indices, id: \\.self) { index in
                    place(sizes[index], end: shown[index].alignEnd) { heading(shown[index]) }
                }
            }
            ForEach(items.indices.map { MavisTableRow(id: key(items[$0]), index: $0) }) { row in
                let item = items[row.index]
                line(last: row.index == items.count - 1, selected: selected.contains(row.id)) {
                    if selectable {
                        place(64 + ${theme.space.md * 2}) {
                            MavisTableCheck(label: selectLabel + " " + (rowLabel?(item) ?? row.id), checked: selected.contains(row.id), disabled: locked || rowDisabled(item)) { checked in
                                if !rowDisabled(item) { select([row.id], checked) }
                            }
                        }
                    }
                    ForEach(shown.indices, id: \\.self) { index in
                        place(sizes[index], end: shown[index].alignEnd) {
                            if Cell.self == MavisTableDefault.self {
                                Text(verbatim: text(item, shown[index].key))
                                    .font(${font('body')})
                                    .foregroundStyle(MavisTokens.text)
                                    .multilineTextAlignment(shown[index].alignEnd ? .trailing : .leading)
                                    .fixedSize(horizontal: false, vertical: true)
                            } else {
                                MavisColumn { cell(item, Double(row.index), columns[index]) }
                                    .accessibilityElement(children: .contain)
                            }
                        }
                    }
                }
            }
        }
        .joltLayout(value: items.map(key), transition: .spring(.smooth))
    }

    var body: some View {
        let shown = columns.map(column)
        MavisColumn(spacing: ${theme.space.md}) {
            MavisRow(spacing: ${theme.space.md}, justify: .between, wrap: true) {
                Text(verbatim: label)
                    .font(${font('heading')})
                    .foregroundStyle(MavisTokens.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityHeading(.h2)
                actions()
            }
            MavisColumn {
                if loading {
                    MavisTableProgress(label: loadingLabel)
                }
                ScrollView(.horizontal) { table(shown) }
                if items.isEmpty {
                    if Empty.self == MavisTableDefault.self {
                        Text(verbatim: loading ? loadingLabel : emptyLabel)
                            .font(${font('body')})
                            .foregroundStyle(MavisTokens.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(${theme.space.lg})
                    } else {
                        MavisColumn { empty() }
                    }
                }
            }
            .background(MavisTokens.surface)
            .clipShape(RoundedRectangle(cornerRadius: ${theme.radius.lg}))
            .background(GeometryReader { proxy in
                Color.clear
                    .onAppear { width = proxy.size.width }
                    .onChange(of: proxy.size.width) { _, next in width = next }
            })
            footer()
        }
    }
}`,
  vue: {
    rename: { onSortChange: 'update:sort', onSelectedChange: 'update:selected' },
    types: ['DataColumn', 'DataSort'],
    attribute(name, value) {
      // MDataTable reports null for no sort; the source reads undefined.
      if (name === 'onSortChange' && value.params.some((param) => !param.unused))
        return `@update:sort="${expression(`(sort) => (${handlerJs(value)})(sort ?? undefined)`)}"`
    },
  },
}
