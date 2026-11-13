import { flexRuntime } from './flex.mjs'
import { accessibility, flexItem, flexProps } from './shared.mjs'
import { content, event, field, listRuntime, named, records, slotOf } from './list-parts.mjs'

const items = records(
  'MAccordion',
  'items',
  {
    value: 'string',
    title: 'string',
    description: 'string?',
    icon: 'string?',
    disabled: 'boolean?',
  },
  '{ value: string; title: string }[]',
)

const filled = (key, props, attrs, fail) => {
  if (props[key] && 'lit' in props[key] && !props[key].lit.trim())
    fail(attrs.get(key), `MAccordion needs a ${key} that is not empty.`)
}

// accordionProps: sections under a header each, in the order of items. value lists the open
// ones and belongs to the source, as v-model on the Web and NativeScript: a header asks for a
// new list, with one section at most unless multiple is set. The body of an open section is the
// default slot, which takes the item.
export const MAccordion = {
  props: {
    id: 'string',
    accessibilityHidden: 'boolean',
    ...flexProps,
    width: 'dimension',
    label: 'string',
    items,
    value: ({ value, ctx, expr, T }) => ({ expr: expr(value, ctx, T.array(T.string)) }),
    onChange: event(({ T }) => [T.array(T.string)]),
    multiple: 'boolean',
    disabled: 'boolean',
    expandedLabel: 'string',
    collapsedLabel: 'string',
  },
  required: ['label', 'items'],
  slots: ['default'],
  scoped: {
    default: (props, { record }) => [{ name: 'item', type: record('AccordionItem') }],
  },
  control: true,
  uses: [flexRuntime, listRuntime],
  types: () =>
    '/** A section of MAccordion, and what its body takes: look the rest up by value. */\ntype AccordionItem = { value: string; title: string; description?: string; icon?: MavisIconName; disabled?: boolean }',
  records: { AccordionItem: 'the Mavis accordion item type' },
  declaration:
    'declare function MAccordion(props: MavisFlexItem & { id?: string; accessibilityHidden?: boolean; width?: MavisDimension; label: string; items: readonly { readonly value: string; readonly title: string; readonly description?: string; readonly icon?: MavisIconName; readonly disabled?: boolean }[]; value?: readonly string[]; onChange?: (value: string[]) => void; multiple?: boolean; disabled?: boolean; expandedLabel?: string; collapsedLabel?: string; children?: (props: { item: AccordionItem }) => JSX.Element }): JSX.Element',
  check({ props, attrs, fail }) {
    for (const key of ['label', 'expandedLabel', 'collapsedLabel']) filled(key, props, attrs, fail)
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const body = slotOf(node, 'default')
    const { record, has } = props.items
    const list = emit.expr(props.items.expr)
    // The body always takes AccordionItem, as on the Web: other records become one.
    const converted = body && record !== 'AccordionItem'
    const optional = (name) => (has[name] ? `$0.${name}` : 'nil')
    const placed = converted
      ? `${emit.wrap(props.items.expr)}.map { AccordionItem(value: $0.value, title: $0.title, description: ${optional('description')}, icon: ${optional('icon')}, disabled: ${optional('disabled')}) }`
      : list
    const own = converted || record === 'AccordionItem' ? {} : has
    const read = (name, fallback) =>
      converted || record === 'AccordionItem'
        ? `$0.${name} ?? ${fallback}`
        : field(own, name, fallback)
    const item = body && !body.params[0].unused ? body.params[0].name : 'mavisItem'
    emit.forKeys.push(`${item}.value`)
    const panel = content(body?.body ?? [], context, 4)
    emit.forKeys.pop()
    const args = [
      `label: ${emit.value(props.label)}`,
      `items: ${placed}`,
      `entry: { MavisAccordionEntry(value: $0.value, title: $0.title, description: ${read('description', '""')}, icon: ${read('icon', '""')}, disabled: ${read('disabled', 'false')}) }`,
      ...(props.value ? [`expanded: ${emit.expr(props.value.expr)}`] : []),
      ...(props.onChange ? [`onChange: ${emit.handler(props.onChange, indent + 4)}`] : []),
      ...named(props, emit, ['multiple', 'disabled', 'expandedLabel', 'collapsedLabel']),
    ]
    return [
      `${pad}MavisAccordion(`,
      args.map((arg) => `${pad}    ${arg}`).join(',\n'),
      `${pad}) { ${item} in`,
      panel,
      `${pad}}`,
      ...accessibility(props, context, { container: true }),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// One section of an MAccordion, without the shared record type so every project can use it.
struct MavisAccordionEntry: Hashable {
    let value: String
    let title: String
    var description: String = ""
    var icon: String = ""
    var disabled: Bool = false
}

private struct MavisAccordionRow: Identifiable {
    let id: String
    let index: Int
}

/// MAccordion: a header for each item and, under the open ones, their body. The open values
/// belong to the source: a header asks for a new list, as toggleAccordion in the Mavis core
/// decides it. A body enters and leaves through Jolt, and stays until it has left.
struct MavisAccordion<Item, Panel: View>: View {
    let label: String
    let items: [Item]
    let entry: (Item) -> MavisAccordionEntry
    var expanded: [String] = []
    var onChange: ([String]) -> Void = { _ in }
    var multiple: Bool = false
    var disabled: Bool = false
    var expandedLabel: String = "Expanded"
    var collapsedLabel: String = "Collapsed"
    @ViewBuilder let panel: (Item) -> Panel

    private func toggle(_ section: MavisAccordionEntry) {
        guard !disabled, !section.disabled else { return }
        if expanded.contains(section.value) {
            onChange(expanded.filter { $0 != section.value })
        } else {
            onChange(multiple ? expanded + [section.value] : [section.value])
        }
    }

    private func header(_ section: MavisAccordionEntry, open: Bool) -> some View {
        Button(action: { toggle(section) }) {
            HStack(alignment: .center, spacing: ${theme.space.md}) {
                if !section.icon.isEmpty {
                    MavisIcon(section.icon, size: 20)
                        .foregroundStyle(open ? MavisTokens.primary : MavisTokens.muted)
                }
                VStack(alignment: .leading, spacing: ${theme.space.xs}) {
                    Text(verbatim: section.title)
                        .font(${font('body')})
                        .fontWeight(.semibold)
                        .foregroundStyle(MavisTokens.text)
                        .fixedSize(horizontal: false, vertical: true)
                    if !section.description.isEmpty {
                        Text(verbatim: section.description)
                            .font(${font('caption')})
                            .foregroundStyle(MavisTokens.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                MavisIcon(open ? "chevron-up" : "chevron-down", size: 16)
                    .foregroundStyle(open ? MavisTokens.primary : MavisTokens.muted)
            }
            .padding(${theme.space.md})
            .frame(minHeight: 48)
            .contentShape(RoundedRectangle(cornerRadius: ${theme.radius.md}))
        }
        .buttonStyle(MavisPlainButtonStyle())
        .disabled(disabled || section.disabled)
        .accessibilityLabel(Text(verbatim: section.title))
        .accessibilityValue(Text(verbatim: open ? expandedLabel : collapsedLabel))
    }

    var body: some View {
        MavisColumn(spacing: ${theme.space.sm}) {
            ForEach(items.indices.map { MavisAccordionRow(id: entry(items[$0]).value, index: $0) }) { row in
                let section = entry(items[row.index])
                let open = expanded.contains(section.value)
                // The border takes one unit of the section's box, as on the Web.
                MavisColumn {
                    header(section, open: open)
                    JoltPresence(open) {
                        MavisColumn(spacing: ${theme.space.md}) {
                            MavisSeparator()
                                .mavisItem(shrink: 0, align: .stretch)
                            MavisColumn { panel(items[row.index]) }
                        }
                        .padding([.horizontal, .bottom], ${theme.space.md})
                    }
                }
                .padding(1)
                .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
                .overlay(RoundedRectangle(cornerRadius: ${theme.radius.md}).strokeBorder(open ? MavisTokens.primarySoft : MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['AccordionItem'],
  },
}
