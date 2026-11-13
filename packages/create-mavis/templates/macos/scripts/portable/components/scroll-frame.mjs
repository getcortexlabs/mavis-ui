import { expression, handlerJs } from '../js-text.mjs'
import { flexRuntime } from './flex.mjs'
import { scrollRuntime } from './scroll.mjs'

// A literal is checked while generating, as the Web checks it while rendering.
const bounded =
  (key, test, message) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !test(number.value)) fail(attribute, `${key} ${message}`)
    return { expr: number }
  }
const positive = (key) => bounded(key, (value) => value > 0, 'must be positive.')
const literal = (props, key, fallback) =>
  props[key] ? (props[key].expr.e === 'lit' ? props[key].expr.value : undefined) : fallback

const views = (nodes, { emit, indent, tokens }) =>
  nodes.map((child) => emit.view(child, indent + 8, tokens)).join('\n') ||
  `${' '.repeat(indent + 8)}EmptyView()`
const closure = (name, nodes, context) =>
  `${' '.repeat(context.indent + 4)}${name}: {\n${views(nodes, context)}\n${' '.repeat(context.indent + 4)}}`
const slot = (node, name) => node.slots?.find((each) => each.name === name)?.body ?? []

// collapsibleHeaderProps: a region of a fixed height whose content scrolls under a header. The
// header collapses from expandedHeight to collapsedHeight as the content scrolls: its title
// fades into the toolbar's, its artwork moves slower than the content (parallax), and the section
// stays under the toolbar. The toolbar has a back button (back) or the leading slot, a button
// that scrolls back to the top, and the actions slot.
export const MCollapsibleHeader = {
  props: {
    id: 'string',
    title: 'string',
    subtitle: 'string',
    image: 'string',
    height: positive('height'),
    expandedHeight: positive('expandedHeight'),
    collapsedHeight: positive('collapsedHeight'),
    sectionHeight: bounded('sectionHeight', (value) => value >= 0, 'cannot be negative.'),
    parallax: bounded('parallax', (value) => value >= 0 && value <= 1, 'is from 0 to 1.'),
    back: 'boolean',
    backLabel: 'string',
    topLabel: 'string',
    onBack: 'handler',
  },
  required: ['title'],
  children: 'elements',
  slots: ['artwork', 'leading', 'actions', 'section'],
  control: true,
  uses: [flexRuntime, scrollRuntime],
  declaration:
    'declare function MCollapsibleHeader(props: { id?: string; title: string; subtitle?: string; image?: string; height?: number; expandedHeight?: number; collapsedHeight?: number; sectionHeight?: number; parallax?: number; back?: boolean; backLabel?: string; topLabel?: string; onBack?: () => void; slotArtwork?: JSX.Element; slotLeading?: JSX.Element; slotActions?: JSX.Element; slotSection?: JSX.Element; children?: unknown }): JSX.Element',
  check({ tag, props, attrs, fail }) {
    const expanded = literal(props, 'expandedHeight', 240)
    const collapsed = literal(props, 'collapsedHeight', 64)
    if (expanded !== undefined && collapsed !== undefined && expanded <= collapsed)
      fail(
        attrs.get('expandedHeight') ?? attrs.get('collapsedHeight') ?? tag,
        'expandedHeight is above collapsedHeight: the header collapses from one to the other.',
      )
  },
  checkChildren({ element, tag, reader, ctx, fail }) {
    const filled = (name) => element.slots?.some((each) => each.name === name)
    if (element.props.image && filled('artwork'))
      fail(tag, 'image and the artwork slot draw in the same place; use one.')
    if (element.props.back?.expr?.value === true && filled('leading'))
      fail(tag, 'back puts the back button where the leading slot goes; use one.')
    for (const each of element.slots ?? [])
      reader.withoutControls(
        each.body,
        ctx.component,
        tag,
        `MCollapsibleHeader's ${each.name} shows content only: the Web lets the pointer through the header, so a button or field there could not be used. Keep controls in the content.`,
      )
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const number = { height: 'height', expandedHeight: 'expanded', collapsedHeight: 'collapsed' }
    const args = [
      `title: ${emit.value(props.title)}`,
      ...['subtitle', 'image'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
      ...Object.entries({
        ...number,
        sectionHeight: 'sectionHeight',
        parallax: 'parallax',
      }).flatMap(([key, label]) => (props[key] ? [`${label}: ${emit.expr(props[key].expr)}`] : [])),
      ...(props.back ? [`back: ${emit.value(props.back)}`] : []),
      ...['backLabel', 'topLabel'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
      ...(props.onBack ? [`onBack: ${emit.handler(props.onBack, indent + 4)}`] : []),
    ].map((arg) => `${pad}    ${arg}`)
    return [
      `${pad}MavisCollapsibleHeader(`,
      [
        ...args,
        ...['artwork', 'leading', 'actions', 'section'].map((name) =>
          closure(name, slot(node, name), context),
        ),
        closure('content', node.children, context),
      ].join(',\n'),
      `${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
    metric,
  }) => `/// The parts of one scroll a header reads: how far it has collapsed, and where its two titles
/// fade. A JoltScrollView reports to one JoltScrollProgress with one range, so these follow it.
@MainActor final class MavisHeaderRanges: ObservableObject {
    private(set) var collapse = try! JoltScrollProgress(range: 0...1)
    private(set) var title = try! JoltScrollProgress(range: 0...1)
    private(set) var toolbar = try! JoltScrollProgress(range: 0...1)
    private var range = 0.0
    private var following: AnyCancellable?

    /// The fades of scrollHeader in Jolt: the title over the first 70% of the collapse, the
    /// toolbar's title from 55% to 95%.
    func fit(_ range: Double, following scroll: JoltScrollProgress) {
        guard range != self.range || following == nil else { return }
        self.range = range
        let collapse = try! JoltScrollProgress(range: 0...range)
        let title = try! JoltScrollProgress(range: 0...(range * 0.7))
        let toolbar = try! JoltScrollProgress(range: (range * 0.55)...(range * 0.95))
        let forward: (Double) -> Void = { offset in
            for progress in [collapse, title, toolbar] { progress.update(offset: offset, extent: 0) }
        }
        forward(scroll.offset)
        (self.collapse, self.title, self.toolbar) = (collapse, title, toolbar)
        following = scroll.$offset.sink(receiveValue: forward)
    }
}

/// The region MCollapsibleHeader and MRefreshControl share: content that scrolls under a header
/// of expanded points that collapses to minimum, a toolbar that stays, and a section under it.
/// Jolt reads the scroll position and links the titles and the artwork to it; Reduce Motion
/// keeps the artwork still. The header and the section follow the content, whatever the setting.
struct MavisScrollFrame<Content: View, Artwork: View, Leading: View, Trailing: View, Band: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    var subtitle = ""
    var image = ""
    let height: Double
    let expanded: Double
    let minimum: Double
    let sectionHeight: Double
    var parallax = 0.0
    var heading = false
    /// Scrolls back to the top each time it changes.
    var top = 0
    @ViewBuilder let artwork: () -> Artwork
    @ViewBuilder let leading: () -> Leading
    @ViewBuilder let trailing: () -> Trailing
    @ViewBuilder let section: () -> Band
    @ViewBuilder let content: () -> Content
    @StateObject private var scroll = mavisScrollProgress()
    @StateObject private var ranges = MavisHeaderRanges()
    @Environment(\\.accessibilityReduceMotion) private var reduceMotion

    private var range: Double { Swift.max(1, expanded - minimum) }
    private var collapsed: Double { Swift.min(range, Swift.max(0, scroll.offset)) }
    /// Where assistive technology moves from one title to the other, as in Jolt.
    private var compact: Bool { collapsed / range >= 0.625 }
    private var pictured: Bool { !image.isEmpty }

    private var header: some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if let url = URL(string: image), pictured {
                    AsyncImage(url: url) { loaded in
                        loaded.resizable().scaledToFill()
                    } placeholder: {
                        MavisGap(height: expanded)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipped()
                    .accessibilityHidden(true)
                } else {
                    MavisLayers { artwork() }
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: expanded)
            .background(MavisTokens.surface)
            .joltScrollLinked(ranges.collapse, to: (try? JoltPose(y: range * parallax)) ?? .identity)
            VStack(alignment: .leading, spacing: ${metric('space.xs')}) {
                Text(verbatim: label)
                    .font(heading ? ${font('heading')} : ${font('title')})
                    .foregroundStyle(pictured ? AnyShapeStyle(Color.white) : AnyShapeStyle(MavisTokens.text))
                    .fixedSize(horizontal: false, vertical: true)
                    .joltScrollLinked(ranges.title, to: (try? JoltPose(opacity: 0)) ?? .identity)
                    .accessibilityHidden(compact)
                if !subtitle.isEmpty {
                    Text(verbatim: subtitle)
                        .font(${font('body')})
                        .foregroundStyle(pictured ? AnyShapeStyle(Color.white) : AnyShapeStyle(MavisTokens.muted))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(${metric('space.lg')})
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            .background(pictured ? Color.black.opacity(0.5) : Color.black.opacity(0))
        }
        .frame(height: expanded)
        // The artwork stays inside the header while it moves slower than it.
        .clipped()
        .offset(y: -collapsed)
        .allowsHitTesting(false)
    }

    private var toolbar: some View {
        MavisRow(spacing: ${metric('space.sm')}, justify: .between, align: .center) {
            leading()
            Text(verbatim: label)
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .lineLimit(1)
                .joltScrollLinked(ranges.toolbar, from: (try? JoltPose(opacity: 0)) ?? .identity, to: .identity)
                .accessibilityHidden(!compact)
                .mavisItem(shrink: 1)
            trailing()
        }
        .padding(.horizontal, ${metric('space.sm')})
        .frame(maxWidth: .infinity)
        .frame(height: minimum)
        .background(MavisTokens.surface)
    }

    var body: some View {
        let _ = ranges.fit(range, following: scroll)
        ZStack(alignment: .topLeading) {
            JoltScrollView(progress: scroll) {
                VStack(spacing: 0) {
                    MavisGap(height: expanded + sectionHeight)
                    MavisColumn { content() }
                }
                .frame(maxWidth: .infinity, alignment: .topLeading)
                .background(MavisScroller(move: MavisScrollMove(y: 0, serial: top, animated: !reduceMotion)))
            }
            header
            toolbar
            MavisLayers { section() }
                .frame(maxWidth: .infinity)
                .frame(height: sectionHeight)
                .background(MavisTokens.surface)
                .offset(y: expanded - collapsed)
                .allowsHitTesting(false)
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .frame(height: height, alignment: .top)
        .clipped()
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}

/// A toolbar button that is only a symbol, named for the pointer and assistive technology.
struct MavisSymbolButton: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let symbol: String
    let label: String
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Image(systemName: symbol).accessibilityHidden(true)
        }
        .buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm))
        .fixedSize()
        .accessibilityLabel(Text(verbatim: label))
        .help(label)
    }
}

/// MCollapsibleHeader: see MavisScrollFrame. back shows the back button where leading goes.
struct MavisCollapsibleHeader<Content: View, Artwork: View, Leading: View, Actions: View, Band: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let title: String
    var subtitle = ""
    var image = ""
    var height = 540.0
    var expanded = 240.0
    var collapsed = 64.0
    var sectionHeight = 0.0
    var parallax = 0.35
    var back = false
    var backLabel = "Go back"
    var topLabel = "Back to top"
    var onBack: () -> Void = {}
    @ViewBuilder let artwork: () -> Artwork
    @ViewBuilder let leading: () -> Leading
    @ViewBuilder let actions: () -> Actions
    @ViewBuilder let section: () -> Band
    @ViewBuilder let content: () -> Content
    @State private var top = 0

    var body: some View {
        MavisScrollFrame(
            label: title, subtitle: subtitle, image: image, height: height, expanded: expanded, minimum: collapsed,
            sectionHeight: sectionHeight, parallax: Swift.min(1, Swift.max(0, parallax)), top: top,
            artwork: artwork,
            leading: {
                if back {
                    MavisSymbolButton(symbol: "arrow.left", label: backLabel, action: onBack)
                } else {
                    leading().allowsHitTesting(false)
                }
            },
            trailing: {
                MavisSymbolButton(symbol: "arrow.up", label: topLabel) { top += 1 }
                actions().allowsHitTesting(false)
            },
            section: section,
            content: content
        )
    }
}`,
}

// refresh: the function the control runs and waits for. It may take the refresh context
// (cancelled, signal.aborted, commit), wait, and fail by throwing.
function refresh({ attribute, value, ctx, handler, fail, ts, T }) {
  // What refresh returns is what the control waits for.
  const waited = (handled) => {
    const [only] = handled.body
    if (handled.body.length === 1 && only.s === 'action' && ctx.component.async?.has(only.name))
      only.await = true
    return handled
  }
  if (!ts.isIdentifier(value)) return waited(handler(value, [T.refresh], ctx))
  const action = ctx.component.actions.find((each) => each.name === value.text)
  if (ctx.members.get(value.text) !== 'Action' || !action)
    fail(attribute, 'refresh takes a function of this component.')
  const takes = action.params.length === 1 && action.params[0].type.k === 'refresh'
  if (action.params.length && !takes)
    fail(attribute, `refresh hands ${value.text} the refresh context and nothing else.`)
  return waited({
    params: [
      takes ? { name: 'context', type: T.refresh } : { name: '_', type: T.refresh, unused: true },
    ],
    body: [
      {
        s: 'action',
        name: value.text,
        args: takes ? [{ e: 'local', name: 'context', type: T.refresh }] : [],
      },
    ],
  })
}

// refreshControlProps: a region of a fixed height whose content scrolls under a small header with
// the label, a button that refreshes and a line that says how it went. refresh runs the action:
// while it runs the button cancels, a failure shows the error label and the button retries.
// The Web and NativeScript also refresh on a pull past threshold; the Mac has the button and
// Command-R.
export const MRefreshControl = {
  macos: { ignoredProps: ['threshold'] },
  props: {
    id: 'string',
    label: 'string',
    refresh,
    height: positive('height'),
    disabled: 'boolean',
    threshold: positive('threshold'),
    refreshLabel: 'string',
    refreshingLabel: 'string',
    successLabel: 'string',
    errorLabel: 'string',
    retryLabel: 'string',
    cancelLabel: 'string',
    onStateChange: 'string-handler',
  },
  required: ['label', 'refresh'],
  // The control shows a failure of refresh; nothing else can.
  failing: ['refresh'],
  children: 'elements',
  control: true,
  uses: [flexRuntime, scrollRuntime],
  types:
    () => `/** What MRefreshControl hands refresh: whether the run was cancelled or replaced, and commit, which applies a result only while the run still owns the control. */
interface MavisRefreshContext { readonly cancelled: boolean; readonly signal: { readonly aborted: boolean }; commit(change: () => void): Promise<boolean> }`,
  declaration:
    "declare function MRefreshControl(props: { id?: string; label: string; refresh: (context: MavisRefreshContext) => void | Promise<void>; height?: number; disabled?: boolean; threshold?: number; refreshLabel?: string; refreshingLabel?: string; successLabel?: string; errorLabel?: string; retryLabel?: string; cancelLabel?: string; onStateChange?: (state: 'idle' | 'refreshing' | 'success' | 'error') => void; children?: unknown }): JSX.Element",
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const labels = [
      'refreshLabel',
      'refreshingLabel',
      'successLabel',
      'errorLabel',
      'retryLabel',
      'cancelLabel',
    ]
    const args = [
      `label: ${emit.value(props.label)}`,
      `refresh: ${emit.handler(props.refresh, indent + 4)}`,
      ...(props.height ? [`height: ${emit.expr(props.height.expr)}`] : []),
      ...(props.disabled ? [`disabled: ${emit.value(props.disabled)}`] : []),
      ...labels.flatMap((key) => (props[key] ? [`${key}: ${emit.value(props[key])}`] : [])),
      ...(props.onStateChange
        ? [`onStateChange: ${emit.handler(props.onStateChange, indent + 4)}`]
        : []),
    ].map((arg) => `${pad}    ${arg}`)
    return [
      `${pad}MavisRefreshControl(`,
      [...args, closure('content', node.children, context)].join(',\n'),
      `${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime: ({ font, metric }) => `/// What refresh gets from MRefreshControl.
@MainActor final class MavisRefreshContext {
    private let current: () -> Bool
    init(current: @escaping () -> Bool) { self.current = current }

    /// The run was cancelled, or a newer one replaced it.
    var cancelled: Bool { Task.isCancelled || !current() }

    /// Applies a result only while this run still owns the control.
    func commit(_ change: () -> Void) -> Bool {
        guard !cancelled else { return false }
        change()
        return true
    }
}

/// MRefreshControl: see MavisScrollFrame. The button, or Command-R, runs refresh in a task: the
/// control is refreshing until it returns, shows a failure it throws, and cancels the task when
/// asked, when it is disabled and when it goes away. A newer run replaces an older one.
struct MavisRefreshControl<Content: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let refresh: (MavisRefreshContext) async throws -> Void
    var height = 480.0
    var disabled = false
    var refreshLabel = "Refresh"
    var refreshingLabel = "Refreshing"
    var successLabel = "Up to date"
    var errorLabel = "Could not refresh"
    var retryLabel = "Try again"
    var cancelLabel = "Cancel refresh"
    var onStateChange: (String) -> Void = { _ in }
    @ViewBuilder let content: () -> Content
    @State private var state = "idle"
    @State private var running: Task<Void, Never>?
    @State private var revision = 0

    private func set(_ next: String) {
        guard state != next else { return }
        state = next
        onStateChange(next)
    }

    private func start() {
        guard !disabled else { return }
        running?.cancel()
        revision += 1
        let current = revision
        set("refreshing")
        running = Task { @MainActor in
            do {
                try await refresh(MavisRefreshContext { current == revision })
                if current == revision, !Task.isCancelled { set("success") }
            } catch {
                if current == revision, !Task.isCancelled, !(error is CancellationError) { set("error") }
            }
            if current == revision { running = nil }
        }
    }

    private func cancel() {
        revision += 1
        running?.cancel()
        running = nil
        if state == "refreshing" { set("idle") }
    }

    private var status: String {
        switch state {
        case "refreshing": return refreshingLabel
        case "error": return errorLabel
        case "success": return successLabel
        default: return refreshLabel
        }
    }

    var body: some View {
        MavisScrollFrame(
            label: label, height: height, expanded: 104, minimum: 56, sectionHeight: 36, heading: true,
            artwork: { EmptyView() },
            leading: { EmptyView() },
            trailing: {
                Button(action: { state == "refreshing" ? cancel() : start() }) {
                    HStack(spacing: 8) {
                        Image(systemName: state == "refreshing" ? "xmark" : "arrow.clockwise").accessibilityHidden(true)
                        Text(verbatim: state == "refreshing" ? cancelLabel : state == "error" ? retryLabel : refreshLabel)
                    }
                }
                .buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm))
                .fixedSize()
                .disabled(disabled)
                .keyboardShortcut("r", modifiers: .command)
            },
            section: {
                Text(verbatim: status)
                    .font(${font('caption')})
                    .foregroundStyle(state == "error" ? MavisTokens.danger : MavisTokens.muted)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .frame(maxWidth: .infinity, alignment: .leading)
            },
            content: content
        )
        .onChange(of: disabled) { _, next in if next { cancel() } }
        .onDisappear { cancel() }
    }
}`,
  vue: {
    attribute(name, value) {
      // The arrow returns what the function returns: the control waits for it.
      if (name === 'refresh')
        return `:refresh="${expression(handlerJs({ ...value, body: value.body.map((each) => ({ ...each, await: false })) }))}"`
    },
  },
}
