// What the feedback and status components share on the Mac.

/** Swift helpers several of them call; written once, before the first component using them. */
export const feedbackRuntime = {
  swiftRuntime:
    () => `/// A pill as wide as its content, like an inline block on the Web: when the content does not
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
}`,
}
