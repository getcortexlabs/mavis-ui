import { flexRuntime } from './flex.mjs'
import { content, field, named, records, slotOf } from './list-parts.mjs'
import { union } from './shared.mjs'

const statuses = ['complete', 'current', 'upcoming', 'error']
const optional = ['description', 'time', 'status', 'icon']

const items = records(
  'MTimeline',
  'items',
  {
    key: 'string',
    title: 'string',
    description: 'string?',
    time: 'string?',
    status: 'string?',
    icon: 'string?',
  },
  '{ key: string; title: string }[]',
)

// The four labels as the Swift helper takes them: written out, or read from a value.
function labels(prop, emit) {
  const value = prop.expr
  const each = (read) => statuses.map((status) => `${status}: ${read(status)}`).join(', ')
  if (value.e === 'record' && !value.spread)
    return `MavisTimelineLabels(${each((status) => emit.expr(value.fields.find((item) => item.name === status).value))})`
  return `{ let labels = ${emit.expr(value)}; return MavisTimelineLabels(${each((status) => `labels.${status}`)}) }()`
}

// timelineProps: entries in the order of items, each with a state the reader can tell without
// color: its icon, its label from statusLabels and its connector to the next one. The default
// slot adds content to an entry and takes the item and its index.
export const MTimeline = {
  props: {
    id: 'string',
    label: 'string',
    items,
    emptyLabel: 'string',
    statusLabels: ({ value, ctx, expr, record }) => ({
      expr: expr(value, ctx, record('TimelineLabels')),
    }),
  },
  required: ['label', 'items'],
  slots: ['default'],
  scoped: {
    default: (props, { record, T }) => [
      { name: 'item', type: record('TimelineItem') },
      { name: 'index', type: T.number },
    ],
  },
  uses: [flexRuntime],
  types: () => `type TimelineStatus = ${union(statuses)}
/** An entry of MTimeline, and what its content takes: look the rest up by key. */
type TimelineItem = { key: string; title: string; description?: string; time?: string; status?: TimelineStatus; icon?: MavisIconName }
/** What MTimeline calls each state. */
type TimelineLabels = { ${statuses.map((status) => `${status}: string`).join('; ')} }`,
  records: {
    TimelineItem: 'the Mavis timeline item type',
    TimelineLabels: "the type of MTimeline's statusLabels",
  },
  declaration:
    'declare function MTimeline(props: { id?: string; label: string; items: readonly { readonly key: string; readonly title: string; readonly description?: string; readonly time?: string; readonly status?: TimelineStatus; readonly icon?: MavisIconName }[]; emptyLabel?: string; statusLabels?: TimelineLabels; children?: (props: { item: TimelineItem; index: number }) => JSX.Element }): JSX.Element',
  check({ props, attrs, fail }) {
    if ('lit' in props.label && !props.label.lit.trim())
      fail(attrs.get('label'), 'MTimeline needs a label that is not empty.')
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const detail = slotOf(node, 'default')
    const { record, has } = props.items
    // The content always takes TimelineItem, as on the Web: other records become one.
    const converted = detail && record !== 'TimelineItem'
    const placed = converted
      ? `${emit.wrap(props.items.expr)}.map { TimelineItem(key: $0.key, title: $0.title, ${optional.map((name) => `${name}: ${has[name] ? `$0.${name}` : 'nil'}`).join(', ')}) }`
      : emit.expr(props.items.expr)
    const own = converted || record === 'TimelineItem' ? null : has
    const read = (name, fallback) =>
      own ? field(own, name, fallback) : `$0.${name} ?? ${fallback}`
    const taken = (index, fallback) =>
      detail && !detail.params[index].unused ? detail.params[index].name : fallback
    const item = taken(0, 'mavisItem')
    emit.forKeys.push(`${item}.key`)
    const body = content(detail?.body ?? [], context, 4)
    emit.forKeys.pop()
    const args = [
      `label: ${emit.value(props.label)}`,
      `items: ${placed}`,
      `entry: { MavisTimelineEntry(key: $0.key, title: $0.title, description: ${read('description', '""')}, time: ${read('time', '""')}, status: ${read('status', '"complete"')}, icon: ${read('icon', '""')}) }`,
      ...named(props, emit, ['emptyLabel']),
      ...(props.statusLabels ? [`statusLabels: ${labels(props.statusLabels, emit)}`] : []),
    ]
    return [
      `${pad}MavisTimeline(`,
      args.map((arg) => `${pad}    ${arg}`).join(',\n'),
      `${pad}) { ${item}, ${taken(1, 'mavisIndex')} in`,
      body,
      `${pad}}`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// One entry of an MTimeline, without the shared record type so every project can use it.
struct MavisTimelineEntry: Hashable {
    let key: String
    let title: String
    var description: String = ""
    var time: String = ""
    var status: String = "complete"
    var icon: String = ""
}

/// What MTimeline calls each state: statusLabels.
struct MavisTimelineLabels: Equatable {
    var complete: String = "Complete"
    var current: String = "In progress"
    var upcoming: String = "Upcoming"
    var error: String = "Needs attention"

    func text(_ status: String) -> String {
        switch status {
        case "current": return current
        case "upcoming": return upcoming
        case "error": return error
        default: return complete
        }
    }
}

private struct MavisTimelineRow: Identifiable {
    let id: String
    let index: Int
}

/// An entry: its state on the left with the connector to the next entry, and its text. Jolt
/// brings it in, grows the mark of the current entry and fades the connector to an upcoming one.
private struct MavisTimelineItem<Detail: View>: View {
    let entry: MavisTimelineEntry
    let last: Bool
    let statusText: String
    @ViewBuilder let detail: () -> Detail
    @State private var entered = false

    private static var current: JoltPose { try! JoltPose(scale: 1.08) }
    private static var waiting: JoltPose { try! JoltPose(scaleY: 0.15, opacity: 0.3) }
    private static var resting: JoltPose { try! JoltPose(opacity: 0.45) }

    private var tone: MavisColor {
        entry.status == "error" ? MavisTokens.danger : entry.status == "upcoming" ? MavisTokens.muted : MavisTokens.primary
    }
    private var icon: String {
        if !entry.icon.isEmpty { return entry.icon }
        return entry.status == "complete" ? "check" : entry.status == "error" ? "circle-alert" : "circle-dot"
    }

    private func line(_ text: String, _ font: Font, _ color: MavisColor) -> some View {
        Text(verbatim: text)
            .font(font)
            .foregroundStyle(color)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    var body: some View {
        MavisRow(spacing: ${theme.space.md}, align: .stretch) {
            MavisColumn(spacing: ${theme.space.xs}, align: .center) {
                MavisIcon(icon, size: 16)
                    .foregroundStyle(tone)
                    .frame(width: 32, height: 32)
                    .background(entry.status == "upcoming" ? MavisTokens.surface : MavisTokens.primarySoft, in: Circle())
                    .joltMotion(to: entry.status == "current" ? Self.current : .identity, transition: .spring(.smooth))
                    .mavisItem(shrink: 0)
                if !last {
                    Rectangle()
                        .fill(MavisTokens.border)
                        .frame(width: 2)
                        .frame(minHeight: 24)
                        .joltMotion(to: entry.status == "upcoming" ? Self.waiting : .identity, transition: .spring(.smooth))
                        .mavisItem(grow: 1)
                }
            }
            .mavisItem(shrink: 0, width: .points(32))
            MavisColumn(spacing: ${theme.space.sm}) {
                MavisRow(spacing: ${theme.space.sm}, justify: .between, wrap: true) {
                    line(entry.title, ${font('body')}.weight(.semibold), MavisTokens.text)
                    if !entry.time.isEmpty {
                        line(entry.time, ${font('caption')}, MavisTokens.muted)
                            .mavisItem(shrink: 0)
                    }
                }
                .accessibilityElement(children: .contain)
                MavisRow(spacing: ${theme.space.xs}) {
                    Circle()
                        .fill(tone)
                        .frame(width: 6, height: 6)
                        .joltMotion(to: entry.status == "current" ? .identity : Self.resting, transition: .spring(.smooth))
                        .accessibilityHidden(true)
                        .mavisItem(shrink: 0)
                    line(statusText, ${font('caption')}, entry.status == "error" ? MavisTokens.danger : MavisTokens.muted)
                }
                if !entry.description.isEmpty {
                    line(entry.description, ${font('body')}, MavisTokens.muted)
                }
                detail()
                if !last {
                    Color.clear
                        .frame(height: 16)
                        .accessibilityHidden(true)
                }
            }
            .padding(.vertical, ${theme.space.xs})
            .accessibilityElement(children: .contain)
            .mavisItem(grow: 1, shrink: 1)
        }
        .joltPreset(.fadeInUp, active: entered)
        .onAppear { entered = true }
    }
}

/// MTimeline: the entries in the order of the items, named by label. Each entry keeps its
/// identity by its key: Jolt moves the entries when the list changes, and Reduce Motion places
/// them at once.
struct MavisTimeline<Item, Detail: View>: View {
    let label: String
    let items: [Item]
    let entry: (Item) -> MavisTimelineEntry
    var emptyLabel: String = "No activity yet"
    var statusLabels = MavisTimelineLabels()
    @ViewBuilder let detail: (Item, Double) -> Detail

    var body: some View {
        MavisColumn {
            if items.isEmpty {
                Text(verbatim: emptyLabel)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.muted)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                ForEach(items.indices.map { MavisTimelineRow(id: entry(items[$0]).key, index: $0) }) { row in
                    let each = entry(items[row.index])
                    MavisTimelineItem(entry: each, last: row.index == items.count - 1, statusText: statusLabels.text(each.status)) {
                        detail(items[row.index], Double(row.index))
                    }
                }
            }
        }
        .joltLayout(value: items.map { entry($0).key }, transition: .spring(.smooth))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: { types: ['TimelineItem', 'TimelineStatus'] },
}
