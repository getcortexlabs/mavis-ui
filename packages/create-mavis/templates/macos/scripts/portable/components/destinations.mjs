// MTabBar and MNavigationRail: the top-level places of an app, as links. The source says which one
// is current (value), from the route it confirmed; a destination goes where MLink's would.
import { expression, js } from '../js-text.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'
import {
  call,
  flag,
  handlers,
  items,
  mapped,
  nested,
  optionalText,
  settings,
  text,
} from './items.mjs'
import { accessibility } from './shared.mjs'
import { wayfindingRuntime } from './wayfinding.mjs'

const destination = {
  value: text,
  label: text,
  href: text,
  icon: optionalText,
  badge: optionalText,
  disabled: flag,
}
const group = { key: text, label: text, items: nested(destination, 'MavisDestination') }
const shape =
  '{ value: string; label: string; href: string; icon?: IconName; badge?: string; disabled?: boolean }'
const item =
  '{ readonly value: string; readonly label: string; readonly href: string; readonly icon?: MavisIconName; readonly badge?: string; readonly disabled?: boolean }'

// The current destination in Vue: undefined in the source is null for the component.
const current = {
  rename: { value: 'modelValue' },
  attribute(name, value) {
    if (name === 'value' && value.expr.type.k === 'optional')
      return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
  },
}

const destinationsRuntime = {
  swiftRuntime:
    () => `/// A destination of MTabBar and MNavigationRail, without the shared record type.
struct MavisDestination: Hashable {
    let value: String
    let label: String
    let href: String
    var icon: String? = nil
    var badge: String? = nil
    var disabled = false

    /// What assistive technology reads: the label and what the badge counts.
    var name: String { label + (badge.map { " " + $0 } ?? "") }
}

/// The count beside a destination, in the theme's elevated or soft primary colors.
struct MavisWayBadge: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let text: String
    var primary = false
    var body: some View {
        Text(verbatim: text)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(primary ? MavisTokens.primary : MavisTokens.text)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .frame(minWidth: 28)
            .background(primary ? MavisTokens.primarySoft : MavisTokens.elevated, in: Capsule())
    }
}`,
}

