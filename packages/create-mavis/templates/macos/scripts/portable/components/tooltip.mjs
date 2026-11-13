import { feedbackRuntime, named, textArgs } from './feedback.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'
import { layerRuntime } from './feedback-layer.mjs'
import { choice, union } from './shared.mjs'

const variants = ['primary', 'secondary', 'ghost']
/** PopoverPlacement of the Mavis core, and each one's name in Swift. */
export const placements = {
  'bottom-start': 'bottomStart',
  'bottom-end': 'bottomEnd',
  'top-start': 'topStart',
  'top-end': 'topEnd',
}

function delay({ attribute, value, ctx, expr, fail, T }) {
  const number = expr(value, ctx, T.number)
  if (number.e === 'lit' && number.value < 0) fail(attribute, 'delay cannot be negative.')
  return { expr: number }
}

// tooltipProps: help in a few words behind a button of its own, named triggerLabel. The help
// shows over the window, near the button, while the pointer rests on it or it has the keyboard
// focus, and a click keeps it there; it takes no input of its own. id names the help itself.
export const MTooltip = {
  props: {
    id: 'string',
    text: named('is the help the tooltip shows'),
    triggerLabel: named('names the button that shows the help'),
    icon: 'string',
    variant: 'string',
    disabled: 'boolean',
    delay,
    placement: 'string',
  },
  required: ['text', 'triggerLabel'],
  control: true,
  uses: [flexRuntime, feedbackRuntime, layerRuntime],
  types: () => `type MavisTooltipPlacement = ${union(Object.keys(placements))}`,
  declaration: `declare function MTooltip(props: { id?: string; text: string; triggerLabel: string; icon?: MavisIconName; variant?: ${union(variants)}; disabled?: boolean; delay?: number; placement?: MavisTooltipPlacement }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      ...textArgs(props, ['text', 'triggerLabel'], emit),
      ...(props.icon
        ? [
            `glyph: ${'lit' in props.icon ? swiftGlyph(props.icon.lit) : `MavisIcons.glyph(${emit.expr(props.icon.expr)})`}`,
          ]
        : []),
      ...(props.variant ? [`variant: ${choice(props.variant, 'MavisButtonVariant', emit)}`] : []),
      ...textArgs(props, ['disabled', 'delay'], emit),
      ...(props.placement
        ? [
            `placement: ${'lit' in props.placement ? `.${placements[props.placement.lit]}` : `MavisTooltipPlacement(${emit.expr(props.placement.expr)})`}`,
          ]
        : []),
      ...textArgs(props, ['id'], emit),
    ]
    return [`${pad}MavisTooltip(${args.join(', ')})`, `${pad}    .mavisItem(align: .start)`].join(
      '\n',
    )
  },
  swiftRuntime: ({
    theme,
    metric,
  }) => `/// MTooltip: a button with an icon that shows help over the window, on the feedback layer. The
/// help opens when the pointer has rested on the button for delay milliseconds or the button has
/// the keyboard focus, and stays while the pointer is on the button or on the help. A click keeps
/// it open, and another click or Escape closes it.
struct MavisTooltip: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let text: String
    let triggerLabel: String
    var glyph: String = ${swiftGlyph('info')}
    var variant: MavisButtonVariant = .ghost
    var disabled: Bool = false
    var delay: Double = 350
    var placement: MavisTooltipPlacement = .topStart
    var id: String = ""
    @Environment(\\.mavisTheme) private var theme
    @State private var key = UUID()
    @State private var open = false
    @State private var pinned = false
    @State private var suppressed = false
    @State private var onButton = false
    @State private var onHelp = false
    @FocusState private var focused: Bool
    @StateObject private var outside = MavisPointerWatch()

    private var hovered: Bool { onButton || onHelp }

    private func close() {
        open = false
        pinned = false
    }

    private func press() {
        if pinned {
            suppressed = true
            close()
        } else {
            pinned = true
            suppressed = false
            open = true
        }
    }

    var body: some View {
        MavisGlyphButton(glyph: glyph, label: triggerLabel, side: ${metric('control.md.height')}, iconSize: 20, tint: variant.foreground, fill: variant.background, action: press)
            .focused($focused)
            .disabled(disabled)
            .onHover { inside in
                onButton = inside
                if !inside && !focused { suppressed = false }
            }
            .onExitCommand {
                suppressed = true
                close()
            }
            .anchorPreference(key: MavisTooltipKey.self, value: .bounds) { anchor in
                [MavisTooltipItem(id: key, anchor: anchor, text: text, name: id, placement: placement, open: open && !disabled, theme: theme, hover: { onHelp = $0 })]
            }
            // The pointer rests before the help opens, and may cross to the help before it closes.
            .task(id: hovered) {
                if hovered {
                    guard !open else { return }
                    try? await _Concurrency.Task.sleep(nanoseconds: UInt64(Swift.max(0, delay) * 1_000_000))
                    if !_Concurrency.Task.isCancelled && !disabled && !suppressed { open = true }
                } else if open {
                    try? await _Concurrency.Task.sleep(nanoseconds: 120_000_000)
                    if !_Concurrency.Task.isCancelled && !focused && !pinned { open = false }
                }
            }
            .onChange(of: focused) { _, now in
                if now {
                    suppressed = false
                    if !disabled { open = true }
                } else {
                    pinned = false
                    if !hovered { open = false }
                }
            }
            .onChange(of: disabled) { _, now in
                if now { close() }
            }
            // A click anywhere else closes the help, as on the Web, and still does what it was for.
            .onChange(of: open) { _, now in
                if now {
                    outside.watch { if !hovered { close() } }
                } else {
                    outside.stop()
                }
            }
            .onDisappear { outside.stop() }
    }
}

/// Tells an open tooltip about presses of the pointer in this app, without taking them.
@MainActor private final class MavisPointerWatch: ObservableObject {
    private var monitor: Any?

    func watch(_ pressed: @escaping @MainActor () -> Void) {
        stop()
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown]) { event in
            MainActor.assumeIsolated { pressed() }
            return event
        }
    }

    func stop() {
        if let monitor { NSEvent.removeMonitor(monitor) }
        monitor = nil
    }

    deinit {
        if let monitor { NSEvent.removeMonitor(monitor) }
    }
}`,
}
