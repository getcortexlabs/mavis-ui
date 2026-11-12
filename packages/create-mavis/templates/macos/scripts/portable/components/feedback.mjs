// What the feedback and status components share on the Mac.

/** A label the Web and NativeScript refuse blank while rendering: a literal is refused here. */
export const named =
  (what) =>
  ({ key, attribute, value, ctx, expr, fail, ts, T }) => {
    if (!ts.isStringLiteral(value)) return { expr: expr(value, ctx, T.string) }
    if (!value.text.trim()) fail(attribute, `${key} ${what}: it cannot be blank.`)
    return { lit: value.text }
  }

/** The content a parent gave one of a primitive's slots, or none. */
export const slotBody = (node, name) => node.slots?.find((slot) => slot.name === name)?.body

/** A slot's content as the views inside a Swift closure. */
export const slotViews = (nodes, { emit, indent, tokens }, depth = 4) =>
  nodes.map((child) => emit.view(child, indent + depth, tokens)).join('\n') ||
  `${' '.repeat(indent + depth)}EmptyView()`

/** Arguments that are text properties of the node, under their own names. */
export const textArgs = (props, keys, emit) =>
  keys.flatMap((key) => (props[key] ? [`${key}: ${emit.value(props[key])}`] : []))

/** Swift helpers several of them call; written once, before the first component using them. */
export const feedbackRuntime = {
  swiftRuntime: ({
    theme,
  }) => `/// A pill as wide as its content, like an inline block on the Web: when the content does not
/// fit the width it is offered, it wraps and the pill takes that whole width.
struct MavisFitted: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard let content = subviews.first else { return .zero }
        let ideal = content.sizeThatFits(.unspecified)
        guard let width = proposal.width, width.isFinite, width < ideal.width else { return ideal }
        let limit = max(0, width)
        return CGSize(width: limit, height: content.sizeThatFits(ProposedViewSize(width: limit, height: nil)).height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews.first?.place(at: CGPoint(x: bounds.midX, y: bounds.midY), anchor: .center, proposal: ProposedViewSize(bounds.size))
    }
}

/// What a component gets for a slot the source left out: it shows its own content there, or
/// nothing.
struct MavisAbsent: View {
    var body: some View { EmptyView() }
}

/// A button that shows one icon, as an MButton with an icon and no text on the Web: the ghost
/// look in the color it is given, pressed through Jolt, and named by its label.
struct MavisIconButton: View {
    let glyph: String
    let label: String
    var side: Double = ${theme.control.sm.height}
    var iconSize: Double = 16
    var tint: MavisColor = MavisTokens.text
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            MavisIcon(glyph: glyph, size: iconSize)
        }
        .buttonStyle(MavisIconButtonStyle(side: side, tint: tint))
        .accessibilityLabel(Text(verbatim: label))
    }
}

struct MavisIconButtonStyle: ButtonStyle {
    var side: Double
    var tint: MavisColor
    @Environment(\\.isEnabled) private var isEnabled
    private static let pressed = try! JoltPose(scale: ${theme.motion.pressScale})
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(tint)
            .frame(width: side, height: side)
            .contentShape(Rectangle())
            .opacity(isEnabled ? 1 : 0.45)
            .joltMotion(to: configuration.isPressed && isEnabled ? Self.pressed : .identity, transition: .spring(.snappy))
    }
}`,
}
