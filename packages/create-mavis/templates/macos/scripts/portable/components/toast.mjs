import ts from 'typescript'
import { toastQueueSwift } from './toast-queue.mjs'
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

// Local queues belong to this component; the generated entry supplies the application queue.
function open({ call, fail }) {
  const [options] = call.arguments
  if (!options) return { scope: 'local' }
  const written = "useToast takes nothing, or { scope: 'local' | 'app' } written out."
  if (call.arguments.length > 1 || !ts.isObjectLiteralExpression(options)) fail(options, written)
  for (const property of options.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      property.name.getText() !== 'scope' ||
      !ts.isStringLiteral(property.initializer)
    )
      fail(property, written)
    if (!scopes.includes(property.initializer.text)) fail(property, written)
  }
  return { scope: options.properties[0]?.initializer.text ?? 'local' }
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
      if (name === 'duration' && value.e === 'lit' && (value.value < 0 || value.value > 2147483647))
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
  if (method === 'dismiss') {
    if (node.arguments.length > 1) fail(node, 'dismiss takes one optional toast id.')
    return {
      s: 'call',
      ref,
      method,
      args: node.arguments.map((arg) => expr(arg, ctx, T.optional(T.number))),
    }
  }
  if (method === 'clear') {
    if (node.arguments.length) fail(node, 'clear takes nothing.')
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
    valueCall(options) {
      if (options.ctx.mode !== 'action')
        options.reader.fail(options.node, 'show changes the toast queue; call it from an action.')
      const operation = call(options)
      if (operation.method !== 'show')
        options.reader.fail(options.node, 'Only show returns a toast id.')
      const { s, ...value } = operation
      return { e: 'controller-call', ...value, type: T.optional(T.number) }
    },
    update: (reference) =>
      reference.options?.scope === 'app' ? `self.${reference.name}.request()` : '',
    dispose: (reference, owner = 'self') =>
      reference.options?.scope === 'app' ? '' : `${owner}.${reference.name}.dispose()`,
    vue: (reference) => ({
      core: ['useToast'],
      setup: [
        `const ${reference.name} = useToast(${reference.options?.scope === 'app' ? "{ scope: 'app' }" : ''})`,
      ],
    }),
    unused: (name, reference) =>
      reference.options?.scope === 'app'
        ? undefined
        : `${name} is not shown anywhere: add an MToast with ${name} as its controller to this component.`,
    swift: (name, reference) =>
      reference.options?.scope === 'app'
        ? `@Environment(\\.mavisApplicationToast) private var mavis${name}Application\n    private var ${name}: MavisToastQueue {\n        guard let application = mavis${name}Application else { preconditionFailure("Install the generated Mavis entry before requesting app toast") }\n        return application.queue\n    }`
        : `@StateObject private var ${name} = MavisToastQueue()`,
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
  swiftRuntime: ({ theme, font, metric }) => {
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
    let id: Double
    let title: String?
    let message: String
    let tone: MavisToastTone
    let duration: Double
}

${toastQueueSwift(theme)}

/// MToast's card: the tone's icon on a circle, the title over the message, and a close button.
struct MavisToastCard: View {
    @Environment(\\.mavisTheme) private var mavisTheme
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
            VStack(alignment: .leading, spacing: ${metric('space.xs')}) {
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
        .padding(${metric('space.md', '+', 1)})
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.lg')}))
        .overlay(RoundedRectangle(cornerRadius: ${metric('radius.lg')}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
        .shadow(color: Color(red: 22 / 255, green: 13 / 255, blue: 36 / 255, opacity: 0.1), radius: 14, x: 0, y: 8)
    }
}

private struct MavisToastHost: ViewModifier {
    @Environment(\\.mavisTheme) private var mavisTheme
    let queue: MavisToastQueue
    let closeLabel: String
    var enabled = true
    @State private var hostID = UUID()
    @Environment(\\.mavisTheme) private var theme

    func body(content: Content) -> some View {
        content.transformPreference(MavisToastKey.self) { hosts in
            if enabled { hosts.append(MavisToastItem(id: hostID, queue: queue, closeLabel: closeLabel, theme: theme)) }
        }
    }
}

extension View {
    /// MToast: the feedback layer over the window shows this queue's toasts.
    func mavisToast(_ queue: MavisToastQueue, closeLabel: String = "Dismiss notification", enabled: Bool = true) -> some View {
        modifier(MavisToastHost(queue: queue, closeLabel: closeLabel, enabled: enabled))
    }
}`
  },
  vue: {
    attribute(name, value) {
      if (name === 'controller') return `:controller="${value.ref}"`
    },
  },
}
