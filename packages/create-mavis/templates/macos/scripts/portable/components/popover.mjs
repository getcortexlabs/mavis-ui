// MPopover, MMenu and MSpeedDial: a control in place and, while open, a panel beside it. The Mac
// draws the panel in the window's layer (layers.mjs) where placePopover of the Mavis core puts it.
import { expression, handlerJs, js } from '../js-text.mjs'
import { swiftNumber } from '../swift-text.mjs'
import { event, swiftCall } from './choices.mjs'
import { flexRuntime } from './flex.mjs'
import { layerRuntime } from './layers.mjs'
import { choice, spacing, union } from './shared.mjs'

const placements = ['bottom-start', 'bottom-end', 'top-start', 'top-end']
const reasons = ['trigger', 'outside', 'escape', 'back', 'select', 'program']
const variants = ['primary', 'secondary', 'ghost']
const directions = ['up', 'down']

// A literal is checked while generating, as the Web checks it while rendering.
const width = ({ value, ctx, expr, attribute, fail, T }) => {
  const number = expr(value, ctx, T.number)
  if (number.e === 'lit' && (!Number.isFinite(number.value) || number.value <= 0))
    fail(attribute, 'width must be positive and finite.')
  return { expr: number }
}

// A list of the records a menu or a speed dial shows, by their built-in type.
const list =
  (type) =>
  ({ value, ctx, expr, record, T }) => ({ expr: expr(value, ctx, T.array(record(type))) })

const named = (keys) =>
  function check({ props, attrs, fail }) {
    for (const key of keys)
      if (props[key] && 'lit' in props[key] && !props[key].lit.trim())
        fail(
          attrs.get(key),
          `${key} cannot be blank: the Web and NativeScript refuse a popover without it.`,
        )
  }

/** The properties MPopover and MMenu share: popoverProps of the Mavis core. */
const popoverProps = {
  id: 'string',
  open: 'boolean',
  onUpdateOpen: 'boolean-handler',
  label: 'string',
  triggerLabel: 'string',
  icon: 'string',
  variant: 'string',
  disabled: 'boolean',
  placement: 'string',
  width,
  padding: 'space',
  onClose: 'string-handler',
}

// The arguments the three Swift views share, in the order they declare them.
const shared = (props, context, order) =>
  order.flatMap((key) => {
    const prop = props[key]
    if (!prop) return []
    const { emit, indent } = context
    if (key === 'variant') return [`variant: ${choice(prop, 'MavisButtonVariant', emit)}`]
    if (key === 'padding') return [`padding: ${spacing(prop, context)}`]
    if (key === 'width') return [`width: ${emit.expr(prop.expr)}`]
    if ('body' in prop) return [`${key}: ${emit.handler(prop, indent + 4)}`]
    return [`${key}: ${emit.value(prop)}`]
  })

// The Web's events hand a value that may be a number, and records with their own types; the
// generated Vue passes on text and the record as it is.
const selected = (value) =>
  `@select="${expression(`(value, item) => (${handlerJs(value)})(String(value), item as never)`)}"`

