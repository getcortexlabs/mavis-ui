import { expression, handlerJs, js } from '../js-text.mjs'
import { choiceValue, choiceValueEvent } from './choices.mjs'
import { flexRuntime } from './flex.mjs'
import { choice, flag, handlers, items, mapped, model, settings, text } from './items.mjs'
import { accessibility, flexItem, flexProps } from './shared.mjs'

const tab = { value: choice, label: text, disabled: flag }

// What a source's own value is in Vue: undefined there is null for the component, and the
// component reports its original string or number identity unchanged.
export const choiceModel = {
  ...model,
  attribute(name, value) {
    if (name === 'value' && value.expr.type.k === 'optional')
      return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
    if (name === 'onChange' && value.params.some((param) => !param.unused))
      return `@update:modelValue="${expression(`(choice) => (${handlerJs(value)})(choice)`)}"`
  },
}

// tabsProps: a strip of tabs over the panel of the selected one. value belongs to the source, as
// v-model on the Web and NativeScript: a tab asks for it with onChange and the source decides.
// The panel is the default slot, a function of the selected tab's value; only that panel exists
// unless keepAlive keeps the visited ones.
export const MTabs = {
  props: {
    id: 'string',
    accessibilityHidden: 'boolean',
    ...flexProps,
    width: 'dimension',
    label: 'string',
    tabs: items(
      tab,
      'MTabs takes tabs with a value and a label, a string/number value and a textual label, such as TabOption[]: { value: string | number; label: string; disabled?: boolean }.',
    ),
    value: choiceValue,
    onChange: choiceValueEvent,
    disabled: 'boolean',
    keepAlive: 'boolean',
  },
  required: ['label', 'tabs', 'value'],
  slots: ['default'],
  scoped: { default: (props, { T }) => [{ name: 'value', type: T.choice }] },
  control: true,
  uses: [flexRuntime],
  types:
    () => `/** One tab of MTabs. Its value identifies it; its label can change with the language. */
type TabOption = { value: string | number; label: string; disabled?: boolean }`,
  records: { TabOption: 'the Mavis tab type' },
  declaration:
    'declare function MTabs(props: MavisFlexItem & { id?: string; accessibilityHidden?: boolean; width?: MavisDimension; label: string; tabs: readonly { readonly value: string | number; readonly label: string; readonly disabled?: boolean }[]; value: string | number | null | undefined; onChange?: (value: string | number) => void; disabled?: boolean; keepAlive?: boolean; children?: (props: { value: string | number }) => JSX.Element }): JSX.Element',
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const panel = node.slots?.find((slot) => slot.name === 'default')
    const value = panel && !panel.params[0].unused ? panel.params[0].name : 'mavisValue'
    // Each panel is content of its own: a field in it takes focus per tab.
    emit.forKeys.push(value)
    const body = (panel?.body ?? []).map((child) => emit.view(child, indent + 8, tokens)).join('\n')
    emit.forKeys.pop()
    const args = [
      `label: ${emit.value(props.label)}`,
      `tabs: ${mapped(props.tabs, tab, 'MavisTab', emit)}`,
      `value: ${emit.expr(props.value.expr)}`,
      ...handlers(props, ['onChange'], emit, indent),
      ...settings(props, ['disabled', 'keepAlive'], emit),
      `panel: { (${value}: MavisChoiceValue) in\n${body || `${pad}        EmptyView()`}\n${pad}    }`,
    ]
    return [
      `${pad}MavisTabs(`,
      args.map((arg) => `${pad}    ${arg}`).join(',\n'),
      `${pad})`,
      ...accessibility({ id: props.id, accessibilityHidden: props.accessibilityHidden }, context, {
        container: true,
      }),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime({ theme, metric, font }) {
    const body = theme.typography.body
    return `/// One tab of MTabs, without the shared record type so every project can use it.
struct MavisTab: Hashable {
    let value: MavisChoiceValue
    let label: String
    var disabled = false
}

private struct MavisTabBounds: PreferenceKey {
    static let defaultValue: [MavisChoiceValue: Anchor<CGRect>] = [:]
    static func reduce(value: inout [MavisChoiceValue: Anchor<CGRect>], nextValue: () -> [MavisChoiceValue: Anchor<CGRect>]) {
        value.merge(nextValue()) { _, next in next }
    }
}

/// A tab of the strip: the theme's soft primary under the pointer and while pressed, and a ring
/// when the keyboard is on it.
private struct MavisTabStyle: ButtonStyle {
    @Environment(\\.mavisTheme) private var mavisTheme
    let ring: Bool
    func makeBody(configuration: Configuration) -> some View {
        MavisTabFace(configuration: configuration, ring: ring)
    }
}

private struct MavisTabFace: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let configuration: ButtonStyleConfiguration
    let ring: Bool
    @State private var hovered = false
    @Environment(\\.isEnabled) private var isEnabled
    var body: some View {
        let shape = UnevenRoundedRectangle(topLeadingRadius: 12, topTrailingRadius: 12)
        configuration.label
            .background((hovered || configuration.isPressed) && isEnabled ? MavisTokens.primarySoft : MavisColor.clear, in: shape)
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(ring ? MavisTokens.primary : MavisColor.clear, lineWidth: 2).padding(4).allowsHitTesting(false))
            .contentShape(Rectangle())
            .onHover { hovered = $0 }
    }
}

/// MTabs: a strip of tabs, named by label, over the panel of the selected one. The value belongs
/// to the source: a tab asks for it and the source decides. The strip scrolls sideways when the
/// tabs do not fit, and Jolt moves the indicator to the selected tab; Reduce Motion puts it there.
/// Only the selected tab's panel exists, unless keepAlive keeps the ones that were shown.
struct MavisTabs<Panel: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let tabs: [MavisTab]
    let value: MavisChoiceValue?
    var onChange: (MavisChoiceValue) -> Void = { _ in }
    var disabled = false
    var keepAlive = false
    @ViewBuilder let panel: (MavisChoiceValue) -> Panel
    @State private var visited: [MavisChoiceValue] = []
    // The tab the arrow keys are on; Return and Space ask for it.
    @State private var cursor: MavisChoiceValue?
    @FocusState private var focused: Bool
    @Environment(\\.layoutDirection) private var direction

    private static var slide: JoltTransition {
        (try? .cubicBezier(milliseconds: 220, points: [0.2, 0.8, 0.2, 1])) ?? .spring(.smooth)
    }

    private var active: MavisTab? { tabs.first { $0.value == value } }

    /// canChoose in the Mavis core.
    private func request(_ tab: MavisTab) {
        guard !disabled, !tab.disabled, tab.value != value else { return }
        onChange(tab.value)
    }

    /// tabFocusTarget in the Mavis core: the arrows, Home and End move among the enabled tabs.
    private func key(_ press: KeyPress) -> KeyPress.Result {
        guard !disabled, press.modifiers.isDisjoint(with: [.option, .control, .command]) else { return .ignored }
        let enabled = tabs.filter { !$0.disabled }
        guard !enabled.isEmpty else { return .ignored }
        let current = cursor ?? value
        switch press.key {
        case .home: cursor = enabled[0].value
        case .end: cursor = enabled[enabled.count - 1].value
        case .leftArrow, .rightArrow:
            let step = (press.key == .rightArrow ? 1 : -1) * (direction == .rightToLeft ? -1 : 1)
            let index = enabled.firstIndex { $0.value == current } ?? -1
            cursor = enabled[((index + step) % enabled.count + enabled.count) % enabled.count].value
        case .return, .space:
            guard let tab = enabled.first(where: { $0.value == current }) else { return .ignored }
            request(tab)
        default: return .ignored
        }
        return .handled
    }

    private func button(_ tab: MavisTab) -> some View {
        let selected = tab.value == value
        return Button(action: { request(tab) }) {
            Text(verbatim: tab.label)
                .font(${font('body')}.weight(.semibold))
                .lineLimit(1)
                .frame(minHeight: ${body.fontSize * 1.4})
                .padding(.horizontal, 20)
                .padding(.top, 14)
                .padding(.bottom, 17)
                .foregroundStyle(selected ? MavisTokens.primary : MavisTokens.muted)
        }
        .buttonStyle(MavisTabStyle(ring: focused && (cursor ?? value) == tab.value))
        .disabled(disabled || tab.disabled)
        .opacity(disabled || tab.disabled ? 0.4 : 1)
        .accessibilityAddTraits(selected ? .isSelected : [])
        .anchorPreference(key: MavisTabBounds.self, value: .bounds) { [tab.value: $0] }
        .id(tab.value)
    }

    private var strip: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 0) {
                    ForEach(tabs, id: \\.value) { button($0) }
                }
                .padding(.top, 4)
                .padding(.bottom, 1)
                .overlayPreferenceValue(MavisTabBounds.self) { bounds in
                    GeometryReader { area in
                        if let value, let anchor = bounds[value] {
                            let rect = area[anchor]
                            Capsule()
                                .fill(MavisTokens.primary)
                                .frame(width: rect.width, height: 3)
                                .offset(x: rect.minX, y: area.size.height - 3)
                                .joltLayout(value: value, transition: Self.slide)
                        }
                    }
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
                }
            }
            .background(alignment: .bottom) { Rectangle().fill(MavisTokens.border).frame(height: 1) }
            // A tab chosen by the source or reached with the keyboard comes into view.
            .onChange(of: value) { _, next in
                cursor = nil
                if let next { proxy.scrollTo(next) }
            }
            .onChange(of: cursor) { _, next in
                if let next { proxy.scrollTo(next) }
            }
        }
        .focusable(!disabled)
        .focused($focused)
        .focusEffectDisabled()
        .onKeyPress(action: key)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }

    @ViewBuilder private var panels: some View {
        if keepAlive {
            ZStack(alignment: .topLeading) {
                ForEach(tabs.filter { visited.contains($0.value) || $0.value == value }, id: \\.value) { tab in
                    let shown = tab.value == value
                    MavisColumn { panel(tab.value) }
                        .frame(maxWidth: shown ? .infinity : 0, alignment: .topLeading)
                        .frame(height: shown ? nil : 0, alignment: .topLeading)
                        .clipped()
                        .opacity(shown ? 1 : 0)
                        .allowsHitTesting(shown)
                        .disabled(!shown)
                        .accessibilityHidden(!shown)
                }
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
        } else if let active {
            MavisColumn { panel(active.value) }
                .frame(maxWidth: .infinity, alignment: .topLeading)
                .id(active.value)
        }
    }

    var body: some View {
        let _ = mavisValidateChoices(tabs.map { MavisChoice(value: $0.value, label: $0.label, disabled: $0.disabled) }, value: value)
        VStack(alignment: .leading, spacing: ${metric('space.md')}) {
            strip
            panels
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .onChange(of: value, initial: true) { _, next in
            if let next, !visited.contains(next) { visited.append(next) }
        }
        // A tab that leaves the list takes its kept panel with it.
        .onChange(of: tabs) { _, next in
            visited = visited.filter { kept in next.contains { $0.value == kept } }
        }
    }
}`
  },
  vue: { ...choiceModel, types: ['TabOption'] },
}
