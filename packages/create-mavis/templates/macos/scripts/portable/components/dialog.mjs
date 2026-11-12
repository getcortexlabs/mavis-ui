import { flexRuntime } from './flex.mjs'
import { layerRuntime } from './layers.mjs'
import { union } from './shared.mjs'

const reasons = ['cancel', 'backdrop', 'escape', 'back', 'program', 'navigation', 'swipe']
const tones = ['default', 'danger']
const labels = ['title', 'confirmLabel', 'cancelLabel', 'loadingLabel']

// dialogProps: a question with a confirm and a cancel action over the screen. It is controlled
// like the sheet: open belongs to the source, Cancel, Escape and the scrim ask to close through
// onUpdateOpen (update:open) with a reason in onClose, and onConfirm leaves closing to the source.
// loading keeps the dialog as it is until the source is done.
export const MDialog = {
  props: {
    id: 'string',
    open: 'boolean',
    onUpdateOpen: 'boolean-handler',
    // The Web's drag presentation; NativeScript and the Mac show the dialog in place.
    interactive: 'boolean',
    title: 'string',
    description: 'string',
    confirmLabel: 'string',
    cancelLabel: 'string',
    loadingLabel: 'string',
    tone: 'string',
    loading: 'boolean',
    dismissible: 'boolean',
    onConfirm: 'handler',
    onClose: 'string-handler',
  },
  required: ['title'],
  control: true,
  uses: [flexRuntime, layerRuntime],
  types: () => `type DialogCloseReason = ${union(reasons)}`,
  declaration: `declare function MDialog(props: { id?: string; open?: boolean; onUpdateOpen?: (open: boolean) => void; interactive?: boolean; title: string; description?: string; confirmLabel?: string; cancelLabel?: string; loadingLabel?: string; tone?: ${union(tones)}; loading?: boolean; dismissible?: boolean; onConfirm?: () => void; onClose?: (reason: DialogCloseReason) => void }): JSX.Element`,
  check({ props, attrs, fail }) {
    for (const key of labels)
      if (props[key] && 'lit' in props[key] && !props[key].lit.trim())
        fail(
          attrs.get(key),
          `${key} cannot be blank: a dialog without it fails on the Web and NativeScript.`,
        )
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      `open: ${props.open ? emit.expr(props.open.expr) : 'false'}`,
      `title: ${emit.value(props.title)}`,
      ...['description', 'confirmLabel', 'cancelLabel', 'loadingLabel'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
      ...(props.tone
        ? [
            `danger: ${'lit' in props.tone ? props.tone.lit === 'danger' : `${emit.expr(props.tone.expr)} == "danger"`}`,
          ]
        : []),
      ...['loading', 'dismissible'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
      ...(props.id ? [`id: ${emit.value(props.id)}`] : []),
      ...['onUpdateOpen', 'onConfirm', 'onClose'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.handler(props[key], indent + 4)}`] : [],
      ),
    ]
    return `${pad}MavisDialog(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// MDialog: a question with a confirm and a cancel action in a layer over the window's content,
/// laid out as the Web's dialog: a scrim, and in the middle a panel 440 points wide at most with a
/// symbol, the title, the description and the two actions. The dialog is controlled: Cancel,
/// Escape and the scrim ask the source to close it, with their reason, and confirming leaves that
/// to the source. While loading nothing in it answers. Return confirms, except a dangerous action.
struct MavisDialog: View {
    let open: Bool
    let title: String
    var description = ""
    var confirmLabel = "Continue"
    var cancelLabel = "Cancel"
    var loadingLabel = "Working…"
    var danger = false
    var loading = false
    var dismissible = true
    var id: String? = nil
    var onUpdateOpen: (Bool) -> Void = { _ in }
    var onConfirm: () -> Void = {}
    var onClose: (String) -> Void = { _ in }
    @Namespace private var layer
    @State private var requested: String?
    @State private var window = MavisWindowBox()
    @Environment(\\.mavisTheme) private var theme

    private func request(_ reason: String) {
        guard open, requested == nil, !loading, reason == "cancel" || dismissible else { return }
        requested = reason
        onUpdateOpen(false)
        onClose(reason)
    }

    private func confirm() {
        guard open, !loading, requested == nil else { return }
        onConfirm()
    }

    var body: some View {
        let panel = MavisDialogPanel(
            open: open, title: title, description: description, confirmLabel: confirmLabel, cancelLabel: cancelLabel,
            loadingLabel: loadingLabel, danger: danger, loading: loading, id: id, request: request, confirm: confirm
        )
        let settled = panel.environment(\\.mavisTheme, theme).mavisSettled(unless: window)
        MavisLayerSite(layers: [MavisLayer(id: layer) { _ in AnyView(settled) }], modal: open, open: open, window: window)
            .onChange(of: open) { _, next in
                if !next, requested == nil { onClose("program") }
                requested = nil
            }
            .onChange(of: requested) { _, reason in
                guard reason != nil else { return }
                // Once the source has answered: a dialog it keeps open can be asked again.
                DispatchQueue.main.async { requested = nil }
            }
    }
}

private struct MavisDialogPanel: View {
    let open: Bool
    let title: String
    let description: String
    let confirmLabel: String
    let cancelLabel: String
    let loadingLabel: String
    let danger: Bool
    let loading: Bool
    let id: String?
    let request: (String) -> Void
    let confirm: () -> Void
    @State private var heights: [String: CGFloat] = [:]
    @Environment(\\.mavisTheme) private var theme

    private var symbol: some View {
        MavisIcon(danger ? "triangle-alert" : "circle-check", size: 24)
            .foregroundStyle(danger ? MavisTokens.danger : MavisTokens.primary)
            .frame(width: 48, height: 48)
            .background(danger ? MavisTokens.elevated : MavisTokens.primarySoft, in: RoundedRectangle(cornerRadius: 16))
    }

    private var message: some View {
        VStack(alignment: .leading, spacing: 0) {
            symbol.padding(.bottom, 20)
            Text(verbatim: title)
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
                .accessibilityHeading(.h2)
                .padding(.bottom, 12)
            if !description.isEmpty {
                Text(verbatim: description)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var actions: some View {
        HStack(spacing: 12) {
            Button(action: { request("cancel") }) {
                Text(verbatim: cancelLabel)
            }
            .buttonStyle(MavisButtonStyle(variant: .secondary))
            .disabled(loading)
            Button(action: confirm) {
                MavisButtonLabel(text: confirmLabel, loading: loading, loadingText: loadingLabel)
            }
            .buttonStyle(MavisButtonStyle(loading: loading))
            .disabled(loading)
            .keyboardShortcut(danger ? nil : .defaultAction)
            // A dangerous action is drawn in the danger color, as on the Web.
            .environment(\\.mavisTheme, danger ? theme.recolored([.primary: .danger, .onPrimary: .surface]) : theme)
        }
        .fixedSize(horizontal: false, vertical: true)
    }

    private func card(_ size: CGSize) -> some View {
        let room = Swift.max(0, size.height - 120 - (heights["actions"] ?? 0))
        return VStack(alignment: .leading, spacing: 24) {
            ScrollView(.vertical) { message.mavisMeasured("message") }
                .frame(height: Swift.min(heights["message"] ?? 0, room))
                .scrollBounceBehavior(.basedOnSize)
            actions.mavisMeasured("actions")
        }
        .padding(24)
        .frame(width: Swift.min(440, Swift.max(0, size.width - 48)))
        // The shadow is the panel's, not one for each thing in it.
        .background(RoundedRectangle(cornerRadius: ${theme.radius.lg}).fill(MavisTokens.surface).shadow(color: mavisColor("#100B1C").opacity(0.15), radius: 40, y: 24))
        .overlay(RoundedRectangle(cornerRadius: ${theme.radius.lg}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
        .onPreferenceChange(MavisHeightsKey.self) { heights = $0 }
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                mavisColor("#100B1C")
                    .opacity(0.5)
                    .contentShape(Rectangle())
                    .onTapGesture { request("backdrop") }
                    .allowsHitTesting(open)
                    .joltMotion(to: open ? .identity : MavisLayerMotion.hidden, transition: MavisLayerMotion.fade)
                    // After Jolt's modifier: the view it adds to watch the window is hidden too.
                    .accessibilityHidden(true)
                if open { MavisEscape { request("escape") } }
                if let id, open {
                    Color.clear.mavisIdentifier(id).allowsHitTesting(false)
                }
                JoltPresence(open, enter: MavisLayerMotion.enter, leave: MavisLayerMotion.leave) {
                    // An element of its own, so what the panel hides stays hidden while it is present.
                    card(proxy.size)
                        .accessibilityElement(children: .contain)
                        .accessibilityLabel(Text(verbatim: title))
                }
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
        }
    }
}`,
  vue: {
    rename: { onUpdateOpen: 'update:open' },
  },
}