/** Swift helpers the three components share. */
const popoverRuntime = {
  swiftRuntime: ({
    theme,
  }) => `/// placePopover of the Mavis core: beside the anchor, on the other side when only that one has
/// room, and inside the viewport with a margin.
func mavisPlacePopover(anchor: CGRect, panel: CGSize, viewport: CGSize, placement: String, rtl: Bool = false, gap: CGFloat = 8, margin: CGFloat = 8) -> CGPoint {
    let bottom = anchor.maxY + gap
    let top = anchor.minY - gap - panel.height
    let lower = viewport.height - margin
    let upper = margin
    var above = placement.hasPrefix("top")
    if above && top < upper && bottom + panel.height <= lower {
        above = false
    } else if !above && bottom + panel.height > lower && top >= upper {
        above = true
    }
    func clamp(_ value: CGFloat, _ low: CGFloat, _ high: CGFloat) -> CGFloat {
        Swift.max(low, Swift.min(value, Swift.max(low, high)))
    }
    return CGPoint(
        x: clamp(placement.hasSuffix("end") != rtl ? anchor.maxX - panel.width : anchor.minX, margin, viewport.width - panel.width - margin),
        y: clamp(above ? top : bottom, upper, lower - panel.height)
    )
}

/// The presses of the pointer in the app, for a popover that closes on one outside it. The press
/// goes on to what is under the pointer, as on the Web.
final class MavisPressWatcher {
    var pressed: (NSEvent) -> Void = { _ in }
    private var monitor: Any?

    func start() {
        guard monitor == nil else { return }
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown, .otherMouseDown]) { [weak self] event in
            self?.pressed(event)
            return event
        }
    }

    func stop() {
        if let monitor { NSEvent.removeMonitor(monitor) }
        monitor = nil
    }

    deinit { stop() }
}

/// A nonmodal panel returns to the previous responder except when an outside press chooses
/// another control. Weak references never keep an old window or field alive.
final class MavisPopoverFocus {
    weak var responder: NSResponder?
    weak var window: NSWindow?
    var returnsFocus = true

    func capture(_ view: NSView?) {
        window = view?.window
        responder = window?.firstResponder
        returnsFocus = true
    }

    func restore() {
        defer { responder = nil; window = nil; returnsFocus = true }
        guard returnsFocus, let window, let responder else { return }
        if let view = responder as? NSView, view.window !== window { return }
        window.makeFirstResponder(responder)
    }
}

/// The panel of a popover in its layer: on the theme surface with its border, as wide as asked
/// and as tall as its content, inside the window, where placePopover puts it beside its anchor.
struct MavisPopoverPanel<Content: View>: View {
    let open: Bool
    let anchor: CGRect
    let label: String
    var placement = "bottom-start"
    var width = 280.0
    var id: String? = nil
    let request: (String) -> Void
    @ViewBuilder let content: () -> Content
    @State private var heights: [String: CGFloat] = [:]
    @State private var watcher = MavisPressWatcher()
    @State private var area = MavisWindowBox()
    @Environment(\\.layoutDirection) private var direction

    /// Whether a press is outside the panel and its anchor: its place in the layer, from the top.
    private func outside(_ event: NSEvent, _ frame: CGRect) -> Bool {
        guard let view = area.view, event.window === view.window else { return false }
        let point = view.convert(event.locationInWindow, from: nil)
        let place = CGPoint(x: point.x, y: view.isFlipped ? point.y : view.bounds.height - point.y)
        return !frame.contains(place) && !anchor.contains(place)
    }

    var body: some View {
        GeometryReader { proxy in
            let measured = heights["popover"]
            let size = CGSize(
                width: Swift.min(CGFloat(width), Swift.max(0, proxy.size.width - 16)),
                height: Swift.min(measured ?? 0, Swift.max(0, proxy.size.height - 16))
            )
            let origin = mavisPlacePopover(anchor: anchor, panel: size, viewport: proxy.size, placement: placement, rtl: direction == .rightToLeft)
            let shape = RoundedRectangle(cornerRadius: ${theme.radius.md})
            let _ = watcher.pressed = { event in
                if outside(event, CGRect(origin: origin, size: size)) { request("outside") }
            }
            ZStack(alignment: .topLeading) {
                Color.clear
                    .background(MavisWindowReader(box: area))
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
                JoltPresence(open, enter: MavisLayerMotion.enter, leave: MavisLayerMotion.leave) {
                    ScrollView(.vertical) {
                        content()
                            .frame(maxWidth: .infinity, alignment: .topLeading)
                            .mavisMeasured("popover")
                    }
                    .scrollBounceBehavior(.basedOnSize)
                    .frame(width: size.width, height: size.height)
                    .clipShape(shape)
                    .background(shape.fill(MavisTokens.surface).shadow(color: Color.black.opacity(0.13), radius: 18, y: 12))
                    .overlay(shape.strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
                    // An element of its own, so what the panel hides stays hidden while it is present.
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel(Text(verbatim: label))
                    .accessibilityIdentifier(id ?? "")
                    .accessibilityHidden(!open)
                    .allowsHitTesting(open)
                    .opacity(measured == nil ? 0 : 1)
                }
                .offset(x: origin.x, y: origin.y)
                if open { MavisEscape { request("escape") } }
            }
            .frame(width: proxy.size.width, height: proxy.size.height, alignment: .topLeading)
            .onPreferenceChange(MavisHeightsKey.self) { heights = $0 }
            .onAppear { if open { watcher.start() } }
            .onChange(of: open) { _, next in
                if next { watcher.start() } else { watcher.stop() }
            }
            .onDisappear { watcher.stop() }
        }
    }
}

/// What the popovers share: a control in place and, while open and until it has left, a panel
/// beside it in the window's layer, drawn with the theme around the control.
struct MavisPopoverAnchor<Anchor: View, Panel: View>: View {
    let open: Bool
    let label: String
    var placement = "bottom-start"
    var width = 280.0
    var id: String? = nil
    let request: (String) -> Void
    @ViewBuilder let anchor: () -> Anchor
    @ViewBuilder let panel: () -> Panel
    @Namespace private var layer
    @State private var window = MavisWindowBox()
    @State private var focus = MavisPopoverFocus()
    @Environment(\\.mavisTheme) private var theme
    @Environment(\\.mavisLayerLevel) private var level

    private func close(_ reason: String) {
        focus.returnsFocus = reason != "outside"
        request(reason)
    }

    var body: some View {
        anchor()
            .background {
                ZStack {
                    MavisWindowReader(box: window)
                    JoltPresence(open, enter: MavisLayerMotion.appear, leave: MavisLayerMotion.leave) {
                        Color.clear.anchorPreference(key: MavisLayerKey.self, value: .bounds) { bounds in
                            [MavisLayer(id: layer, level: level, anchor: bounds) { place in
                                AnyView(
                                    MavisPopoverPanel(open: open, anchor: place, label: label, placement: placement, width: width, id: id, request: close, content: panel)
                                        .environment(\\.mavisTheme, theme)
                                        .mavisSettled(unless: window)
                                )
                            }]
                        }
                    }
                    .mavisSettled(unless: window)
                }
                .accessibilityHidden(true)
            }
            .preference(key: MavisTopKey.self, value: open ? level : 0)
            .onChange(of: open) { _, next in
                if next { focus.capture(window.view) } else { focus.restore() }
            }
            .onDisappear { focus.responder = nil; focus.window = nil }
    }
}

/// The button a popover opens from: an MButton with its icon before its text, as wide as both.
struct MavisPopoverTrigger: View {
    let text: String
    var icon: String? = nil
    var variant = MavisButtonVariant.secondary
    var disabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon { MavisIcon(icon, size: 20) }
                Text(verbatim: text)
            }
        }
        .buttonStyle(MavisButtonStyle(variant: variant))
        .disabled(disabled)
        .fixedSize()
    }
}

/// An action in the panel of a menu or a speed dial: a ghost MButton with its icon.
struct MavisPopoverAction: View {
    let text: String
    var icon: String? = nil
    var leading = false
    var small = false
    var disabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon { MavisIcon(icon, size: 20) }
                Text(verbatim: text)
                if leading { Spacer(minLength: 0) }
            }
        }
        .buttonStyle(MavisButtonStyle(variant: .ghost, size: small ? .sm : .md))
        .disabled(disabled)
        .fixedSize(horizontal: false, vertical: true)
    }
}`,
}

