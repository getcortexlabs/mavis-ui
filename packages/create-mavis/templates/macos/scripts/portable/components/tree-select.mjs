import { flexRuntime } from './flex.mjs'
import {
  choiceRuntime,
  strings,
  stringsEvent,
  swiftArguments,
  swiftCall,
  vueTypes,
} from './choices.mjs'

const labels = [
  'placeholder',
  'searchLabel',
  'clearLabel',
  'emptyLabel',
  'expandLabel',
  'collapseLabel',
]

const nodes = ({ value, ctx, expr, record, T }) => ({
  expr: expr(value, ctx, T.array(record('TreeSelectNode'))),
})

// treeSelectProps: a choice among nodes that have nodes inside them. value is the chosen ids,
// one at most unless multiple, and expanded the ids of the nodes that show their children; both
// belong to the source. The button names what is chosen and opens the tree, with a search that
// shows every match and the nodes above it.
export const MTreeSelect = {
  props: {
    id: 'string',
    label: 'string',
    nodes,
    value: strings,
    onChange: stringsEvent,
    expanded: strings,
    onExpandedChange: stringsEvent,
    multiple: 'boolean',
    disabled: 'boolean',
    animated: 'boolean',
    ...Object.fromEntries(labels.map((key) => [key, 'string'])),
  },
  required: ['label', 'nodes', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, choiceRuntime],
  types: () => `/** A node of MTreeSelect: disabled also turns off the nodes inside it. */
type TreeSelectNode = { id: string; label: string; disabled?: boolean; selectable?: boolean; children?: TreeSelectNode[] }
${vueTypes(['TreeSelectNode'])}`,
  records: { TreeSelectNode: 'the Mavis tree node type' },
  declaration: `declare function MTreeSelect(props: { id?: string; label: string; nodes: readonly TreeSelectNode[]; value: readonly string[]; onChange: (value: string[]) => void; expanded?: readonly string[]; onExpandedChange?: (expanded: string[]) => void; multiple?: boolean; disabled?: boolean; animated?: boolean; ${labels.map((key) => `${key}?: string`).join('; ')} }): JSX.Element`,
  check({ props, attrs, tag, fail }) {
    if (Boolean(props.expanded) !== Boolean(props.onExpandedChange))
      fail(
        attrs.get('expanded') ?? attrs.get('onExpandedChange') ?? tag,
        'expanded belongs to the source: pass it with onExpandedChange, which asks for the next list.',
      )
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent + 4)
    const tree = [
      `nodes: { () -> [MavisTreeNode] in`,
      `${pad}    func mavisTree(_ nodes: [TreeSelectNode]) -> [MavisTreeNode] {`,
      `${pad}        nodes.map { MavisTreeNode(id: $0.id, label: $0.label, disabled: $0.disabled ?? false, selectable: $0.selectable ?? true, children: mavisTree($0.children ?? [])) }`,
      `${pad}    }`,
      `${pad}    return mavisTree(${emit.expr(node.props.nodes.expr)})`,
      `${pad}}()`,
    ].join('\n')
    const [label, ...rest] = swiftArguments(node, context, [
      ['label'],
      ['value', 'values'],
      ['onChange'],
      ['expanded'],
      ['onExpandedChange'],
      ['multiple'],
      ['disabled'],
      ['animated'],
      ...labels.map((key) => [key]),
    ])
    return [
      swiftCall('MavisTreeSelect', [label, tree, ...rest], indent),
      ...(node.props.id
        ? [`${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(node.props.id)})`]
        : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// A node of MTreeSelect, without the shared record type so every project can use it.
struct MavisTreeNode: Hashable {
    let id: String
    let label: String
    let disabled: Bool
    let selectable: Bool
    let children: [MavisTreeNode]
}

/// One node on its line: treeSelectRows in the Mavis core.
private struct MavisTreeRow: Identifiable {
    let node: MavisTreeNode
    let depth: Int
    let ancestors: [String]
    let disabled: Bool
    var id: String { node.id }
}

/// MTreeSelect: a button named by what is chosen, and the tree under it: a search, each node on
/// its line with the button that expands it, a checkbox when several can be chosen or a button
/// when one can, and a button that clears the choice. The chosen and the expanded ids belong to
/// the source. Jolt moves the lines as nodes expand; Reduce Motion puts them in place.
struct MavisTreeSelect: View {
    let label: String
    let nodes: [MavisTreeNode]
    let values: [String]
    let onChange: ([String]) -> Void
    var expanded: [String] = []
    var onExpandedChange: ([String]) -> Void = { _ in }
    var multiple = false
    var disabled = false
    var animated = true
    var placeholder = "Choose items"
    var searchLabel = "Search"
    var clearLabel = "Clear selection"
    var emptyLabel = "No matches"
    var expandLabel = "Expand"
    var collapseLabel = "Collapse"
    @State private var open = false
    @State private var query = ""
    @FocusState private var focus: String?

    private var rows: [MavisTreeRow] {
        var found: [MavisTreeRow] = []
        func visit(_ items: [MavisTreeNode], _ ancestors: [String], _ disabled: Bool) {
            for node in items {
                let unavailable = disabled || node.disabled
                found.append(MavisTreeRow(node: node, depth: ancestors.count, ancestors: ancestors, disabled: unavailable))
                visit(node.children, ancestors + [node.id], unavailable)
            }
        }
        visit(nodes, [], false)
        return found
    }

    /// visibleTreeSelection in the Mavis core: the nodes whose ancestors are expanded, or with a
    /// search every match and the nodes above it.
    private func visible(_ rows: [MavisTreeRow]) -> [MavisTreeRow] {
        let text = mavisTrim(query).lowercased()
        guard !text.isEmpty else {
            return rows.filter { row in row.ancestors.allSatisfy { expanded.contains($0) } }
        }
        var shown = Set<String>()
        for row in rows where row.node.label.lowercased().contains(text) {
            shown.insert(row.node.id)
            shown.formUnion(row.ancestors)
        }
        return rows.filter { shown.contains($0.node.id) }
    }

    private func mutable(_ row: MavisTreeRow) -> Bool { !row.disabled && row.node.selectable }

    /// toggleTreeSelection in the Mavis core.
    private func choose(_ row: MavisTreeRow) {
        guard !disabled else { return }
        if !mutable(row) {
            onChange(values)
        } else if !multiple {
            onChange([row.node.id])
        } else if values.contains(row.node.id) {
            onChange(values.filter { $0 != row.node.id })
        } else {
            onChange(values + [row.node.id])
        }
        if !multiple { open = false }
    }

    private func toggle(_ id: String) {
        guard !disabled else { return }
        onExpandedChange(expanded.contains(id) ? expanded.filter { $0 != id } : expanded + [id])
    }

    @ViewBuilder private func line(_ row: MavisTreeRow) -> some View {
        let shows = !query.isEmpty || expanded.contains(row.node.id)
        let chosen = values.contains(row.node.id)
        HStack(spacing: ${theme.space.xs}) {
            if row.node.children.isEmpty {
                Rectangle().fill(.clear).frame(width: 24, height: 1).accessibilityHidden(true)
            } else {
                Button(action: { toggle(row.node.id) }) {
                    Text(verbatim: shows ? "−" : "+")
                }
                .buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm))
                .fixedSize()
                .disabled(disabled || !query.isEmpty)
                .accessibilityLabel(Text(verbatim: (shows ? collapseLabel : expandLabel) + ": " + row.node.label))
            }
            if multiple {
                MavisCheckbox(label: row.node.label, checked: chosen, onChange: { _ in choose(row) }, disabled: disabled || !mutable(row))
            } else {
                Button(action: { choose(row) }) {
                    Text(verbatim: row.node.label)
                }
                .buttonStyle(MavisButtonStyle(variant: chosen ? .secondary : .ghost))
                .fixedSize()
                .disabled(disabled || !mutable(row))
                .accessibilityAddTraits(chosen ? .isSelected : [])
            }
        }
        // The Web indents a level by a box of 16 and the row's gap.
        .padding(.leading, row.depth > 0 ? Double(row.depth) * 16 + ${theme.space.xs} : 0)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    var body: some View {
        let rows = rows
        let shown = visible(rows)
        let names = values.map { id in rows.first { $0.node.id == id }?.node.label ?? id }
        MavisColumn(spacing: ${theme.space.sm}) {
            Text(verbatim: label)
                .font(.system(size: ${theme.typography.body.fontSize}, weight: .semibold))
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
            Button(action: { open.toggle() }) {
                Text(verbatim: names.isEmpty ? placeholder : names.joined(separator: ", "))
            }
            .buttonStyle(MavisButtonStyle(variant: .secondary))
            .disabled(disabled)
            .mavisItem(align: .start)
            MavisSelectionPanel(title: label, open: open && !disabled) {
                MavisColumn(spacing: ${theme.space.sm}) {
                    MavisTextInput(label: searchLabel, value: query, onChange: { query = $0 }, focus: $focus, focusKey: "search", disabled: disabled)
                    ForEach(shown) { row in line(row) }
                    if shown.isEmpty {
                        Text(verbatim: emptyLabel)
                            .font(${font('body')})
                            .foregroundStyle(MavisTokens.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Button(action: {
                        if !disabled { onChange(values.filter { id in !rows.contains { $0.node.id == id && mutable($0) } }) }
                    }) {
                        Text(verbatim: clearLabel)
                    }
                    .buttonStyle(MavisButtonStyle(variant: .ghost))
                    .disabled(disabled || !values.contains { id in rows.contains { $0.node.id == id && mutable($0) } })
                }
                // Inside the panel Jolt already watches the window: this adds only the motion.
                .joltLayout(value: animated ? [expanded, values, [query]] : [], transition: .spring(.smooth))
            }
            .frame(maxWidth: 360, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
        .onChange(of: disabled) { _, next in if next { open = false } }
    }
}`,
  vue: {
    rename: {
      value: 'modelValue',
      onChange: 'update:modelValue',
      onExpandedChange: 'update:expanded',
    },
    types: ['TreeSelectNode'],
  },
}
