import { flexRuntime } from './flex.mjs'
import { event, listRuntime, named } from './list-parts.mjs'

const keys = ({ value, ctx, expr, T }) => ({ expr: expr(value, ctx, T.array(T.string)) })

// The nodes hold their own children, so they are the Mavis type itself: onLoad hands one back.
function nodes({ attribute, value, ctx, expr, fail, record }) {
  const list = expr(value, ctx)
  record('TreeNode')
  if (list.type.k !== 'array' || list.type.of.k !== 'record' || list.type.of.name !== 'TreeNode')
    fail(
      attribute,
      'MTreeView takes nodes of the Mavis type TreeNode: { key: string; label: string; disabled?: boolean; children?: TreeNode[]; hasChildren?: boolean }[].',
    )
  return { expr: list }
}

// treeViewProps: nodes under a heading, each a row with its label and, for a branch, the arrow
// that opens it. value is the selected key and expanded the open branches; both belong to the
// source, as v-model and v-model:expanded on the Web and NativeScript. A branch whose children
// are not loaded yet (hasChildren without children) asks for them with onLoad when it opens,
// and loadingKeys names the branches the source is loading.
export const MTreeView = {
  props: {
    id: 'string',
    label: 'string',
    nodes,
    value: 'optional-string',
    onChange: 'string-handler',
    expanded: keys,
    onExpandedChange: event(({ T }) => [T.array(T.string)]),
    loadingKeys: keys,
    onLoad: event(({ record }) => [record('TreeNode')]),
    disabled: 'boolean',
    emptyLabel: 'string',
    loadingLabel: 'string',
    expandedLabel: 'string',
    collapsedLabel: 'string',
  },
  required: ['label', 'nodes'],
  control: true,
  uses: [flexRuntime, listRuntime],
  types: () =>
    '/** A node of MTreeView. hasChildren without children asks for them when the branch opens. */\ntype TreeNode = { key: string; label: string; disabled?: boolean; children?: TreeNode[]; hasChildren?: boolean }',
  records: { TreeNode: 'the Mavis tree node type' },
  declaration:
    'declare function MTreeView(props: { id?: string; label: string; nodes: readonly TreeNode[]; value?: string | null; onChange?: (key: string) => void; expanded?: readonly string[]; onExpandedChange?: (keys: string[]) => void; loadingKeys?: readonly string[]; onLoad?: (node: TreeNode) => void; disabled?: boolean; emptyLabel?: string; loadingLabel?: string; expandedLabel?: string; collapsedLabel?: string }): JSX.Element',
  check({ props, attrs, fail }) {
    for (const key of ['label', 'expandedLabel', 'collapsedLabel'])
      if (props[key] && 'lit' in props[key] && !props[key].lit.trim())
        fail(attrs.get(key), `MTreeView needs a ${key} that is not empty.`)
  },
  swift(node, { emit, indent }) {
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      `label: ${emit.value(props.label)}`,
      `nodes: ${emit.expr(props.nodes.expr)}`,
      'entry: { MavisTreeEntry(key: $0.key, label: $0.label, disabled: $0.disabled ?? false, hasChildren: $0.hasChildren ?? false) }',
      'children: { $0.children }',
      ...(props.value ? [`selected: ${emit.expr(props.value.expr)}`] : []),
      ...(props.onChange ? [`onChange: ${emit.handler(props.onChange, indent + 4)}`] : []),
      ...(props.expanded ? [`expanded: ${emit.expr(props.expanded.expr)}`] : []),
      ...(props.onExpandedChange
        ? [`onExpandedChange: ${emit.handler(props.onExpandedChange, indent + 4)}`]
        : []),
      ...(props.loadingKeys ? [`loadingKeys: ${emit.expr(props.loadingKeys.expr)}`] : []),
      ...(props.onLoad ? [`onLoad: ${emit.handler(props.onLoad, indent + 4)}`] : []),
      ...named(props, emit, [
        'disabled',
        'emptyLabel',
        'loadingLabel',
        'expandedLabel',
        'collapsedLabel',
      ]),
    ]
    return [
      `${pad}MavisTree(`,
      args.map((arg) => `${pad}    ${arg}`).join(',\n'),
      `${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// What MTreeView reads of a node, without the shared record type so every project can use it.
struct MavisTreeEntry: Hashable {
    let key: String
    let label: String
    var disabled: Bool = false
    var hasChildren: Bool = false
}

/// A node with its children, as the rows draw it. loaded is false for a branch whose children
/// the source has not given yet.
struct MavisTreeNode: Hashable {
    let entry: MavisTreeEntry
    let children: [MavisTreeNode]
    let loaded: Bool

    init<Node>(_ node: Node, entry: (Node) -> MavisTreeEntry, children: (Node) -> [Node]?, depth: Int = 1) {
        let own = children(node)
        self.entry = entry(node)
        self.loaded = own != nil
        self.children = depth >= 100 ? [] : (own ?? []).map { MavisTreeNode($0, entry: entry, children: children, depth: depth + 1) }
    }

    /// treeBranch in the Mavis core.
    var branch: Bool { loaded ? !children.isEmpty : entry.hasChildren }
}

/// A row in view, as treeEntries in the Mavis core lists them: in order, with its parent.
private struct MavisTreeRow {
    let node: MavisTreeNode
    let parent: String?
}

/// What every row of an MTreeView reads and asks.
private struct MavisTreeContext {
    let selected: String?
    let expanded: [String]
    let loading: [String]
    let disabled: Bool
    let cursor: String?
    let focused: Bool
    let loadingLabel: String
    let expandedLabel: String
    let collapsedLabel: String
    let select: (MavisTreeNode) -> Void
    let toggle: (MavisTreeNode) -> Void
}

/// The nodes of one level, and under each open branch its own level, indented.
private struct MavisTreeLevel: View {
    let nodes: [MavisTreeNode]
    let context: MavisTreeContext

    private static var opened: JoltPose { try! JoltPose(rotate: 90) }

    private func row(_ node: MavisTreeNode) -> some View {
        let key = node.entry.key
        let open = context.expanded.contains(key)
        let selected = context.selected == key
        let busy = context.loading.contains(key)
        let unavailable = context.disabled || node.entry.disabled
        return HStack(spacing: ${theme.space.xs}) {
            if node.branch {
                Button(action: { context.toggle(node) }) {
                    MavisIcon("chevron-right", size: 18)
                        .joltMotion(to: open ? Self.opened : .identity, transition: .spring(.snappy))
                }
                .buttonStyle(MavisButtonStyle(variant: .ghost))
                .fixedSize()
                .disabled(unavailable || busy)
                .accessibilityLabel(Text(verbatim: node.entry.label + ": " + (open ? context.expandedLabel : context.collapsedLabel)))
            } else {
                MavisIcon("file", size: 18)
                    .foregroundStyle(MavisTokens.muted)
                    .padding(12)
                    .accessibilityRepresentation { EmptyView() }
            }
            Button(action: { context.select(node) }) {
                Text(verbatim: node.entry.label)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(MavisButtonStyle(variant: .ghost))
            .disabled(unavailable)
            .accessibilityAddTraits(selected ? .isSelected : [])
            if busy {
                Text(verbatim: context.loadingLabel)
                    .font(${font('caption')})
                    .foregroundStyle(MavisTokens.muted)
                    .fixedSize()
            }
        }
        .padding(${theme.space.xs})
        .background(selected ? MavisTokens.primarySoft : MavisColor.clear, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
        .overlay(RoundedRectangle(cornerRadius: ${theme.radius.md}).strokeBorder(context.focused && context.cursor == key ? MavisTokens.primary : MavisColor.clear, lineWidth: 2).allowsHitTesting(false))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.xs}) {
            ForEach(nodes, id: \\.entry.key) { node in
                VStack(alignment: .leading, spacing: 0) {
                    row(node)
                    if node.branch {
                        JoltPresence(context.expanded.contains(node.entry.key)) {
                            MavisTreeLevel(nodes: node.children, context: context)
                                .padding(.leading, ${theme.space.lg})
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// MTreeView: the nodes under their heading. The selected key and the open branches belong to
/// the source: a row asks to be selected, an arrow asks for a new list of open branches and,
/// for a branch that is not loaded, for its children. The arrow keys move through the rows in
/// view as on the Web. A branch's rows enter and leave through Jolt.
struct MavisTree<Node>: View {
    let label: String
    let nodes: [Node]
    let entry: (Node) -> MavisTreeEntry
    let children: (Node) -> [Node]?
    var selected: String? = nil
    var onChange: (String) -> Void = { _ in }
    var expanded: [String] = []
    var onExpandedChange: ([String]) -> Void = { _ in }
    var loadingKeys: [String] = []
    var onLoad: (Node) -> Void = { _ in }
    var disabled: Bool = false
    var emptyLabel: String = "No items"
    var loadingLabel: String = "Loading"
    var expandedLabel: String = "Expanded"
    var collapsedLabel: String = "Collapsed"
    @State private var cursor: String?
    // The outline of the row the keys act on shows once a key was used, as focus-visible does.
    @State private var keyed = false
    @FocusState private var focused: Bool

    private var tree: [MavisTreeNode] { nodes.map { MavisTreeNode($0, entry: entry, children: children) } }

    private func find(_ key: String, in level: [Node]) -> Node? {
        for node in level {
            if entry(node).key == key { return node }
            if let found = find(key, in: children(node) ?? []) { return found }
        }
        return nil
    }

    private func rows(_ level: [MavisTreeNode], parent: String? = nil) -> [MavisTreeRow] {
        level.flatMap { node in
            [MavisTreeRow(node: node, parent: parent)] + (expanded.contains(node.entry.key) ? rows(node.children, parent: node.entry.key) : [])
        }
    }

    private func select(_ node: MavisTreeNode) {
        guard !disabled, !node.entry.disabled else { return }
        cursor = node.entry.key
        onChange(node.entry.key)
    }

    /// toggle in the Mavis tree view: a branch that is not loading opens or closes, and one
    /// that opens without children asks for them.
    private func toggle(_ node: MavisTreeNode, open wanted: Bool? = nil) {
        let key = node.entry.key
        let isOpen = expanded.contains(key)
        let open = wanted ?? !isOpen
        guard !disabled, !node.entry.disabled, node.branch, !loadingKeys.contains(key), open != isOpen else { return }
        cursor = key
        onExpandedChange(open ? expanded + [key] : expanded.filter { $0 != key })
        if open, !node.loaded, let original = find(key, in: nodes) { onLoad(original) }
    }

    /// The row the keys act on: the one last used while it is in view, or the selected one, or
    /// the first.
    private func active(_ visible: [MavisTreeRow]) -> String? {
        let enabled = visible.filter { !$0.node.entry.disabled }.map(\\.node.entry.key)
        if let cursor, enabled.contains(cursor) { return cursor }
        if let selected, enabled.contains(selected) { return selected }
        return enabled.first
    }

    private func key(_ press: KeyPress) -> KeyPress.Result {
        guard !disabled, press.modifiers.isDisjoint(with: [.option, .control, .command]) else { return .ignored }
        let all = rows(tree)
        let visible = all.filter { !$0.node.entry.disabled }
        guard let current = active(all), let index = visible.firstIndex(where: { $0.node.entry.key == current }) else { return .ignored }
        let row = visible[index]
        var next: String?
        switch press.key {
        case .downArrow: next = visible[Swift.min(visible.count - 1, index + 1)].node.entry.key
        case .upArrow: next = visible[Swift.max(0, index - 1)].node.entry.key
        case .home: next = visible.first?.node.entry.key
        case .end: next = visible.last?.node.entry.key
        case .rightArrow:
            if !expanded.contains(current) { toggle(row.node, open: true) } else { next = row.node.children.first { !$0.entry.disabled }?.entry.key }
        case .leftArrow:
            if expanded.contains(current) { toggle(row.node, open: false) } else { next = row.parent }
        case .return, .space: select(row.node)
        default:
            let typed = press.characters.lowercased()
            guard typed.count == 1, typed != " " else { return .ignored }
            let order = Array(visible[(index + 1)...]) + Array(visible[...index])
            next = order.first { $0.node.entry.label.lowercased().hasPrefix(typed) }?.node.entry.key
        }
        if let next { cursor = next }
        keyed = true
        return .handled
    }

    var body: some View {
        let tree = self.tree
        let context = MavisTreeContext(
            selected: selected, expanded: expanded, loading: loadingKeys, disabled: disabled, cursor: active(rows(tree)), focused: focused && keyed,
            loadingLabel: loadingLabel, expandedLabel: expandedLabel, collapsedLabel: collapsedLabel,
            select: { node in
                focused = true
                keyed = false
                select(node)
            },
            toggle: { node in
                focused = true
                keyed = false
                toggle(node)
            }
        )
        VStack(alignment: .leading, spacing: ${theme.space.sm}) {
            Text(verbatim: label)
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityAddTraits(.isHeader)
                .accessibilityHeading(.h2)
            if tree.isEmpty {
                Text(verbatim: emptyLabel)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                MavisTreeLevel(nodes: tree, context: context)
                    .focusable(!disabled, interactions: .edit)
                    .focused($focused)
                    .focusEffectDisabled()
                    .onKeyPress(action: key)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}`,
  vue: {
    rename: {
      value: 'modelValue',
      onChange: 'update:modelValue',
      onExpandedChange: 'update:expanded',
    },
    types: ['TreeNode'],
  },
}
