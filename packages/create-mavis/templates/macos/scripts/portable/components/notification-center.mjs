import { event, records, field, named } from './list-parts.mjs'
import { swiftCall } from './choices.mjs'
import { flexRuntime } from './flex.mjs'

const fields = {
  id: 'string',
  title: 'string',
  description: 'string?',
  group: 'string?',
  time: 'string?',
  read: 'boolean?',
  disabled: 'boolean?',
  dismissible: 'boolean?',
  actionLabel: 'string?',
}
const labels = [
  'allLabel',
  'unreadLabel',
  'readLabel',
  'unreadActionLabel',
  'readAllLabel',
  'dismissLabel',
  'emptyLabel',
  'ungroupedLabel',
]
export const MNotificationCenter = {
  props: {
    id: 'string',
    label: 'string',
    value: records('MNotificationCenter', 'notifications', fields, 'MavisNotification[]'),
    onChange: event(({ type, T }) => [type('value') ?? T.array(T.string)]),
    disabled: 'boolean',
    animated: 'boolean',
    filter: 'string',
    onUpdateFilter: 'string-handler',
    onAction: 'string-handler',
    ...Object.fromEntries(labels.map((name) => [name, 'string'])),
  },
  required: ['label', 'value'],
  control: true,
  uses: [flexRuntime],
  types: () =>
    'type MavisNotification = { id: string; title: string; description?: string; group?: string; time?: string; read?: boolean; disabled?: boolean; dismissible?: boolean; actionLabel?: string }',
  records: { MavisNotification: 'the Mavis notification type' },
  declaration: `declare function MNotificationCenter<T extends MavisNotification>(props: { id?: string; label: string; value: readonly T[]; onChange?: (items: T[]) => void; filter?: 'all' | 'unread'; onUpdateFilter?: (filter: 'all' | 'unread') => void; onAction?: (id: string) => void; disabled?: boolean; animated?: boolean; ${labels.map((name) => `${name}?: string`).join('; ')} }): JSX.Element`,
  check({ props, attrs, fail }) {
    if (!props.value.has.read)
      fail(
        attrs.get('value'),
        'Declare read?: boolean on notification records (or use MavisNotification) so shared read/unread updates have a typed result.',
      )
  },
  swift(node, { emit, indent }) {
    const p = node.props,
      rows = p.value
    const copy = `${rows.record}(${emit.records
      .get(rows.record)
      .fields.map((f) => `${f.name}: ${f.name === 'read' ? 'read' : `item.${f.name}`}`)
      .join(', ')})`
    return swiftCall(
      'MavisNotificationCenter',
      [
        `label: ${emit.value(p.label)}`,
        `items: ${emit.wrap(rows.expr)}.map { MavisNotificationEntry(item: $0, id: $0.id, title: $0.title, description: ${field(rows.has, 'description', '""')}, group: ${field(rows.has, 'group', 'nil')}, time: ${field(rows.has, 'time', '""')}, read: ${field(rows.has, 'read', 'false')}, disabled: ${field(rows.has, 'disabled', 'false')}, dismissible: ${field(rows.has, 'dismissible', 'true')}, actionLabel: ${field(rows.has, 'actionLabel', '""')}) }`,
        `markRead: { item, read in ${copy} }`,
        ...named(p, emit, ['id', 'disabled', 'animated', 'filter', ...labels]),
        ...['onChange', 'onUpdateFilter', 'onAction'].flatMap((name) =>
          p[name] ? [`${name}: ${emit.handler(p[name], indent + 4)}`] : [],
        ),
      ],
      indent,
    )
  },
  vue: {
    types: ['MavisNotification'],
    rename: { value: 'modelValue', onChange: 'update:modelValue', onUpdateFilter: 'update:filter' },
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `struct MavisNotificationEntry<Item: Equatable>: Identifiable, Equatable {
    let item: Item
    let id: String
    let title: String
    let description: String
    let group: String?
    let time: String
    let read: Bool
    let disabled: Bool
    let dismissible: Bool
    let actionLabel: String
}

struct MavisNotificationCenter<Item: Equatable>: View {
    let label: String
    let items: [MavisNotificationEntry<Item>]
    let markRead: (Item, Bool) -> Item
    var id: String? = nil
    var disabled = false
    var animated = true
    var filter = "all"
    var allLabel = "All"
    var unreadLabel = "Unread"
    var readLabel = "Mark as read"
    var unreadActionLabel = "Mark as unread"
    var readAllLabel = "Mark all as read"
    var dismissLabel = "Dismiss"
    var emptyLabel = "You are all caught up"
    var ungroupedLabel = "Notifications"
    var onChange: ([Item]) -> Void = { _ in }
    var onUpdateFilter: (String) -> Void = { _ in }
    var onAction: (String) -> Void = { _ in }

    private var visible: [MavisNotificationEntry<Item>] { items.filter { filter == "all" || !$0.read } }
    private var groups: [String] {
        var result: [String] = []
        for item in visible { let group = item.group ?? ungroupedLabel; if !result.contains(group) { result.append(group) } }
        return result
    }
    private func change(_ ids: [String], _ action: String) {
        guard !disabled else { return }
        onChange(items.compactMap { entry in
            guard ids.contains(entry.id), !entry.disabled else { return entry.item }
            if action == "dismiss" { return entry.dismissible ? nil : entry.item }
            return markRead(entry.item, action == "read")
        })
    }
    private func choice(_ text: String, _ selected: Bool, _ action: @escaping () -> Void) -> some View {
        Button(text, action: action).buttonStyle(MavisButtonStyle(variant: selected ? .secondary : .ghost)).disabled(disabled)
    }
    private func row(_ item: MavisNotificationEntry<Item>) -> some View {
        MavisColumn(spacing: ${theme.space.sm}) {
            Text(verbatim: item.title).font(${font('heading')}).foregroundStyle(MavisTokens.text).fixedSize(horizontal: false, vertical: true)
            if !item.description.isEmpty { Text(verbatim: item.description).font(${font('body')}).foregroundStyle(MavisTokens.muted).fixedSize(horizontal: false, vertical: true) }
            if !item.time.isEmpty { Text(verbatim: item.time).font(${font('caption')}).foregroundStyle(MavisTokens.muted) }
            MavisStack(axis: .vertical, spacing: ${theme.space.xs}, breakpoints: [MavisBreakpoint(at: 520, axis: .horizontal)]) {
                if !item.actionLabel.isEmpty {
                    Button(item.actionLabel, action: { if !disabled && !item.disabled { onAction(item.id) } })
                        .buttonStyle(MavisButtonStyle(variant: .primary))
                }
                Button(item.read ? unreadActionLabel : readLabel, action: { change([item.id], item.read ? "unread" : "read") })
                    .buttonStyle(MavisButtonStyle(variant: .ghost))
                    .accessibilityLabel(Text(verbatim: (item.read ? unreadActionLabel : readLabel) + ": " + item.title))
                if item.dismissible {
                    Button(dismissLabel, action: { change([item.id], "dismiss") })
                        .buttonStyle(MavisButtonStyle(variant: .ghost))
                        .accessibilityLabel(Text(verbatim: dismissLabel + ": " + item.title))
                }
            }.disabled(disabled || item.disabled)
        }
        .padding(${theme.space.md})
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.lg}))
        .overlay(RoundedRectangle(cornerRadius: ${theme.radius.lg}).strokeBorder(item.read ? MavisTokens.border : MavisTokens.primary).allowsHitTesting(false))
        .accessibilityElement(children: .contain)
    }
    var body: some View {
        let _ = precondition(items.count <= 1000 && Set(items.map(\\.id)).count == items.count && items.allSatisfy { !$0.id.isEmpty && !mavisTrim($0.title).isEmpty }, "Notifications require unique nonempty IDs and titles, at most 1000 items.")
        MavisColumn(spacing: ${theme.space.md}) {
            MavisRow(spacing: ${theme.space.sm}, align: .center) {
                Text(verbatim: label).font(${font('heading')}).mavisItem(grow: 1)
                Text(verbatim: String(items.filter { !$0.read }.count)).font(${font('body')}).accessibilityLabel(Text(verbatim: unreadLabel))
            }
            MavisRow(spacing: ${theme.space.sm}, wrap: true) {
                choice(allLabel, filter == "all") { if !disabled { onUpdateFilter("all") } }
                choice(unreadLabel, filter == "unread") { if !disabled { onUpdateFilter("unread") } }
                Button(readAllLabel, action: { change(items.map(\\.id), "read") })
                    .buttonStyle(MavisButtonStyle(variant: .ghost))
                    .disabled(disabled || !items.contains { !$0.read && !$0.disabled })
            }
            if visible.isEmpty {
                Text(verbatim: emptyLabel).font(${font('body')}).foregroundStyle(MavisTokens.muted).padding(${theme.space.lg})
            }
            ForEach(groups, id: \\.self) { group in
                MavisColumn(spacing: ${theme.space.sm}) {
                    Text(verbatim: group).font(${font('body')}).fontWeight(.semibold).foregroundStyle(MavisTokens.muted)
                    ForEach(visible.filter { ($0.group ?? ungroupedLabel) == group }) { item in row(item) }
                }
            }
        }
        .joltLayout(value: items)
        .joltLayout(value: filter)
        .joltReduceMotion(!animated)
        .mavisIdentifier(id ?? "")
    }
}`,
}