// popoverProps: a trigger button, or the anchor slot in its place, and a panel of any content
// beside it. It is controlled: the trigger, Escape and a press outside ask to close through
// onUpdateOpen (update:open) with their reason in onClose.
export const MPopover = {
  props: {
    ...popoverProps,
    // What the Web tells assistive technology the panel is; a menu is MMenu.
    role: 'string',
    onOpened: 'handler',
  },
  required: ['label', 'triggerLabel'],
  children: 'elements',
  slots: ['anchor'],
  control: true,
  uses: [flexRuntime, layerRuntime, popoverRuntime],
  types: () => `type PopoverPlacement = ${union(placements)}
type PopoverCloseReason = ${union(reasons)}
type MavisPopoverProps = { id?: string; open?: boolean; onUpdateOpen?: (open: boolean) => void; label: string; triggerLabel: string; icon?: MavisIconName; variant?: ${union(variants)}; disabled?: boolean; placement?: PopoverPlacement; width?: number; padding?: MavisSpacing; onClose?: (reason: PopoverCloseReason) => void }`,
  declaration:
    "declare function MPopover(props: MavisPopoverProps & { role?: 'dialog' | 'menu'; onOpened?: () => void; slotAnchor?: JSX.Element; children?: unknown }): JSX.Element",
  check: named(['label', 'triggerLabel']),
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const views = (nodes) =>
      nodes.map((child) => emit.view(child, indent + 8, tokens)).join('\n') ||
      `${pad}        EmptyView()`
    const anchor = node.slots?.find((slot) => slot.name === 'anchor')
    const args = [
      `open: ${props.open ? emit.expr(props.open.expr) : 'false'}`,
      ...shared(props, context, [
        'label',
        'triggerLabel',
        'icon',
        'variant',
        'disabled',
        'placement',
        'width',
        'padding',
        'id',
        'onUpdateOpen',
        'onClose',
        'onOpened',
      ]),
      ...(anchor ? [`anchor: AnyView(MavisColumn {\n${views(anchor.body)}\n${pad}    })`] : []),
      `content: {\n${views(node.children)}\n${pad}    }`,
    ]
    return [
      swiftCall('MavisPopover', args, indent),
      // The trigger is as wide as its text, at the start of its stack; an anchor fills it.
      `${pad}    .mavisItem(shrink: 0, align: ${anchor ? '.stretch' : '.start'})`,
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
  }) => `/// MPopover: a trigger button, or the anchor in its place, and while open a panel of any content
/// beside it. The trigger, Escape and a press outside ask the source to close it, each with its
/// reason; the panel leaves when open turns false.
struct MavisPopover<Content: View>: View {
    let open: Bool
    let label: String
    let triggerLabel: String
    var icon: String? = nil
    var variant = MavisButtonVariant.secondary
    var disabled = false
    var placement = "bottom-start"
    var width = 280.0
    var padding = ${swiftNumber(theme.space.md)}
    var id: String? = nil
    var onUpdateOpen: (Bool) -> Void = { _ in }
    var onClose: (String) -> Void = { _ in }
    var onOpened: () -> Void = {}
    var anchor: AnyView? = nil
    @ViewBuilder let content: () -> Content

    private func request(_ reason: String) {
        guard open else { return }
        onUpdateOpen(false)
        onClose(reason)
    }

    var body: some View {
        MavisPopoverAnchor(open: open && !disabled, label: label, placement: placement, width: width, id: id, request: request) {
            if let anchor {
                anchor
            } else {
                MavisPopoverTrigger(text: triggerLabel, icon: icon, variant: variant, disabled: disabled) {
                    if open { request("trigger") } else { onUpdateOpen(true) }
                }
            }
        } panel: {
            MavisColumn { content() }.padding(padding)
        }
        .onAppear { if open, !disabled { onOpened() } }
        .onChange(of: open) { _, next in if next, !disabled { onOpened() } }
        .onChange(of: disabled) { _, next in if next { request("program") } }
    }
}`,
  vue: {
    rename: { onUpdateOpen: 'update:open' },
    types: ['PopoverPlacement', 'PopoverCloseReason'],
  },
}

