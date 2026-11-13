import { flexRuntime } from './flex.mjs'
import { layerRuntime } from './layers.mjs'
import { swiftNumber } from '../swift-text.mjs'
import { choice, spacing, union } from './shared.mjs'

const reasons = ['button', 'backdrop', 'escape', 'back', 'swipe', 'program']
const alignments = ['start', 'center', 'end', 'stretch']

const blank = (prop) => !prop || ('lit' in prop && !prop.lit.trim())

// sheetProps: content and actions in a layer over the screen. The sheet is controlled: open
// belongs to the source, and every way of closing asks for it through onUpdateOpen (update:open,
// so v-model:open in a Vue file) and reports why through onClose. The Mac draws the Web's sheet
// in the window: a scrim and a panel at the bottom, moved by Jolt's sheet model.
export const MSheet = {
  props: {
    id: 'string',
    accessibilityLabel: 'string',
    open: 'boolean',
    onUpdateOpen: 'boolean-handler',
    title: 'string',
    dismissible: 'boolean',
    fullscreen: 'boolean',
    closeLabel: 'string',
    padding: 'space',
    gap: 'space',
    align: 'string',
    // Where the Web puts focus back; the Mac has no element ids to look up.
    returnFocus: 'string',
    onClose: 'string-handler',
  },
  children: 'elements',
  control: true,
  uses: [flexRuntime, layerRuntime],
  types: () => `type MavisSheetCloseReason = ${union(reasons)}
/** A sheet has a name: its title, or an accessibilityLabel when it shows no heading. */
type MavisSheetName = { title: string; accessibilityLabel?: string } | { title?: string; accessibilityLabel: string }`,
  declaration: `declare function MSheet(props: MavisSheetName & { id?: string; open?: boolean; onUpdateOpen?: (open: boolean) => void; dismissible?: boolean; fullscreen?: boolean; closeLabel?: string; padding?: MavisSpacing; gap?: MavisSpacing; align?: ${union(alignments)}; returnFocus?: string; onClose?: (reason: MavisSheetCloseReason) => void; children?: unknown }): JSX.Element`,
  check({ tag, props, attrs, fail }) {
    if (blank(props.title) && blank(props.accessibilityLabel))
      fail(
        attrs.get('title') ?? attrs.get('accessibilityLabel') ?? tag,
        'MSheet needs a title, or an accessibilityLabel when it shows no heading: a sheet without a name fails on the Web and NativeScript.',
      )
  },
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const body =
      node.children.map((child) => emit.view(child, indent + 8, tokens)).join('\n') ||
      `${pad}        EmptyView()`
    const args = [
      `open: ${props.open ? emit.expr(props.open.expr) : 'false'}`,
      ...(props.title ? [`title: ${emit.value(props.title)}`] : []),
      ...(props.accessibilityLabel ? [`label: ${emit.value(props.accessibilityLabel)}`] : []),
      ...['dismissible', 'fullscreen', 'closeLabel'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
      ...['padding', 'gap'].flatMap((key) =>
        props[key] ? [`${key}: ${spacing(props[key], context)}`] : [],
      ),
      ...(props.align ? [`align: ${choice(props.align, 'MavisAlign', emit)}`] : []),
      ...(props.id ? [`id: ${emit.value(props.id)}`] : []),
      ...['onUpdateOpen', 'onClose'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.handler(props[key], indent + 4)}`] : [],
      ),
      `content: {\n${body}\n${pad}    }`,
    ]
    return `${pad}MavisSheet(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// What a sheet opened with: dismissible and fullscreen are read then, as on the Web.
struct MavisSheetOptions: Equatable {
    var dismissible = true
    var fullscreen = false
}

/// MSheet: content and actions in a layer over the window's content, laid out as the Web's sheet:
/// a scrim, and a panel on the theme surface at the bottom, 560 points wide at most and as tall
/// as its content, or the whole window with fullscreen. Jolt's sheet model moves the panel: it
/// springs in and out, follows a drag of the handle and settles open or closed where the drag
/// ends. The sheet is controlled: the close button, Escape, the scrim and a drag ask the source to
/// close it through onUpdateOpen and onClose, and the panel leaves when open turns false.
struct MavisSheet<Content: View>: View {
    let open: Bool
    var title = ""
    var label = ""
    var dismissible = true
    var fullscreen = false
    var closeLabel = "Close"
    var padding = ${swiftNumber(theme.space.lg)}
    var gap = 0.0
    var align = MavisAlign.stretch
    var id: String? = nil
    var onUpdateOpen: (Bool) -> Void = { _ in }
    var onClose: (String) -> Void = { _ in }
    @ViewBuilder let content: () -> Content
    @Namespace private var layer
    @State private var model: JoltSheetModel?
    @State private var options = MavisSheetOptions()
    /// open, as the answer to a request to close reads it.
    @State private var shown = false
    @State private var closing: String?
    @State private var window = MavisWindowBox()
    @Environment(\\.mavisTheme) private var theme
    @Environment(\\.accessibilityReduceMotion) private var reduceMotion

    private var still: Bool { reduceMotion || !window.onScreen }

    private func present() {
        closing = nil
        if let model {
            model.setReducedMotion(still)
            try? model.open()
            return
        }
        // The model can always be dismissed: open turning false closes a sheet that is not dismissible too.
        guard let next = try? JoltSheetModel(snaps: [fullscreen ? .fraction(1) : .content]) else { return }
        next.setReducedMotion(still)
        try? next.open()
        options = MavisSheetOptions(dismissible: dismissible, fullscreen: fullscreen)
        model = next
    }

    private func request(_ reason: String) {
        guard shown, closing == nil else { return }
        closing = reason
        onUpdateOpen(false)
        onClose(reason)
    }

    private func leave() {
        if closing == nil { onClose("program") }
        closing = nil
        guard let model else { return }
        model.setReducedMotion(still)
        if model.isOpen { model.dismiss() }
        settle()
    }

    /// Removes a panel that has left, unless the sheet opened again meanwhile.
    private func settle() {
        guard let model, !shown, !model.isOpen, model.geometry == nil || model.visibleHeight <= 0.5 else { return }
        model.dispose()
        self.model = nil
    }

    private func layers() -> [MavisLayer] {
        guard let model else { return [] }
        let panel = MavisSheetPanel(
            model: model, title: mavisTrim(title), name: mavisTrim(title).isEmpty ? mavisTrim(label) : mavisTrim(title),
            options: options, closeLabel: closeLabel, padding: padding, gap: gap, align: align, id: id,
            request: request, settled: settle, content: content
        )
        return [MavisLayer(id: layer) { _ in AnyView(panel.environment(\\.mavisTheme, theme)) }]
    }

    var body: some View {
        MavisLayerSite(layers: layers(), modal: model != nil, open: model != nil, window: window)
            .onAppear {
                shown = open
                if open { present() }
            }
            .onChange(of: open) { _, next in
                shown = next
                if next { present() } else { leave() }
            }
            .onChange(of: closing) { _, reason in
                guard let reason else { return }
                // Once the source has answered: a sheet it keeps open stays, and a panel that was
                // dragged away comes back.
                DispatchQueue.main.async {
                    guard shown, closing == reason else { return }
                    closing = nil
                    if let model, !model.isOpen {
                        model.setReducedMotion(still)
                        try? model.open()
                    }
                }
            }
            .onChange(of: reduceMotion) { _, _ in model?.setReducedMotion(still) }
            .onDisappear {
                model?.dispose()
                model = nil
            }
    }
}

private struct MavisSheetPanel<Content: View>: View {
    @ObservedObject var model: JoltSheetModel
    let title: String
    let name: String
    let options: MavisSheetOptions
    let closeLabel: String
    let padding: Double
    let gap: Double
    let align: MavisAlign
    let id: String?
    let request: (String) -> Void
    let settled: () -> Void
    @ViewBuilder let content: () -> Content
    @State private var heights: [String: CGFloat] = [:]
    @State private var dragging = false
    @GestureState private var held = false

    private var headed: Bool { !title.isEmpty || options.dismissible }

    /// The panel around its content, as the Web lays it out: the padding, then the handle, the
    /// header and the content, ${theme.space.md} points apart.
    private func natural(_ heights: [String: CGFloat]) -> Double {
        let parts: [Double] = [
            options.dismissible ? 24 : nil,
            headed ? heights["header"].map { Double($0) } : nil,
            heights["body"].map { Double($0) },
        ].compactMap { $0 }
        return padding * 2 + parts.reduce(0, +) + ${theme.space.md} * Double(Swift.max(0, parts.count - 1))
    }

    private func fit(_ height: CGFloat, _ heights: [String: CGFloat]) {
        guard height > 0, !model.disposed else { return }
        try? model.updateLayout(height: Double(height), contentHeight: Swift.max(1, natural(heights)))
    }

    private var drag: some Gesture {
        DragGesture(minimumDistance: 4, coordinateSpace: .global)
            .updating($held) { _, state, _ in state = true }
            .onChanged { event in
                if !dragging { dragging = model.beginDrag() }
                if dragging { model.drag(by: event.translation.height) }
            }
            .onEnded { event in
                guard dragging else { return }
                dragging = false
                model.endDrag(velocity: event.velocity.height)
                if !model.isOpen { request("swipe") }
            }
    }

    private var handle: some View {
        Capsule()
            .fill(MavisTokens.text)
            .opacity(0.25)
            .frame(width: 40, height: 4)
            .frame(maxWidth: .infinity, minHeight: 24)
            .contentShape(Rectangle())
            .gesture(drag)
            .accessibilityHidden(true)
    }

    private var header: some View {
        MavisRow(spacing: ${theme.space.sm}, justify: .between) {
            if title.isEmpty {
                Color.clear.frame(height: 0).mavisItem(grow: 1)
            } else {
                Text(verbatim: title)
                    .font(${font('heading')})
                    .foregroundStyle(MavisTokens.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityHeading(.h2)
                    .mavisItem(grow: 1)
            }
            if options.dismissible {
                Button(action: { request("button") }) {
                    MavisIcon("x", size: 16)
                }
                .buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm))
                .frame(width: MavisButtonSize.sm.height, height: MavisButtonSize.sm.height)
                .accessibilityLabel(Text(verbatim: closeLabel))
                .help(closeLabel)
                .mavisItem(shrink: 0)
            }
        }
    }

    private var surface: some View {
        VStack(alignment: .leading, spacing: ${theme.space.md}) {
            if options.dismissible { handle }
            // A row takes the height it is offered: the header keeps its own.
            if headed { header.fixedSize(horizontal: false, vertical: true).mavisMeasured("header") }
            ScrollView(.vertical) {
                MavisColumn(spacing: gap, align: align) { content() }
                    .frame(maxWidth: .infinity, alignment: .topLeading)
                    .mavisMeasured("body")
            }
            .scrollBounceBehavior(.basedOnSize)
        }
        .padding(padding)
    }

    var body: some View {
        GeometryReader { proxy in
            let stop = model.geometry?.stops.first?.height ?? 0
            let width = options.fullscreen ? proxy.size.width : Swift.min(560, proxy.size.width)
            let radius: CGFloat = options.fullscreen ? 0 : ${theme.radius.lg}
            let shape = UnevenRoundedRectangle(topLeadingRadius: radius, topTrailingRadius: radius)
            ZStack(alignment: .top) {
                Color.black
                    .opacity(0.45 * Swift.min(1, model.visibleHeight / Swift.max(1, stop)))
                    .contentShape(Rectangle())
                    .onTapGesture { if options.dismissible { request("backdrop") } }
                    .accessibilityHidden(true)
                if options.dismissible { MavisEscape { request("escape") } }
                if let id {
                    Color.clear
                        .frame(width: width, height: proxy.size.height)
                        .mavisIdentifier(id)
                        .allowsHitTesting(false)
                }
                surface
                    .frame(width: width, height: Swift.max(1, stop), alignment: .top)
                    .background(MavisTokens.surface, in: shape)
                    .clipShape(shape)
                    .opacity(model.geometry == nil ? 0 : 1)
                    .offset(y: model.position)
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel(Text(verbatim: name))
            }
            .frame(width: proxy.size.width, height: proxy.size.height, alignment: .top)
            .clipped()
            .onAppear { fit(proxy.size.height, heights) }
            .onPreferenceChange(MavisHeightsKey.self) { next in
                heights = next
                fit(proxy.size.height, next)
            }
            .onChange(of: proxy.size.height) { _, next in fit(next, heights) }
            .onChange(of: model.isOpen || model.visibleHeight > 0.5) { _, present in
                if !present { settled() }
            }
            .onChange(of: held) { _, next in
                guard !next, dragging else { return }
                dragging = false
                model.cancel()
                try? model.open()
            }
        }
    }
}`,
  vue: {
    rename: { onUpdateOpen: 'update:open' },
  },
}
