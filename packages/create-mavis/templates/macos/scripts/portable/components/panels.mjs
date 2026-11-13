import { flexRuntime } from './flex.mjs'
import { union } from './shared.mjs'

const orientations = ['horizontal', 'vertical']
const directions = ['ltr', 'rtl']

// A choice written as a literal or computed, checked while generating when it is a literal.
const oneOf =
  (key, values) =>
  ({ value, ctx, expr, attribute, fail, ts, T }) => {
    if (!ts.isStringLiteral(value)) return { expr: expr(value, ctx, T.string) }
    if (!values.includes(value.text)) fail(attribute, `${key} is ${values.join(' or ')}.`)
    return { lit: value.text }
  }

const percent =
  (key) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !(number.value >= 0 && number.value <= 100))
      fail(attribute, `${key} is a share of the panels, from 0 to 100.`)
    return { expr: number }
  }

const positive =
  (key) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !(number.value > 0)) fail(attribute, `${key} must be positive.`)
    return { expr: number }
  }

const snap = ({ value, ctx, expr, T }) => ({ expr: expr(value, ctx, T.array(T.number)) })

// resizablePanelsProps: two panels and the divider between them. value is the first panel's
// share in percent and belongs to the source, as v-model on the Web and NativeScript: the
// divider asks for a new one by step, snaps within 3 of a snap point when a drag ends, and a
// value the source keeps out leaves the split where it was. collapsible lets it reach 0.
export const MResizablePanels = {
  props: {
    id: 'string',
    label: 'string',
    value: 'number',
    onChange: 'number-handler',
    onResize: 'number-handler',
    min: percent('min'),
    max: percent('max'),
    step: positive('step'),
    snap,
    orientation: oneOf('orientation', orientations),
    direction: oneOf('direction', directions),
    height: positive('height'),
    collapsible: 'boolean',
    disabled: 'boolean',
    primaryLabel: 'string',
    secondaryLabel: 'string',
    collapseLabel: 'string',
    expandLabel: 'string',
  },
  required: ['label', 'value', 'onChange'],
  slots: ['primary', 'secondary'],
  control: true,
  uses: [flexRuntime],
  declaration: `declare function MResizablePanels(props: { id?: string; label: string; value: number; onChange: (value: number) => void; onResize?: (value: number) => void; min?: number; max?: number; step?: number; snap?: readonly number[]; orientation?: ${union(orientations)}; direction?: ${union(directions)}; height?: number; collapsible?: boolean; disabled?: boolean; primaryLabel?: string; secondaryLabel?: string; collapseLabel?: string; expandLabel?: string; slotPrimary?: JSX.Element; slotSecondary?: JSX.Element }): JSX.Element`,
  check({ props, attrs, fail }) {
    const literal = (key) => (props[key]?.expr?.e === 'lit' ? props[key].expr.value : undefined)
    const min = literal('min') ?? (props.min ? undefined : 20)
    const max = literal('max') ?? (props.max ? undefined : 80)
    if (min !== undefined && max !== undefined && min >= max)
      fail(attrs.get('min') ?? attrs.get('max'), 'min is below max: 0 <= min < max <= 100.')
  },
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const choice = (prop, yes) =>
      'lit' in prop
        ? String(prop.lit === yes)
        : `(${emit.expr(prop.expr)} == ${JSON.stringify(yes)})`
    const panel = (name) => {
      const body = (node.slots?.find((slot) => slot.name === name)?.body ?? [])
        .map((child) => emit.view(child, indent + 8, tokens))
        .join('\n')
      return `${pad}    ${name}: {\n${body || `${pad}        EmptyView()`}\n${pad}    }`
    }
    const args = [
      `label: ${emit.value(props.label)}`,
      `value: ${emit.expr(props.value.expr)}`,
      `onChange: ${emit.handler(props.onChange, indent + 4)}`,
      ...(props.onResize ? [`onResize: ${emit.handler(props.onResize, indent + 4)}`] : []),
      ...['min', 'max', 'step'].flatMap((key) =>
        props[key]
          ? [
              `${{ min: 'minimum', max: 'maximum', step: 'step' }[key]}: ${emit.expr(props[key].expr)}`,
            ]
          : [],
      ),
      ...(props.snap ? [`snap: ${emit.expr(props.snap.expr)}`] : []),
      ...(props.orientation ? [`vertical: ${choice(props.orientation, 'vertical')}`] : []),
      ...(props.direction ? [`rtl: ${choice(props.direction, 'rtl')}`] : []),
      ...(props.height ? [`height: ${emit.expr(props.height.expr)}`] : []),
      ...['collapsible', 'disabled'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
      ...['primaryLabel', 'secondaryLabel', 'collapseLabel', 'expandLabel'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
    ]
    return [
      `${pad}MavisPanels(`,
      [...args.map((arg) => `${pad}    ${arg}`), panel('primary'), panel('secondary')].join(',\n'),
      `${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
  }) => `/// MResizablePanels: two panels and the divider between them, named by label. The value is the
/// first panel's share in percent and belongs to the source: the pointer, the keyboard and
/// VoiceOver ask for a new one, and a value the source keeps out leaves the divider where it
/// was. Jolt settles the divider after a change that is not a drag; Reduce Motion puts it there.
struct MavisPanels<Primary: View, Secondary: View>: View {
    let label: String
    let value: Double
    let onChange: (Double) -> Void
    var onResize: (Double) -> Void = { _ in }
    var minimum: Double = 20
    var maximum: Double = 80
    var step: Double = 2
    var snap: [Double] = [25, 50, 75]
    var vertical: Bool = false
    var rtl: Bool = false
    var height: Double = 360
    var collapsible: Bool = false
    var disabled: Bool = false
    var primaryLabel: String = "First panel"
    var secondaryLabel: String = "Second panel"
    var collapseLabel: String = "Collapse panel"
    var expandLabel: String = "Expand panel"
    @ViewBuilder var primary: () -> Primary
    @ViewBuilder var secondary: () -> Secondary
    // The value when a drag began; a drag Escape cancelled is ignored until it ends.
    @State private var origin: Double?
    @State private var cancelled = false
    @State private var remembered: Double?
    @State private var travel: Double = 1
    @FocusState private var focused: Bool

    private static var settle: JoltTransition { try! .spring(milliseconds: 340, bounce: 0.08) }

    /// panelValue in the Mavis core.
    private var current: Double {
        collapsible && value == 0 ? 0 : Swift.min(maximum, Swift.max(minimum, value))
    }
    private var lowest: Double { collapsible ? 0 : minimum }

    /// usePartition in the Mavis core: whole steps from the lowest value, in range, asked for when
    /// they change the split.
    private func update(_ wanted: Double) {
        guard !disabled, step > 0, wanted.isFinite else { return }
        let next = Swift.min(maximum, Swift.max(lowest, lowest + mavisRound((wanted - lowest) / step) * step))
        if next != Swift.min(maximum, Swift.max(lowest, current)) { ask(next) }
    }

    private func ask(_ next: Double) {
        let rounded = (next * 100_000_000).rounded() / 100_000_000
        onChange(rounded == 0 && collapsible ? 0 : Swift.max(minimum, rounded))
    }

    private func cancel() {
        guard let start = origin else { return }
        origin = nil
        cancelled = true
        ask(start)
    }

    // The nearest snap point within 3 takes the divider; resize reports where it ends.
    private func finish() {
        let nearest = snap
            .filter { $0.isFinite && $0 >= minimum && $0 <= maximum }
            .min { abs($0 - current) < abs($1 - current) }
        if let nearest, abs(nearest - current) <= 3 {
            onChange(nearest)
            onResize(nearest)
        } else {
            onResize(current)
        }
    }

    private func toggle() {
        guard collapsible, !disabled else { return }
        if current != 0 {
            remembered = current
            onChange(0)
        } else {
            onChange(Swift.max(minimum, Swift.min(maximum, remembered ?? Swift.max(minimum, 40))))
        }
    }

    private var drag: some Gesture {
        DragGesture(minimumDistance: 1)
            .onChanged { gesture in
                guard !disabled, !cancelled else { return }
                let start = origin ?? Swift.min(maximum, Swift.max(lowest, current))
                if origin == nil {
                    origin = start
                    focused = true
                }
                let delta = vertical ? gesture.translation.height : gesture.translation.width * (rtl ? -1 : 1)
                update(start + delta / travel * 100)
            }
            .onEnded { _ in
                defer { cancelled = false }
                guard origin != nil else { return }
                origin = nil
                finish()
            }
    }

    private func key(_ press: KeyPress) -> KeyPress.Result {
        guard !disabled, press.modifiers.isDisjoint(with: [.option, .control, .command]) else { return .ignored }
        switch press.key {
        case .home: update(minimum)
        case .end: update(maximum)
        case .return where collapsible: toggle()
        case .escape: cancel()
        default:
            let forward: Double = vertical
                ? (press.key == .downArrow ? 1 : press.key == .upArrow ? -1 : 0)
                : (press.key == .rightArrow ? 1 : press.key == .leftArrow ? -1 : 0) * (rtl ? -1 : 1)
            guard forward != 0 else { return .ignored }
            update(current + forward * step * (press.modifiers.contains(.shift) ? 5 : 1))
        }
        return .handled
    }

    private func panel<Content: View>(_ name: String, hidden: Bool, @ViewBuilder _ content: @escaping () -> Content) -> some View {
        ScrollView(.vertical) {
            MavisColumn { content() }
                .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .opacity(hidden ? 0 : 1)
        .allowsHitTesting(!hidden)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: name))
        .accessibilityHidden(hidden)
    }

    private var divider: some View {
        ZStack {
            Rectangle().fill(MavisTokens.elevated)
            RoundedRectangle(cornerRadius: 4)
                .fill(MavisTokens.muted)
                .frame(width: vertical ? 28 : 4, height: vertical ? 4 : 28)
                .accessibilityHidden(true)
        }
        .frame(width: vertical ? nil : 44, height: vertical ? 44 : nil)
        .contentShape(Rectangle())
        .focusable(!disabled, interactions: .edit)
        .focused($focused)
        .onKeyPress(action: key)
        .gesture(drag)
        .simultaneousGesture(TapGesture().onEnded { if !disabled { focused = true } })
        .onTapGesture(count: 2) { toggle() }
        .accessibilityElement()
        .accessibilityLabel(Text(verbatim: label))
        .accessibilityValue(Text(verbatim: mavisString(mavisRound(current)) + "%"))
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: update(current + step)
            case .decrement: update(current - step)
            @unknown default: break
            }
        }
        .accessibilityIdentifier("mavis-divider:" + label)
    }

    @ViewBuilder private func split(_ length: Double) -> some View {
        let first: Double = Swift.max(0, length - 44) * current / 100
        if vertical {
            VStack(spacing: 0) {
                panel(primaryLabel, hidden: current == 0, primary).frame(height: first)
                divider
                panel(secondaryLabel, hidden: false, secondary).frame(maxHeight: .infinity)
            }
        } else {
            HStack(spacing: 0) {
                panel(primaryLabel, hidden: current == 0, primary).frame(width: first)
                divider
                panel(secondaryLabel, hidden: false, secondary).frame(maxWidth: .infinity)
            }
            .environment(\\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
        }
    }

    private var box: some View {
        GeometryReader { proxy in
            let length: Double = vertical ? proxy.size.height : proxy.size.width
            split(length)
                // The Web measures a drag over the panels' box, border included, less the divider.
                .onAppear { travel = Swift.max(1, length + 2 - 44) }
                .onChange(of: length) { _, next in travel = Swift.max(1, next + 2 - 44) }
        }
        .padding(1)
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
        .joltLayout(value: origin == nil ? current : -1, transition: Self.settle)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            box
            if collapsible {
                Button(action: toggle) {
                    MavisButtonLabel(text: current != 0 ? collapseLabel : expandLabel, variant: .ghost)
                }
                .buttonStyle(MavisButtonStyle(variant: .ghost))
                .fixedSize()
                .disabled(disabled)
            }
        }
        .onChange(of: disabled) { _, next in if next { cancel() } }
        .onChange(of: vertical) { _, _ in cancel() }
        .onChange(of: rtl) { _, _ in cancel() }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
  },
}
