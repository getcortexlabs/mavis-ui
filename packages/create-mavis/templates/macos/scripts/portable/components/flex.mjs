// The layout MColumn, MRow and MCard share on the Mac, and what their children tell it.

/** Swift helpers several components call; written once, before the first component using them. */
export const flexRuntime = {
  swiftRuntime: () => `enum MavisJustify: String {
    case start, center, end, between, around
    init(_ name: String) { self = MavisJustify(rawValue: name) ?? .start }
}

enum MavisAlign: String {
    case start, center, end, stretch
    init(_ name: String) { self = MavisAlign(rawValue: name) ?? .start }
}

/// width and height as the sources write them: layout units, a share of the container, or the content's own size.
enum MavisDimension: Equatable {
    case auto, points(Double), fraction(Double)

    func resolved(in available: CGFloat?) -> CGFloat? {
        switch self {
        case .auto: return nil
        case .points(let value): return CGFloat(max(0, value))
        case .fraction(let share): return available.map { $0 * CGFloat(max(0, share)) }
        }
    }
}

/// What a child tells the MColumn or MRow that lays it out.
struct MavisFlexItem: Equatable {
    var grow: Double = 0
    var shrink: Double? = nil
    var width: MavisDimension = .auto
    var height: MavisDimension = .auto
}

private struct MavisFlexItemKey: LayoutValueKey {
    static let defaultValue = MavisFlexItem()
}

private struct MavisInFlexKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// True for the children of an MColumn, MRow or MCard: MavisFlex sizes them.
    var mavisInFlex: Bool {
        get { self[MavisInFlexKey.self] }
        set { self[MavisInFlexKey.self] = newValue }
    }
}

/// The flexbox subset of the Mavis layout contract, measured like the Web. A child starts at its
/// width or height property, or at its content's size. Free space goes to the children that
/// grow and a shortage comes out of those that shrink (a row's children by default, a column's
/// only when asked). With wrap, a child that does not fit starts the next line. A size this
/// layout is offered is the size it takes; with none offered it takes its content's size.
struct MavisFlex: Layout {
    var axis: Axis
    var spacing: Double = 0
    var justify: MavisJustify = .start
    var align: MavisAlign = .stretch
    var wrap: Bool = false

    private var row: Bool { axis == .horizontal }

    private func offered(_ value: CGFloat?) -> CGFloat? {
        guard let value, value.isFinite else { return nil }
        return max(0, value)
    }

    private func arrange(_ proposal: ProposedViewSize, _ subviews: Subviews) -> (size: CGSize, frames: [CGRect]) {
        let width = offered(proposal.width)
        let height = offered(proposal.height)
        let mainSize = row ? width : height
        let crossSize = row ? height : width
        let gap = CGFloat(spacing)
        let count = subviews.count
        guard count > 0 else { return (CGSize(width: width ?? 0, height: height ?? 0), []) }
        let items = subviews.map { $0[MavisFlexItemKey.self] }
        let declaredMain = items.map { (row ? $0.width : $0.height).resolved(in: mainSize) }
        let declaredCross = items.map { (row ? $0.height : $0.width).resolved(in: crossSize) }
        let content = subviews.map { $0.sizeThatFits(.unspecified) }

        // A column settles each child's width first: its height follows from it.
        var cross = [CGFloat](repeating: 0, count: count)
        if !row {
            let natural = (0..<count).map { declaredCross[$0] ?? content[$0].width }
            let limit = crossSize ?? natural.max() ?? 0
            for index in 0..<count {
                cross[index] = declaredCross[index] ?? (align == .stretch && !wrap ? limit : min(natural[index], limit))
            }
        }
        let base = (0..<count).map { index -> CGFloat in
            if let declared = declaredMain[index] { return declared }
            if row { return content[index].width }
            return subviews[index].sizeThatFits(ProposedViewSize(width: cross[index], height: nil)).height
        }

        var lines: [[Int]] = [[]]
        var used: CGFloat = 0
        for index in 0..<count {
            let next = used + (lines[lines.count - 1].isEmpty ? 0 : gap) + base[index]
            if wrap, let mainSize, !lines[lines.count - 1].isEmpty, next > mainSize + 0.5 {
                lines.append([index])
                used = base[index]
            } else {
                lines[lines.count - 1].append(index)
                used = next
            }
        }

        var main = base
        if let mainSize {
            for line in lines {
                let free = mainSize - line.map { base[$0] }.reduce(0, +) - gap * CGFloat(line.count - 1)
                if free > 0 {
                    let total = line.map { CGFloat(max(0, items[$0].grow)) }.reduce(0, +)
                    guard total > 0 else { continue }
                    for index in line { main[index] += free * CGFloat(max(0, items[index].grow)) / total }
                } else if free < 0 {
                    let factors = line.map { CGFloat(max(0, items[$0].shrink ?? (row ? 1 : 0))) * base[$0] }
                    let total = factors.reduce(0, +)
                    guard total > 0 else { continue }
                    for (offset, index) in line.enumerated() {
                        main[index] = max(0, base[index] + free * factors[offset] / total)
                    }
                }
            }
        }
        if row {
            for index in 0..<count {
                cross[index] = declaredCross[index]
                    ?? subviews[index].sizeThatFits(ProposedViewSize(width: main[index], height: nil)).height
            }
        }

        var lineCross = lines.map { line in line.map { cross[$0] }.max() ?? 0 }
        if let crossSize {
            if lines.count == 1 && !wrap {
                lineCross[0] = crossSize
            } else {
                let extra = crossSize - lineCross.reduce(0, +) - gap * CGFloat(lines.count - 1)
                if extra > 0 { lineCross = lineCross.map { $0 + extra / CGFloat(lines.count) } }
            }
        }
        if align == .stretch {
            for (number, line) in lines.enumerated() {
                for index in line where declaredCross[index] == nil { cross[index] = lineCross[number] }
            }
        }

        let lineMain = lines.map { line in
            line.map { main[$0] }.reduce(0, +) + gap * CGFloat(line.count - 1)
        }
        let finalMain = mainSize ?? lineMain.max() ?? 0
        let finalCross = crossSize ?? (lineCross.reduce(0, +) + gap * CGFloat(lines.count - 1))
        var frames = [CGRect](repeating: .zero, count: count)
        var crossOffset: CGFloat = 0
        for (number, line) in lines.enumerated() {
            let free = max(0, finalMain - lineMain[number])
            var offset: CGFloat = 0
            var between = gap
            switch justify {
            case .start: break
            case .center: offset = free / 2
            case .end: offset = free
            case .between: if line.count > 1 { between += free / CGFloat(line.count - 1) }
            case .around:
                between += free / CGFloat(line.count)
                offset = free / CGFloat(line.count) / 2
            }
            for index in line {
                let slack = lineCross[number] - cross[index]
                let shift = align == .center ? slack / 2 : align == .end ? slack : 0
                frames[index] = row
                    ? CGRect(x: offset, y: crossOffset + shift, width: main[index], height: cross[index])
                    : CGRect(x: crossOffset + shift, y: offset, width: cross[index], height: main[index])
                offset += main[index] + between
            }
            crossOffset += lineCross[number] + gap
        }
        return (row ? CGSize(width: finalMain, height: finalCross) : CGSize(width: finalCross, height: finalMain), frames)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(proposal, subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (index, frame) in arrange(ProposedViewSize(bounds.size), subviews).frames.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                anchor: .topLeading,
                proposal: ProposedViewSize(frame.size)
            )
        }
    }
}

/// MColumn: children stretch to its width unless align says otherwise.
struct MavisColumn<Content: View>: View {
    var spacing: Double = 0
    var justify: MavisJustify = .start
    var align: MavisAlign = .stretch
    var wrap: Bool = false
    @ViewBuilder var content: () -> Content
    var body: some View {
        MavisFlex(axis: .vertical, spacing: spacing, justify: justify, align: align, wrap: wrap) { content() }
            .environment(\\.mavisInFlex, true)
    }
}

/// MRow: children sit on its center line unless align says otherwise.
struct MavisRow<Content: View>: View {
    var spacing: Double = 0
    var justify: MavisJustify = .start
    var align: MavisAlign = .center
    var wrap: Bool = false
    @ViewBuilder var content: () -> Content
    var body: some View {
        MavisFlex(axis: .horizontal, spacing: spacing, justify: justify, align: align, wrap: wrap) { content() }
            .environment(\\.mavisInFlex, true)
    }
}

/// width and height on a child. An MColumn or MRow has already resolved them and offers the
/// result; anywhere else they resolve against the space offered here.
private struct MavisSized: Layout {
    var width: MavisDimension
    var height: MavisDimension
    var resolved: Bool

    private func side(_ dimension: MavisDimension, _ offered: CGFloat?) -> CGFloat? {
        let available = offered.flatMap { $0.isFinite ? $0 : nil }
        if dimension == .auto || (resolved && available != nil) { return offered }
        return dimension.resolved(in: available) ?? offered
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let target = ProposedViewSize(width: side(width, proposal.width), height: side(height, proposal.height))
        let content = subviews.first?.sizeThatFits(target) ?? .zero
        return CGSize(
            width: width == .auto ? content.width : target.width ?? content.width,
            height: height == .auto ? content.height : target.height ?? content.height
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews.first?.place(at: bounds.origin, anchor: .topLeading, proposal: ProposedViewSize(bounds.size))
    }
}

private struct MavisItemModifier: ViewModifier {
    let item: MavisFlexItem
    @Environment(\\.mavisInFlex) private var inFlex
    func body(content: Content) -> some View {
        MavisSized(width: item.width, height: item.height, resolved: inFlex) { content }
            .layoutValue(key: MavisFlexItemKey.self, value: item)
    }
}

extension View {
    /// grow, shrink, width and height of a child, as the box contract names them.
    func mavisItem(grow: Double = 0, shrink: Double? = nil, width: MavisDimension = .auto, height: MavisDimension = .auto) -> some View {
        modifier(MavisItemModifier(item: MavisFlexItem(grow: grow, shrink: shrink, width: width, height: height)))
    }
}

/// Set by UI tests and tools that need the bounds of containers: MAVIS_TEST_IDENTIFIERS=1.
private let mavisTestIdentifiers = ProcessInfo.processInfo.environment["MAVIS_TEST_IDENTIFIERS"] == "1"

/// id on a container. An accessibility element over the container would take the hit test
/// from the controls inside it, and SwiftUI merges a container element with the only container
/// inside it. So a container adds nothing to the accessibility tree of a shipped app. A test
/// run gets two clear points with the identifier, at the top-leading and bottom-trailing
/// corners: the container's bounds are the union of the elements that carry its id.
private struct MavisContainerIdentifier: ViewModifier {
    let id: String

    private var corner: some View {
        Color.clear.frame(width: 1, height: 1).accessibilityElement().accessibilityIdentifier(id)
    }

    func body(content: Content) -> some View {
        if mavisTestIdentifiers {
            content
                .background(alignment: .topLeading) { corner }
                .background(alignment: .bottomTrailing) { corner }
        } else {
            content
        }
    }
}

extension View {
    func mavisIdentifier(_ id: String) -> some View {
        modifier(MavisContainerIdentifier(id: id))
    }
}

/// backgroundColor: a hex color, #RGB or #RRGGBB. Anything else is clear.
func mavisColor(_ css: String) -> Color {
    var digits = Array(css.dropFirst())
    guard css.hasPrefix("#"), digits.count == 3 || digits.count == 6, digits.allSatisfy(\\.isHexDigit) else { return .clear }
    if digits.count == 3 { digits = digits.flatMap { [$0, $0] } }
    let values = digits.map { Double($0.hexDigitValue ?? 0) }
    return Color(
        red: (values[0] * 16 + values[1]) / 255,
        green: (values[2] * 16 + values[3]) / 255,
        blue: (values[4] * 16 + values[5]) / 255
    )
}`,
}