// tabBarProps: a row of destinations on the theme's surface, each as wide as its share of the
// row. The current one is a primary button with a mark Jolt moves when the source changes value.
export const MTabBar = {
  props: {
    id: 'string',
    label: 'string',
    value: 'optional-string',
    items: items(
      destination,
      `MTabBar takes items with a value, a label and an href, all strings, such as NavigationItem[]: ${shape}.`,
    ),
    disabled: 'boolean',
    currentLabel: 'string',
    safeArea: 'boolean',
    onError: 'handler',
  },
  required: ['label', 'items'],
  control: true,
  uses: [flexRuntime, wayfindingRuntime, destinationsRuntime],
  types:
    () => `/** A destination of MTabBar and MNavigationRail. Its value identifies it; href is where it goes. */
type NavigationItem = { value: string; label: string; href: string; icon?: MavisIconName; badge?: string; disabled?: boolean }
/** A group of destinations in MNavigationRail. */
type NavigationGroup = { key: string; label: string; items: NavigationItem[] }`,
  records: {
    NavigationItem: 'the Mavis destination type',
    NavigationGroup: 'the Mavis destination group type',
  },
  declaration: `declare function MTabBar(props: { id?: string; label: string; value?: string | undefined; items: readonly ${item}[]; disabled?: boolean; currentLabel?: string; safeArea?: boolean; onError?: () => void }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    return [
      ...call(
        'MavisTabBar',
        [
          `label: ${emit.value(props.label)}`,
          `items: ${mapped(props.items, destination, 'MavisDestination', emit)}`,
          ...(props.value ? [`value: ${emit.expr(props.value.expr)}`] : []),
          ...settings(props, ['disabled'], emit),
          ...handlers(props, ['onError'], emit, indent),
        ],
        indent,
      ),
      ...accessibility({ id: props.id }, context, { container: true }),
      `${pad}    .mavisItem(shrink: 0)`,
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    metric,
    font,
  }) => `/// MTabBar: the destinations side by side on the theme's surface, named by label. The source
/// says which one is current; Jolt moves its mark there, and Reduce Motion puts it there.
struct MavisTabBar: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let items: [MavisDestination]
    var value: String? = nil
    var disabled = false
    var onError: () -> Void = {}
    @Namespace private var selection
    @Environment(\\.mavisWayfinding) private var wayfinding
    @Environment(\\.openURL) private var openURL

    var body: some View {
        MavisRow(spacing: ${metric('space.xs')}) {
            ForEach(items, id: \\.value) { item in
                let current = item.value == value
                Button(action: {
                    if !wayfinding.follow(item.href, with: openURL) { onError() }
                }) {
                    HStack(spacing: 8) {
                        if let icon = item.icon { MavisIcon(icon, size: 20) }
                        Text(verbatim: item.label)
                        HStack(spacing: ${metric('space.xs')}) {
                            if current {
                                Circle()
                                    .fill(MavisTokens.onPrimary)
                                    .frame(width: 5, height: 5)
                                    .joltSharedLayout("current", in: selection)
                            }
                            if let badge = item.badge { MavisWayBadge(text: badge) }
                        }
                    }
                }
                .buttonStyle(MavisButtonStyle(variant: current ? .primary : .ghost))
                .disabled(disabled || item.disabled)
                .accessibilityLabel(Text(verbatim: item.name))
                .accessibilityAddTraits(current ? [.isLink, .isSelected] : .isLink)
                .accessibilityRemoveTraits(.isButton)
                .mavisItem(grow: 1, shrink: 1)
            }
        }
        .padding(${metric('space.sm')})
        .background(MavisTokens.surface)
        .joltLayout(value: value, transition: .spring(.smooth))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: { ...current, types: ['NavigationItem', 'NavigationGroup'] },
}

// navigationRailProps: groups of destinations down the side, 256 units wide or 80 when
// collapsed, where each destination is only its icon. collapsed belongs to the source: the
// button at the end asks for the other state with onCollapse. The header and footer slots take
// { collapsed }.
export const MNavigationRail = {
  props: {
    id: 'string',
    label: 'string',
    groups: items(
      group,
      `MNavigationRail takes groups with a key, a label and items, such as NavigationGroup[]: { key: string; label: string; items: NavigationItem[] }, each item as ${shape}.`,
    ),
    value: 'optional-string',
    collapsed: 'boolean',
    onCollapse: 'boolean-handler',
    disabled: 'boolean',
    collapsible: 'boolean',
    collapseLabel: 'string',
    expandLabel: 'string',
    currentLabel: 'string',
    onError: 'handler',
  },
  required: ['label', 'groups'],
  slots: ['header', 'footer'],
  scoped: {
    header: (props, { T }) => [{ name: 'collapsed', type: T.boolean }],
    footer: (props, { T }) => [{ name: 'collapsed', type: T.boolean }],
  },
  control: true,
  uses: [flexRuntime, wayfindingRuntime, destinationsRuntime],
  declaration: `declare function MNavigationRail(props: { id?: string; label: string; groups: readonly { readonly key: string; readonly label: string; readonly items: readonly ${item}[] }[]; value?: string | undefined; collapsed?: boolean; onCollapse?: (collapsed: boolean) => void; disabled?: boolean; collapsible?: boolean; collapseLabel?: string; expandLabel?: string; currentLabel?: string; onError?: () => void; slotHeader?: (props: { collapsed: boolean }) => JSX.Element; slotFooter?: (props: { collapsed: boolean }) => JSX.Element }): JSX.Element`,
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const slot = (name) => {
      const filled = node.slots?.find((each) => each.name === name)
      const taken = filled && !filled.params[0].unused ? filled.params[0].name : '_'
      const body = (filled?.body ?? [])
        .map((child) => emit.view(child, indent + 8, tokens))
        .join('\n')
      return `${name}: { (${taken}: Bool) in\n${body || `${pad}        EmptyView()`}\n${pad}    }`
    }
    return [
      ...call(
        'MavisNavigationRail',
        [
          `label: ${emit.value(props.label)}`,
          `groups: ${mapped(props.groups, group, 'MavisDestinationGroup', emit)}`,
          ...(props.value ? [`value: ${emit.expr(props.value.expr)}`] : []),
          ...settings(props, ['collapsed'], emit),
          ...handlers(props, ['onCollapse'], emit, indent),
          ...settings(props, ['disabled', 'collapsible', 'collapseLabel', 'expandLabel'], emit),
          ...handlers(props, ['onError'], emit, indent),
          slot('header'),
          slot('footer'),
        ],
        indent,
      ),
      ...accessibility({ id: props.id }, context, { container: true }),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
    metric,
  }) => `/// A group of destinations in MNavigationRail, without the shared record type.
struct MavisDestinationGroup: Hashable {
    let key: String
    let label: String
    let items: [MavisDestination]
}

/// MNavigationRail: groups of destinations in a column on the theme's surface, named by label,
/// 256 points wide or 80 collapsed, where a destination is its icon alone. The source says which
/// one is current and whether the rail is collapsed; Jolt moves the mark and the width, and
/// Reduce Motion puts them there.
struct MavisNavigationRail<Header: View, Footer: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let groups: [MavisDestinationGroup]
    var value: String? = nil
    var collapsed = false
    var onCollapse: (Bool) -> Void = { _ in }
    var disabled = false
    var collapsible = true
    var collapseLabel = "Collapse navigation"
    var expandLabel = "Expand navigation"
    var onError: () -> Void = {}
    @ViewBuilder let header: (Bool) -> Header
    @ViewBuilder let footer: (Bool) -> Footer
    @Namespace private var selection
    @Environment(\\.mavisWayfinding) private var wayfinding
    @Environment(\\.openURL) private var openURL

    private func destination(_ item: MavisDestination) -> some View {
        let current = item.value == value
        return Button(action: {
            if !wayfinding.follow(item.href, with: openURL) { onError() }
        }) {
            if collapsed {
                MavisIcon(item.icon ?? "circle", size: 20)
            } else {
                HStack(spacing: 8) {
                    HStack(spacing: ${metric('space.sm')}) {
                        Circle()
                            .fill(MavisTokens.border)
                            .frame(width: 6, height: 6)
                            .overlay {
                                if current {
                                    Circle().fill(MavisTokens.primary).joltSharedLayout("current", in: selection)
                                }
                            }
                        if let icon = item.icon { MavisIcon(icon, size: 18) }
                    }
                    Text(verbatim: item.label).multilineTextAlignment(.leading)
                    if let badge = item.badge { MavisWayBadge(text: badge, primary: current) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .buttonStyle(MavisButtonStyle(variant: current ? .secondary : .ghost))
        .disabled(disabled || item.disabled)
        .accessibilityLabel(Text(verbatim: item.name))
        .accessibilityAddTraits(current ? [.isLink, .isSelected] : .isLink)
        .accessibilityRemoveTraits(.isButton)
        .help(collapsed ? item.name : "")
    }

    var body: some View {
        MavisColumn(spacing: ${metric('space.lg')}) {
            header(collapsed)
            ForEach(groups, id: \\.key) { group in
                MavisColumn(spacing: ${metric('space.xs')}) {
                    if collapsed {
                        MavisSeparator().mavisItem(shrink: 0, align: .stretch)
                    } else {
                        Text(verbatim: group.label)
                            .font(${font('overline')})
                            .foregroundStyle(MavisTokens.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, ${metric('space.sm')})
                    }
                    ForEach(group.items, id: \\.value) { destination($0) }
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel(Text(verbatim: group.label))
            }
            footer(collapsed)
            if collapsible {
                Button(action: { onCollapse(!collapsed) }) {
                    HStack(spacing: 8) {
                        MavisIcon(glyph: collapsed ? ${swiftGlyph('panel-left-open')} : ${swiftGlyph('panel-left-close')}, size: 20)
                        if !collapsed { Text(verbatim: collapseLabel) }
                    }
                }
                .buttonStyle(MavisButtonStyle(variant: .ghost))
                .disabled(disabled)
                .accessibilityLabel(Text(verbatim: collapsed ? expandLabel : collapseLabel))
            }
        }
        // The border takes one unit of the rail's box, as on the Web.
        .padding(${metric('space.sm', '+', 1)})
        .frame(width: collapsed ? 80 : 256, alignment: .topLeading)
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.lg')}))
        .overlay(RoundedRectangle(cornerRadius: ${metric('radius.lg')}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
        .joltLayout(value: collapsed, transition: .spring(.smooth))
        .joltLayout(value: value, transition: .spring(.smooth))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: {
    rename: { ...current.rename, onCollapse: 'update:collapsed' },
    attribute: current.attribute,
  },
}
