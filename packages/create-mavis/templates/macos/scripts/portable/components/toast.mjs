import ts from 'typescript'
import { T } from '../model.mjs'
import { layerRuntime } from './feedback-layer.mjs'
import { feedbackRuntime, named } from './feedback.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'
import { union } from './shared.mjs'

// The icon and the theme color of each tone, as MToast draws them on the Web.
const tones = {
  success: { icon: 'circle-check', tone: 'success' },
  error: { icon: 'circle-alert', tone: 'danger' },
  warning: { icon: 'triangle-alert', tone: 'warning' },
  info: { icon: 'info', tone: 'accent' },
}
const scopes = ['local', 'app']

// useToast() makes the queue of this screen. The app's queue follows the user from screen to
// screen, which the Mac cannot do before it has navigation.
function open({ call, fail }) {
  const [options] = call.arguments
  if (!options) return
  const written = "useToast takes nothing, or { scope: 'local' } written out."
  if (call.arguments.length > 1 || !ts.isObjectLiteralExpression(options)) fail(options, written)
  for (const property of options.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      property.name.getText() !== 'scope' ||
      !ts.isStringLiteral(property.initializer)
    )
      fail(property, written)
    if (property.initializer.text === 'app')
      fail(
        property,
        "useToast({ scope: 'app' }) keeps one queue across screens, which needs navigation on the Mac (#341). Use useToast() for a queue of this screen.",
      )
  }
}

// What show takes: ToastOptions of the Mavis core, written out where show is called.
const fields = {
  message: T.string,
  title: T.optional(T.string),
  tone: T.optional(T.string),
  duration: T.optional(T.number),
}

// toast.show({ … }), toast.dismiss() and toast.clear() in an action or an event handler.
function call({ node, ref, ctx, reader }) {
  const { fail, expr } = reader
  const method = node.expression.name.text
  if (method === 'show') {
    const [options] = node.arguments
    if (node.arguments.length !== 1 || !ts.isObjectLiteralExpression(options))
      fail(node, "show takes the toast written out: show({ message: 'Saved' }).")
    const given = options.properties.map((property) => {
      const name = property.name?.getText()
      if (
        !(ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) ||
        !Object.hasOwn(fields, name)
      )
        fail(property, `A toast has ${Object.keys(fields).join(', ')}.`)
      const value = expr(
        ts.isPropertyAssignment(property) ? property.initializer : property.name,
        ctx,
        fields[name],
      )
      if (name === 'message' && value.e === 'lit' && !value.value.trim())
        fail(property, 'message is what the toast says: it cannot be blank.')
      if (name === 'title' && value.e === 'lit' && !value.value.trim())
        fail(property, 'title cannot be blank: leave it out of a toast without one.')
      if (name === 'duration' && value.e === 'lit' && value.value < 0)
        fail(property, 'duration cannot be negative; 0 keeps the toast until it is dismissed.')
      return { name, value }
    })
    if (!given.some((option) => option.name === 'message'))
      fail(options, 'A toast needs a message.')
    // In the order Swift takes them, whatever order the source wrote.
    const order = Object.keys(fields)
    given.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
    return { s: 'call', ref, method, options: given }
  }
  if (method === 'dismiss' || method === 'clear') {
    if (node.arguments.length)
      fail(
        node.arguments[0],
        method === 'dismiss'
          ? "dismiss() closes the toast on screen. A shared screen cannot keep a toast's id yet, so dismiss takes none on the Mac."
          : 'clear takes nothing.',
      )
    return { s: 'call', ref, method }
  }
  fail(node.expression, 'A toast queue has show, dismiss and clear.')
}

// controller: the queue useToast() made in the same component.
function controller({ attribute, value, ctx, fail }) {
  const queue = ts.isIdentifier(value)
    ? ctx.component.refs.find((ref) => ref.name === value.text)
    : null
  if (!queue || ctx.members.get(value.text) !== 'Ref' || queue.kind !== 'toast')
    fail(
      attribute,
      'controller takes the queue useToast() made in this component: const toast = useToast().',
    )
  // The Mac hosts the queue on the root of the component's view: it cannot come and go.
  if (ctx.inShow || ctx.inFor)
    fail(
      attribute,
      'An MToast stays on the screen: put it outside Show and For. Its queue decides what shows.',
    )
  if (queue.field)
    fail(attribute, `${value.text} already has an MToast: a queue is shown in one place.`)
  queue.field = true
  return { ref: value.text }
}

