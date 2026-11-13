import { event, swiftCall } from './choices.mjs'
import { listRuntime } from './list-parts.mjs'
import { MSheet } from './sheet.mjs'

const labels = ['label', 'searchLabel', 'placeholder', 'emptyLabel', 'loadingLabel', 'closeLabel']
export const MCommandPalette = {
  props: {
    id: 'string',
    ...Object.fromEntries(labels.map((key) => [key, 'string'])),
    items: ({ value, ctx, expr, record, T }) => ({
      expr: expr(value, ctx, T.array(record('CommandItem'))),
    }),
    open: 'boolean',
    query: ({ value, ctx, expr, T }) => ({ expr: expr(value, ctx, T.optional(T.string)) }),
    disabled: 'boolean',
    loading: 'boolean',
    shortcut: 'boolean',
    returnFocus: 'string',
    onUpdateOpen: 'boolean-handler',
    onQueryChange: 'string-handler',
    onSelect: event(({ T, record }) => [T.string, record('CommandItem')]),
  },
  required: ['label', 'items'],
  control: true,
  uses: [MSheet, listRuntime],
  records: { CommandItem: 'the Mavis command item type' },
  types: () =>
    'type CommandItem = { value: string; label: string; description?: string; keywords?: readonly string[]; group?: string; icon?: MavisIconName; shortcut?: string; disabled?: boolean }',
  declaration: `declare function MCommandPalette(props: { id?: string; label: string; items: readonly CommandItem[]; open?: boolean; query?: string; disabled?: boolean; loading?: boolean; shortcut?: boolean; returnFocus?: string; ${labels
    .filter((k) => k !== 'label')
    .map((k) => `${k}?: string`)
    .join(
      '; ',
    )}; onUpdateOpen?: (value: boolean) => void; onQueryChange?: (query: string) => void; onSelect?: (value: string, item: CommandItem) => void }): JSX.Element`,
  check({ props, attrs, fail }) {
    for (const key of ['label', 'searchLabel'])
      if (props[key] && 'lit' in props[key] && !props[key].lit.trim())
        fail(attrs.get(key), `${key} cannot be blank.`)
  },
  swift(node, { emit, indent }) {
    const props = node.props
    return swiftCall(
      'MavisCommandPalette',
      [
        `label: ${emit.value(props.label)}`,
        `items: ${emit.wrap(props.items.expr)}.map { MavisCommandEntry(item: $0, value: $0.value, label: $0.label, description: $0.description, keywords: $0.keywords, group: $0.group, icon: $0.icon, shortcut: $0.shortcut, disabled: $0.disabled) }`,
        ...['id', 'open', 'query', 'disabled', 'loading', 'shortcut', ...labels.slice(1)].flatMap(
          (k) => (props[k] ? [`${k}: ${emit.value(props[k])}`] : []),
        ),
        ...['onUpdateOpen', 'onQueryChange', 'onSelect'].flatMap((k) =>
          props[k] ? [`${k}: ${emit.handler(props[k], indent + 4)}`] : [],
        ),
      ],
      indent,
    )
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// Same token search as filterCommands: NFD, remove U+0300...036F, lowercase, every word.
func mavisCommandSearch(_ text: String) -> String {
    String(String.UnicodeScalarView(text.decomposedStringWithCanonicalMapping.unicodeScalars.filter { !(0x0300...0x036f).contains($0.value) })).lowercased()
}

/// A shortcut belongs to its live window. Editable responders and disabled layers retain it.
private struct MavisCommandShortcut: NSViewRepresentable {
    let enabled: Bool
    let action: () -> Void
    final class Listener {
        var monitor: Any?
        var enabled = false
        var action: () -> Void = {}
        weak var view: NSView?
        func stop() { if let monitor { NSEvent.removeMonitor(monitor) }; monitor = nil }
        deinit { stop() }
    }
    func makeCoordinator() -> Listener { Listener() }
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        let listener = context.coordinator
        listener.view = view
        listener.monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak listener] event in
            guard let listener, listener.enabled, let window = listener.view?.window,
                  window === event.window, NSApp.modalWindow == nil,
                  event.modifierFlags.intersection([.command, .control, .option, .shift]) == .command,
                  event.charactersIgnoringModifiers?.lowercased() == "k" else { return event }
            if let editor = window.firstResponder as? NSTextView, editor.isEditable { return event }
            listener.action()
            return nil
        }
        return view
    }
    func updateNSView(_ view: NSView, context: Context) {
        context.coordinator.enabled = enabled
        context.coordinator.action = action
    }
    static func dismantleNSView(_ view: NSView, coordinator: Listener) { coordinator.stop() }
}

struct MavisCommandEntry<Item>: Identifiable {
    let item: Item
    let value: String
    let label: String
    let description: String?
    let keywords: [String]?
    let group: String?
    let icon: String?
    let shortcut: String?
    let disabled: Bool?
    var id: String { value }
}