// menuProps: the popover's trigger and a panel of actions, group labels and separators. Choosing
// an action reports it through onSelect and asks to close with the reason select.
export const MMenu = {
  props: {
    ...popoverProps,
    items: list('MenuItem'),
    onSelect: event(({ record, T }) => [T.string, record('MenuItem')]),
  },
  required: ['label', 'triggerLabel', 'items'],
  control: true,
  uses: [flexRuntime, layerRuntime, popoverRuntime],
  types:
    () => `/** An action of a menu (value and label), a separator or a group label (type and key). */
type MenuItem = { value?: string; label?: string; icon?: MavisIconName; disabled?: boolean; destructive?: boolean; type?: 'separator' | 'group'; key?: string }`,
  records: { MenuItem: 'the Mavis menu item type' },
  declaration:
    'declare function MMenu(props: MavisPopoverProps & { items: readonly MenuItem[]; onSelect?: (value: string, item: MenuItem) => void }): JSX.Element',
  check: named(['label', 'triggerLabel']),
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      `open: ${props.open ? emit.expr(props.open.expr) : 'false'}`,
      ...shared(props, context, ['label', 'triggerLabel']),
      `items: ${emit.expr(props.items.expr)}`,
      'entry: { item in MavisMenuEntry(value: item.value, label: item.label ?? "", icon: item.icon, disabled: item.disabled ?? false, destructive: item.destructive ?? false, kind: item.type, key: item.key) }',
      // A menu's panel has its own padding on every target, whatever padding says.
      ...shared(props, context, [
        'icon',
        'variant',
        'disabled',
        'placement',
        'width',
        'id',
        'onUpdateOpen',
        'onSelect',
        'onClose',
      ]),
    ]
    return [
      swiftCall('MavisMenu', args, indent),
      `${pad}    .mavisItem(shrink: 0, align: .start)`,
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// One row of an MMenu, whatever record the source keeps its items in.
struct MavisMenuEntry {
    var value: String? = nil
    var label = ""
    var icon: String? = nil
    var disabled = false
    var destructive = false
    /// separator or group; an action has none.
    var kind: String? = nil
    var key: String? = nil
}

/// MMenu: the popover's trigger and a panel of actions, group labels and separators, as the Web
/// draws them. Choosing an action reports it and asks the source to close the menu.
struct MavisMenu<Item>: View {
    let open: Bool
    let label: String
    let triggerLabel: String
    let items: [Item]
    let entry: (Item) -> MavisMenuEntry
    var icon: String? = nil
    var variant = MavisButtonVariant.secondary
    var disabled = false
    var placement = "bottom-start"
    var width = 280.0
    var id: String? = nil
    var onUpdateOpen: (Bool) -> Void = { _ in }
    var onSelect: (String, Item) -> Void = { _, _ in }
    var onClose: (String) -> Void = { _ in }
    @Environment(\\.mavisTheme) private var theme
    @FocusState private var focused: Int?
    @State private var search = ""
    @State private var searchedAt = Date.distantPast

    private var enabled: [Int] {
        items.indices.filter { index in
            let row = entry(items[index])
            return row.kind == nil && row.value != nil && !row.disabled
        }
    }

    private func key(_ press: KeyPress) -> KeyPress.Result {
        guard open, !disabled,
              press.modifiers.intersection([.command, .control, .option]).isEmpty else { return .ignored }
        let choices = enabled
        guard !choices.isEmpty else { return .ignored }
        if press.key == .downArrow || press.key == .upArrow {
            let at = focused.flatMap { choices.firstIndex(of: $0) }
            let forward = press.key == .downArrow
            focused = choices[at.map { ($0 + (forward ? 1 : choices.count - 1)) % choices.count } ?? (forward ? 0 : choices.count - 1)]
            return .handled
        }
        if press.key == .home || press.key == .end {
            focused = press.key == .home ? choices.first : choices.last
            return .handled
        }
        if press.key == .return || press.key == .space {
            if let focused, choices.contains(focused) { select(entry(items[focused]), items[focused]) }
            return .handled
        }
        if press.key == .tab { request("outside"); return .ignored }
        guard press.characters.count == 1, press.characters.first?.isLetter == true else { return .ignored }
        let now = Date()
        let character = press.characters.lowercased()
        search = now.timeIntervalSince(searchedAt) < 0.7 && search != character ? search + character : character
        searchedAt = now
        let start = focused.flatMap { choices.firstIndex(of: $0) } ?? -1
        let ordered = (1...choices.count).map { choices[(start + $0) % choices.count] }
        if let match = ordered.first(where: { entry(items[$0]).label.lowercased().hasPrefix(search) }) {
            focused = match
        }
        return .handled
    }

    private func request(_ reason: String) {
        guard open else { return }
        onUpdateOpen(false)
        onClose(reason)
    }

    private func select(_ row: MavisMenuEntry, _ item: Item) {
        guard open, !disabled, !row.disabled else { return }
        onSelect(row.value ?? "", item)
        onUpdateOpen(false)
        onClose("select")
    }

    @ViewBuilder private func row(_ row: MavisMenuEntry, _ item: Item, at index: Int) -> some View {
        if row.kind == "separator" {
            MavisSeparator()
        } else if row.kind != nil {
            Text(verbatim: row.label)
                .font(${font('overline')})
                .foregroundStyle(MavisTokens.muted)
                .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            MavisPopoverAction(text: row.label, icon: row.icon, leading: true, disabled: row.disabled) { select(row, item) }
                .focused($focused, equals: index)
                // A destructive action is drawn in the danger color, as on the Web.
                .environment(\\.mavisTheme, row.destructive ? theme.recolored([.text: .danger]) : theme)
        }
    }

    var body: some View {
        MavisPopoverAnchor(open: open && !disabled, label: label, placement: placement, width: width, id: id, request: request) {
            MavisPopoverTrigger(text: triggerLabel, icon: icon, variant: variant, disabled: disabled) {
                if open { request("trigger") } else { onUpdateOpen(true) }
            }
        } panel: {
            VStack(alignment: .leading, spacing: ${theme.space.xs}) {
                ForEach(Array(items.enumerated()), id: \\.offset) { each in
                    row(entry(each.element), each.element, at: each.offset)
                }
            }
            .padding(${theme.space.xs})
            .onKeyPress(action: key)
            .onAppear { focused = enabled.first; search = "" }
        }
        .onChange(of: disabled) { _, next in if next { request("program") } }
    }
}`,
  vue: {
    rename: { onUpdateOpen: 'update:open' },
    types: ['MenuItem'],
    attribute(name, value) {
      // MMenu tells an action from a separator by which fields an item has.
      if (name === 'items')
        return `:items="${expression(`(${js(value.expr)}.map((item) => (item.type ? { type: item.type, key: item.key, label: item.label } : { value: item.value, label: item.label, icon: item.icon, disabled: item.disabled, destructive: item.destructive })) as never)`)}"`
      if (name === 'onSelect') return selected(value)
    },
  },
}

// speedDialProps: a primary button that opens a panel of actions and a close action. Choosing an
// action reports it through onSelect and asks to close.
export const MSpeedDial = {
  props: {
    id: 'string',
    label: 'string',
    open: 'boolean',
    onUpdateOpen: 'boolean-handler',
    disabled: 'boolean',
    actions: list('SpeedDialAction'),
    icon: 'string',
    closeLabel: 'string',
    direction: 'string',
    onSelect: event(({ record, T }) => [T.string, record('SpeedDialAction')]),
    onClose: 'string-handler',
  },
  required: ['label', 'actions'],
  control: true,
  uses: [flexRuntime, layerRuntime, popoverRuntime],
  types: () =>
    'type SpeedDialAction = { value: string; label: string; icon?: MavisIconName; disabled?: boolean }',
  records: { SpeedDialAction: 'the Mavis speed dial action type' },
  declaration: `declare function MSpeedDial(props: { id?: string; label: string; open?: boolean; onUpdateOpen?: (open: boolean) => void; disabled?: boolean; actions: readonly SpeedDialAction[]; icon?: MavisIconName; closeLabel?: string; direction?: ${union(directions)}; onSelect?: (value: string, action: SpeedDialAction) => void; onClose?: (reason: string) => void }): JSX.Element`,
  check: named(['label']),
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      `open: ${props.open ? emit.expr(props.open.expr) : 'false'}`,
      ...shared(props, context, ['label']),
      `actions: ${emit.expr(props.actions.expr)}`,
      'entry: { action in MavisMenuEntry(value: action.value, label: action.label, icon: action.icon, disabled: action.disabled ?? false) }',
      ...shared(props, context, ['disabled', 'icon', 'closeLabel']),
      ...(props.direction
        ? [
            `up: ${'lit' in props.direction ? props.direction.lit !== 'down' : `${emit.expr(props.direction.expr)} != "down"`}`,
          ]
        : []),
      ...shared(props, context, ['id', 'onUpdateOpen', 'onSelect', 'onClose']),
    ]
    return [
      swiftCall('MavisSpeedDial', args, indent),
      `${pad}    .mavisItem(shrink: 0, align: .start)`,
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
  }) => `/// MSpeedDial: a primary button with its icon and label that opens a panel of actions and a close
/// action beside it, above it by default. Choosing an action reports it and asks the source to
/// close the panel.
struct MavisSpeedDial<Action>: View {
    let open: Bool
    let label: String
    let actions: [Action]
    let entry: (Action) -> MavisMenuEntry
    var disabled = false
    var icon = "plus"
    var closeLabel = "Close actions"
    var up = true
    var id: String? = nil
    var onUpdateOpen: (Bool) -> Void = { _ in }
    var onSelect: (String, Action) -> Void = { _, _ in }
    var onClose: (String) -> Void = { _ in }

    private func request(_ reason: String) {
        guard open else { return }
        onUpdateOpen(false)
        onClose(reason)
    }

    var body: some View {
        MavisPopoverAnchor(open: open && !disabled, label: label, placement: up ? "top-end" : "bottom-end", width: 260, id: id, request: request) {
            MavisPopoverTrigger(text: label, icon: open ? "x" : icon, variant: .primary, disabled: disabled) {
                if open { request("trigger") } else { onUpdateOpen(true) }
            }
        } panel: {
            VStack(alignment: .leading, spacing: ${theme.space.xs}) {
                ForEach(Array(actions.enumerated()), id: \\.offset) { each in
                    let row = entry(each.element)
                    MavisPopoverAction(text: row.label, icon: row.icon, disabled: disabled || row.disabled) {
                        guard open, !disabled, !row.disabled else { return }
                        onSelect(row.value ?? "", each.element)
                        onUpdateOpen(false)
                    }
                }
                MavisPopoverAction(text: closeLabel, small: true) {
                    onUpdateOpen(false)
                    onClose("action")
                }
            }
            .padding(${theme.space.sm})
        }
        .onChange(of: disabled) { _, next in if next { request("program") } }
    }
}`,
  vue: {
    rename: { onUpdateOpen: 'update:open' },
    types: ['SpeedDialAction'],
    attribute(name, value) {
      if (name === 'actions') return `:actions="${expression(`(${js(value.expr)} as never)`)}"`
      if (name === 'onSelect') return selected(value)
    },
  },
}
