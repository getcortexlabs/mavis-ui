// The feedback layer: what tooltips and toasts show over the window on the Mac. The Web moves
// them to the end of the page and NativeScript to the screen's layer; on the Mac the view at the
// root of the window draws them over everything else, with mavisFeedbackLayer().

/** The layer's Swift, written once, before the first component that shows something on it. */
export const layerRuntime = {
  swiftRuntime: ({
    theme,
  }) => `/// Where a tooltip's help sits around its button: PopoverPlacement in the Mavis core.
enum MavisTooltipPlacement: String {
    case bottomStart = "bottom-start", bottomEnd = "bottom-end", topStart = "top-start", topEnd = "top-end"
    init(_ name: String) { self = MavisTooltipPlacement(rawValue: name) ?? .topStart }
    var above: Bool { self == .topStart || self == .topEnd }
    var end: Bool { self == .bottomEnd || self == .topEnd }
}

/// What an MTooltip tells the feedback layer: where its button is and the help to show there.
struct MavisTooltipItem: Identifiable {
    let id: UUID
    let anchor: Anchor<CGRect>
    let text: String
    let name: String
    let placement: MavisTooltipPlacement
    let open: Bool
    let theme: MavisThemeScope
    let hover: (Bool) -> Void
}

struct MavisTooltipKey: PreferenceKey {
    static let defaultValue: [MavisTooltipItem] = []
    static func reduce(value: inout [MavisTooltipItem], nextValue: () -> [MavisTooltipItem]) {
        value.append(contentsOf: nextValue())
    }
}

/// placePopover in the Mavis core: the help above or below its button with a gap of 8, on the
/// other side when it does not fit, and kept 8 from the edges of the window.
private struct MavisTooltipLayout: Layout {
    var anchor: CGRect
    var placement: MavisTooltipPlacement

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        proposal.replacingUnspecifiedDimensions()
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard let help = subviews.first else { return }
        let gap = 8.0, margin = 8.0
        let size = help.sizeThatFits(ProposedViewSize(width: max(0, min(300, bounds.width - 2 * margin)), height: nil))
        let below = anchor.maxY + gap
        let over = anchor.minY - gap - size.height
        let lower = bounds.height - margin
        var above = placement.above
        if above && over < margin && below + size.height <= lower {
            above = false
        } else if !above && below + size.height > lower && over >= margin {
            above = true
        }
        func clamp(_ value: Double, _ least: Double, _ most: Double) -> Double { max(least, min(value, max(least, most))) }
        let x = clamp(placement.end ? anchor.maxX - size.width : anchor.minX, margin, bounds.width - size.width - margin)
        let y = clamp(above ? over : below, margin, lower - size.height)
        help.place(at: CGPoint(x: bounds.minX + x, y: bounds.minY + y), anchor: .topLeading, proposal: ProposedViewSize(size))
    }
}

/// The help of an MTooltip: the theme's text color behind the theme's background color.
private struct MavisTooltipHelp: View {
    let item: MavisTooltipItem
    // componentTransition in Mavis Web: up 3 into place, and down half of that on the way out.
    static let enter = JoltPreset.fadeInUp.recipe(try! JoltPresetParameters(distance: 3, duration: ${theme.motion.enterDuration}))
    static let leave = JoltPreset.fadeOutDown.recipe(try! JoltPresetParameters(distance: 1.5, duration: ${theme.motion.exitDuration}))

    var body: some View {
        // As wide as its text up to the width it is offered, and that whole width once it wraps.
        MavisPillLayout {
            Text(verbatim: item.text)
                .font(.system(size: ${theme.typography.caption.fontSize}))
                .lineSpacing(3)
                .foregroundStyle(MavisTokens.background)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, minHeight: ${theme.typography.caption.fontSize * 1.5}, alignment: .leading)
                .padding(${theme.space.sm})
        }
            .background(MavisTokens.text, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
            .shadow(color: .black.opacity(0.13), radius: 10, x: 0, y: 6)
            .onHover(perform: item.hover)
            // One element as large as the help: its frame is the tooltip's, not the text's.
            .accessibilityElement(children: .combine)
            .accessibilityIdentifier(item.name)
            .environment(\\.mavisTheme, item.theme)
    }
}

private struct MavisFeedbackLayer: ViewModifier {
    func body(content: Content) -> some View {
        content.overlayPreferenceValue(MavisTooltipKey.self) { tooltips in
            GeometryReader { window in
                ForEach(tooltips) { item in
                    MavisTooltipLayout(anchor: window[item.anchor], placement: item.placement) {
                        JoltPresence(item.open, enter: MavisTooltipHelp.enter, leave: MavisTooltipHelp.leave) {
                            MavisTooltipHelp(item: item)
                        }
                    }
                }
            }
        }
    }
}

extension View {
    /// On the view at the root of a window: tooltips and toasts inside it show over it.
    func mavisFeedbackLayer() -> some View { modifier(MavisFeedbackLayer()) }
}`,
}