// toastProps and useToast: a queue of short messages, shown one at a time over the screen. The
// MToast is where the queue is shown, wherever it sits in the view: it takes no room there.
export const MToast = {
  props: { controller, closeLabel: named('names the button that dismisses a toast') },
  required: ['controller'],
  control: true,
  uses: [flexRuntime, feedbackRuntime, layerRuntime],
  composable: {
    name: 'useToast',
    kind: 'toast',
    contextType: 'MavisToastQueue',
    declaration: `function useToast(options?: { scope?: ${union(scopes)} }): MavisToast`,
    exports: {
      ToastController: 'MavisToast',
      ToastOptions: 'MavisToastOptions',
      ToastTone: 'MavisToastTone',
    },
    open,
    call,
    unused: (name) =>
      `${name} is not shown anywhere: add an MToast with ${name} as its controller to this component.`,
    swift: (name) => `@StateObject private var ${name} = MavisToastQueue()`,
  },
  types: () => `type MavisToastTone = ${union(Object.keys(tones))}
type MavisToastOptions = { message: string; title?: string; tone?: MavisToastTone; duration?: number }
/** The queue of toasts useToast() makes: const toast = useToast(), shown by an MToast. */
interface MavisToast { show(options: MavisToastOptions): number | undefined; dismiss(id?: number): void; clear(): void }
declare function useToast(options?: { scope?: ${union(scopes)} }): MavisToast`,
  declaration:
    'declare function MToast(props: { controller: MavisToast; closeLabel?: string }): JSX.Element',
  // The toast shows over the window, not here: this element takes no room in its stack.
  swift: (node, { indent }) => `${' '.repeat(indent)}EmptyView()`,
  swiftRoot(node, { emit, indent }) {
    const { controller: queue, closeLabel } = node.props
    return `${' '.repeat(indent + 4)}.mavisToast(self.${queue.ref}${closeLabel ? `, closeLabel: ${emit.value(closeLabel)}` : ''})`
  },
  swiftRuntime: ({ theme, font }) => {
    const each = (text) =>
      Object.keys(tones)
        .map((name) => `        case .${name}: return ${text(tones[name])}`)
        .join('\n')
    return `enum MavisToastTone: String {
    case ${Object.keys(tones).join(', ')}
    init(_ name: String?) { self = name.flatMap(MavisToastTone.init(rawValue:)) ?? .info }
    var color: MavisColor {
        switch self {
${each(({ tone }) => `MavisTokens.${tone}`)}
        }
    }
    var glyph: String {
        switch self {
${each(({ icon }) => swiftGlyph(icon))}
        }
    }
}

/// One toast of a queue.
struct MavisToastMessage: Identifiable, Equatable {
    let id: Int
    let title: String?
    let message: String
    let tone: MavisToastTone
    let duration: Double
}

/// useToast(): the toasts of one screen, shown one at a time in the order they were asked for,
/// like the queue in the Mavis core. A toast stays duration milliseconds once it has entered
/// (5000 unless it says otherwise, and until it is dismissed with 0), and the time stops while
/// the pointer is on it or the app is hidden. The next one enters when it has left.
@MainActor final class MavisToastQueue: ObservableObject {
    @Published private(set) var message: MavisToastMessage?
    @Published private(set) var visible = false
    private var items: [MavisToastMessage] = []
    private var serial = 0
    private var stage = 0
    private var entered = false
    private var closing = false
    private var remaining = 0.0
    private var started = Date()
    private var timer: Task<Void, Never>?
    private var pauses: Set<String> = []
    // The toast's way in and out through Jolt, and a moment for the last frame.
    private static let enter = ${theme.motion.enterDuration}.0
    private static let leave = ${theme.motion.exitDuration + 40}.0

    func show(message: String, title: String? = nil, tone: String? = nil, duration: Double? = nil) {
        let time = duration ?? 5000
        // The Web refuses a toast without a message or with a time that is not one.
        guard !mavisTrim(message).isEmpty, time.isFinite, time >= 0 else { return }
        serial += 1
        let title = title.flatMap { mavisTrim($0).isEmpty ? nil : $0 }
        items.append(MavisToastMessage(id: serial, title: title, message: message, tone: MavisToastTone(tone), duration: time))
        if items.count == 1 { advance() }
    }

    /// Closes the toast on screen; the next one follows.
    func dismiss() {
        guard !items.isEmpty, !closing else { return }
        stop()
        closing = true
        visible = false
        after(Self.leave) { queue in
            queue.items.removeFirst()
            queue.advance()
        }
    }

    /// Drops the toasts that wait and closes the one on screen.
    func clear() {
        if items.count > 1 { items.removeSubrange(1...) }
        dismiss()
    }

    func pause(_ reason: String, _ paused: Bool) {
        if paused {
            pauses.insert(reason)
            stop()
        } else {
            pauses.remove(reason)
            run()
        }
    }

    private func advance() {
        stop()
        closing = false
        entered = false
        message = items.first
        visible = message != nil
        remaining = message?.duration ?? 0
        guard message != nil else { return }
        after(Self.enter) { queue in
            queue.entered = true
            queue.run()
        }
    }

    private func after(_ milliseconds: Double, _ then: @escaping @MainActor (MavisToastQueue) -> Void) {
        stage += 1
        let stage = stage
        Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(milliseconds * 1_000_000))
            guard let self, self.stage == stage else { return }
            then(self)
        }
    }

    private func run() {
        guard let item = message, item.duration > 0, entered, !closing, pauses.isEmpty, timer == nil else { return }
        started = Date()
        let wait = remaining
        timer = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(Swift.max(0, wait) * 1_000_000))
            guard let self, !Task.isCancelled else { return }
            self.timer = nil
            if self.message?.id == item.id { self.dismiss() }
        }
    }

    private func stop() {
        guard let timer else { return }
        timer.cancel()
        self.timer = nil
        remaining = Swift.max(0, remaining - Date().timeIntervalSince(started) * 1000)
    }
}

/// MToast's card: the tone's icon on a circle, the title over the message, and a close button.
struct MavisToastCard: View {
    let message: MavisToastMessage
    let closeLabel: String
    let close: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            MavisIcon(glyph: message.tone.glyph, size: 20)
                .foregroundStyle(message.tone.color)
                .frame(width: 40, height: 40)
                .background(MavisTokens.elevated, in: Circle())
                // JoltPresence shows its content to assistive technology again: the icon stays out.
                .accessibilityRepresentation { EmptyView() }
            VStack(alignment: .leading, spacing: ${theme.space.xs}) {
                if let title = message.title {
                    Text(verbatim: title)
                        .font(${font('body')})
                        .fontWeight(.semibold)
                        .foregroundStyle(MavisTokens.text)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Text(verbatim: message.message)
                    .font(${font('body')})
                    .foregroundStyle(message.title == nil ? MavisTokens.text : MavisTokens.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, minHeight: 40, alignment: .leading)
            MavisGlyphButton(glyph: ${swiftGlyph('x')}, label: closeLabel, iconSize: 20, tint: MavisTokens.muted, action: close)
        }
        // The border takes one unit of the card's box, as on the Web.
        .padding(${theme.space.md + 1})
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.lg}))
        .overlay(RoundedRectangle(cornerRadius: ${theme.radius.lg}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
        .shadow(color: Color(red: 22 / 255, green: 13 / 255, blue: 36 / 255, opacity: 0.1), radius: 14, x: 0, y: 8)
    }
}

private struct MavisToastHost: ViewModifier {
    let queue: MavisToastQueue
    let closeLabel: String
    @Environment(\\.mavisTheme) private var theme

    func body(content: Content) -> some View {
        content.transformPreference(MavisToastKey.self) { hosts in
            hosts.append(MavisToastItem(queue: queue, closeLabel: closeLabel, theme: theme))
        }
    }
}

extension View {
    /// MToast: the feedback layer over the window shows this queue's toasts.
    func mavisToast(_ queue: MavisToastQueue, closeLabel: String = "Dismiss notification") -> some View {
        modifier(MavisToastHost(queue: queue, closeLabel: closeLabel))
    }
}`
  },
  vue: {
    attribute(name, value) {
      if (name === 'controller') return `:controller="${value.ref}"`
    },
    // The queue is made in the script, where the functions that call it can reach it.
    script: (nodes) =>
      nodes.length
        ? {
            core: ['useToast'],
            setup: nodes.map((node) => `const ${node.props.controller.ref} = useToast()`),
          }
        : {},
  },
}