struct MavisCommandPalette<Item>: View {
    let label: String
    let items: [MavisCommandEntry<Item>]
    var id: String? = nil
    var open = false
    var query: String? = nil
    var disabled = false
    var loading = false
    var shortcut = false
    var searchLabel = "Search commands"
    var placeholder = "What would you like to do?"
    var emptyLabel = "No matching commands"
    var loadingLabel = "Loading commands"
    var closeLabel = "Close commands"
    var onUpdateOpen: (Bool) -> Void = { _ in }
    var onQueryChange: (String) -> Void = { _ in }
    var onSelect: (String, Item) -> Void = { _, _ in }
    @State private var local = ""
    @FocusState private var focused: String?
    @Environment(\\.isEnabled) private var enabled

    private var text: String { query ?? local }
    private var matches: [MavisCommandEntry<Item>] {
        guard Set(items.map(\\.value)).count == items.count, items.allSatisfy({ !mavisTrim($0.label).isEmpty }) else { return [] }
        let terms = mavisCommandSearch(mavisTrim(text)).split(whereSeparator: { $0.isWhitespace }).map(String.init)
        return items.filter { item in
            let words = [item.label, item.description ?? "", item.group ?? ""] + (item.keywords ?? [])
            let haystack = mavisCommandSearch(words.joined(separator: " "))
            return terms.allSatisfy(haystack.contains)
        }
    }
    private func choose(_ item: MavisCommandEntry<Item>) {
        guard open, !disabled, !loading, item.disabled != true else { return }
        onSelect(item.value, item.item)
        onUpdateOpen(false)
    }
    private func keys(_ key: KeyPress) -> KeyPress.Result {
        guard !loading, !disabled, key.modifiers.intersection([.command, .control, .option]).isEmpty else { return .ignored }
        let available = matches.filter { $0.disabled != true }
        guard !available.isEmpty else { return .ignored }
        let index = available.firstIndex { "item:" + $0.value == focused } ?? -1
        var next: Int
        switch key.key {
        case .downArrow: next = min(index + 1, available.count - 1)
        case .upArrow: next = index < 0 ? available.count - 1 : index - 1
        case .home where index >= 0: next = 0
        case .end where index >= 0: next = available.count - 1
        case .return where index < 0: choose(available[0]); return .handled
        default: return .ignored
        }
        focused = next < 0 ? "query" : "item:" + available[next].value
        return .handled
    }
    private func row(_ item: MavisCommandEntry<Item>) -> some View {
        Button { choose(item) } label: {
            HStack(spacing: ${theme.space.sm}) {
                if let icon = item.icon { MavisIcon(icon, size: 20) }
                VStack(alignment: .leading, spacing: ${theme.space.xs}) {
                    Text(verbatim: item.label).font(${font('body')})
                    if let detail = item.description { Text(verbatim: detail).font(${font('caption')}).foregroundStyle(MavisTokens.muted) }
                }
                Spacer(minLength: 8)
                if let hint = item.shortcut { Text(verbatim: hint).font(${font('caption')}).foregroundStyle(MavisTokens.muted) }
            }
            .foregroundStyle(MavisTokens.text)
            .padding(${theme.space.sm})
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(focused == "item:" + item.value ? MavisTokens.primarySoft : MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
        }
        .buttonStyle(MavisRowButtonStyle())
        .disabled(disabled || loading || item.disabled == true)
        .focused($focused, equals: "item:" + item.value)
        .onKeyPress(phases: .down, action: keys)
    }
    var body: some View {
        MavisSheet(open: open && !disabled, title: label, closeLabel: closeLabel, gap: ${theme.space.md}, id: id, onUpdateOpen: onUpdateOpen) {
            VStack(alignment: .leading, spacing: ${theme.space.xs}) {
                Text(verbatim: searchLabel).font(${font('caption')}).foregroundStyle(MavisTokens.muted)
                TextField(placeholder, text: Binding(get: { text }, set: { local = $0; onQueryChange($0) }))
                    .textFieldStyle(.roundedBorder)
                    .focused($focused, equals: "query")
                    .onKeyPress(phases: .down, action: keys)
                    .onAppear { focused = "query" }
            }
            if loading || matches.isEmpty {
                Text(verbatim: loading ? loadingLabel : emptyLabel).font(${font('body')}).foregroundStyle(MavisTokens.muted)
            } else {
                VStack(alignment: .leading, spacing: ${theme.space.xs}) {
                    ForEach(Array(matches.enumerated()), id: \\.element.value) { pair in
                        if let group = pair.element.group, pair.offset == 0 || matches[pair.offset - 1].group != group {
                            Text(verbatim: group).font(${font('caption')}).foregroundStyle(MavisTokens.muted)
                        }
                        row(pair.element)
                    }
                }
                .joltLayout(value: matches.map(\\.value), transition: .spring(.snappy))
            }
        }
        .background(MavisCommandShortcut(enabled: shortcut && !disabled && (enabled || open)) { onUpdateOpen(!open) })
        .onChange(of: open) { _, next in if !next && query == nil { local = "" }; if next { focused = "query" } }
        .onChange(of: disabled) { _, next in if next && open { onUpdateOpen(false) } }
    }
}`,
  vue: {
    rename: { onUpdateOpen: 'update:open', onQueryChange: 'update:query' },
    types: ['CommandItem'],
  },
}
