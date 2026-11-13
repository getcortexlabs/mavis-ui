import { swiftString } from '../swift-text.mjs'
import { choiceRuntime, event, fieldReference, swiftArguments, swiftRecord } from './choices.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'

const attachments = ({ value, ctx, expr, record, T }) => ({
  expr: expr(value, ctx, T.array(record('ComposerAttachment'))),
})
const attachmentEvent = event(
  ({ T, record }) => [T.array(record('ComposerAttachment'))],
  'ComposerAttachment[]',
)
const messageEvent = event(({ record }) => [record('ComposerMessage')], 'ComposerMessage')
const labels = ['placeholder', 'error', 'attachLabel', 'removeLabel', 'sendLabel', 'sendingLabel']

// The message belongs to the source, including its attachments. Sending reports a snapshot;
// only the source decides whether to clear it. Return remains a newline, Cmd/Ctrl+Return sends.
export const MComposer = {
  props: {
    id: 'string',
    label: 'string',
    value: 'string',
    onChange: 'string-handler',
    attachments,
    onAttachmentsChange: attachmentEvent,
    onSubmit: messageEvent,
    onAttach: 'handler',
    onFocus: 'handler',
    onBlur: 'handler',
    disabled: 'boolean',
    readonly: 'boolean',
    loading: 'boolean',
    rows: 'number',
    maxLength: 'number',
    attachable: 'boolean',
    shortcut: 'boolean',
    // macOS has no software keyboard to follow; these remain part of the shared source.
    followKeyboard: 'boolean',
    keyboardOffset: 'number',
    ref: fieldReference,
    ...Object.fromEntries(labels.map((label) => [label, 'string'])),
  },
  required: ['label', 'value', 'onChange'],
  children: 'elements',
  control: true,
  focus: () => true,
  uses: [flexRuntime, choiceRuntime],
  records: {
    ComposerAttachment: 'the attachment of a Mavis composer',
    ComposerMessage: 'the message submitted by a Mavis composer',
  },
  types: () => `type ComposerAttachment = { id: string; name: string }
type ComposerMessage = { text: string; attachments: readonly ComposerAttachment[] }`,
  declaration: `declare function MComposer(props: { id?: string; label: string; value: string; onChange: (value: string) => void; attachments?: readonly ComposerAttachment[]; onAttachmentsChange?: (attachments: ComposerAttachment[]) => void; onSubmit?: (message: ComposerMessage) => void; onAttach?: () => void; onFocus?: () => void; onBlur?: () => void; disabled?: boolean; readonly?: boolean; loading?: boolean; rows?: number; maxLength?: number; attachable?: boolean; shortcut?: boolean; followKeyboard?: boolean; keyboardOffset?: number; ref?: MavisFieldRef; ${labels.map((label) => `${label}?: string`).join('; ')}; children?: unknown }): JSX.Element`,
  swift(node, context) {
    const { emit, indent, tokens } = context
    const props = node.props
    const pad = ' '.repeat(indent)
    const sourceAttachments = () =>
      `items.map { ${swiftRecord(emit, 'ComposerAttachment', { id: '$0.id', name: '$0.name' })} }`
    const args = [
      ...swiftArguments(node, context, [['label'], ['value'], ['onChange']]),
      'focus: $mavisFocus',
      `focusKey: ${props.ref ? swiftString(props.ref.ref) : emit.focusKey('composer')}`,
      ...(props.attachments
        ? [
            `attachments: ${emit.wrap(props.attachments.expr)}.map { MavisComposerAttachment(id: $0.id, name: $0.name) }`,
          ]
        : []),
      ...(props.onAttachmentsChange
        ? [
            `onAttachmentsChange: { items in (${emit.handler(props.onAttachmentsChange, indent + 4)})(${sourceAttachments()}) }`,
          ]
        : []),
      ...(props.onSubmit
        ? [
            `onSubmit: { text, items in (${emit.handler(props.onSubmit, indent + 4)})(${swiftRecord(emit, 'ComposerMessage', { text: 'text', attachments: sourceAttachments() })}) }`,
          ]
        : []),
      ...swiftArguments(node, context, [
        ['onAttach'],
        ['onFocus'],
        ['onBlur'],
        ['disabled'],
        ['readonly'],
        ['loading'],
        ['rows'],
        ['maxLength'],
        ['attachable'],
        ['shortcut'],
        ...labels.map((label) => [label]),
        ['id'],
      ]),
      `content: {\n${node.children.map((child) => emit.view(child, indent + 8, tokens)).join('\n') || `${pad}        EmptyView()`}\n${pad}    }`,
    ]
    return `${pad}MavisComposer(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
  },
  swiftRuntime: ({ theme }) => `struct MavisComposerAttachment: Identifiable, Equatable {
    let id: String
    let name: String
}

/// MComposer: the shared multiline field, attachment chips and the source's extra content in
/// a themed card. Jolt moves attachment rows and gives its action buttons their press response.
struct MavisComposer<Content: View>: View {
    let label: String
    let value: String
    let onChange: (String) -> Void
    let focus: FocusState<String?>.Binding
    let focusKey: String
    var attachments: [MavisComposerAttachment] = []
    var onAttachmentsChange: ([MavisComposerAttachment]) -> Void = { _ in }
    var onSubmit: (String, [MavisComposerAttachment]) -> Void = { _, _ in }
    var onAttach: () -> Void = {}
    var onFocus: () -> Void = {}
    var onBlur: () -> Void = {}
    var disabled = false
    var readonly = false
    var loading = false
    var rows = 2.0
    var maxLength: Double? = nil
    var attachable = true
    var shortcut = true
    var placeholder = ""
    var error = ""
    var attachLabel = "Add attachment"
    var removeLabel = "Remove attachment"
    var sendLabel = "Send message"
    var sendingLabel = "Sending"
    var id = ""
    @ViewBuilder var content: () -> Content

    private var blocked: Bool { disabled || readonly || loading }
    private var canSend: Bool { !blocked && (!mavisTrim(value).isEmpty || !attachments.isEmpty) }
    private var focused: Bool { focus.wrappedValue == focusKey }

    private func submit() {
        guard canSend else { return }
        onSubmit(value, attachments)
    }

    var body: some View {
        let _ = precondition(Set(attachments.map(\\.id)).count == attachments.count, "Composer attachments require unique ids.")
        MavisCard(paddingX: ${theme.space.md}, paddingY: ${theme.space.md}, spacing: ${theme.space.sm}) {
            MavisTextInput(label: label, value: value, onChange: { if !blocked { onChange($0) } }, focus: focus, focusKey: focusKey, placeholder: placeholder, error: error, multiline: true, rows: rows, maxLength: maxLength, disabled: disabled, readonly: readonly || loading, id: id)
            if !attachments.isEmpty {
                MavisRow(spacing: ${theme.space.xs}, wrap: true) {
                    ForEach(attachments) { attachment in
                        MavisSelectionChip(label: attachment.name, removeLabel: removeLabel + ": " + attachment.name, disabled: blocked) {
                            if !blocked { onAttachmentsChange(attachments.filter { $0.id != attachment.id }) }
                        }
                    }
                }
            }
            content()
            MavisRow(spacing: ${theme.space.sm}, justify: .between, align: .center, wrap: true) {
                if attachable {
                    Button(action: { if !blocked { onAttach() } }) {
                        MavisButtonLabel(text: attachLabel, icon: ${swiftGlyph('paperclip')}, variant: .ghost, size: .sm)
                    }
                    .buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm))
                    .disabled(blocked)
                }
                Button(action: submit) {
                    MavisButtonLabel(text: sendLabel, icon: ${swiftGlyph('arrow-up')}, loading: loading, loadingText: sendingLabel, size: .sm)
                }
                .buttonStyle(MavisButtonStyle(size: .sm, loading: loading))
                .disabled(!canSend)
            }
        }
        .joltLayout(value: attachments.map(\\.id), transition: .spring(.smooth))
        .background(MavisComposerKeys(active: shortcut && focused, submit: submit))
        .onChange(of: focused) { _, now in if now { onFocus() } else { onBlur() } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}

/// TextEditor consumes Return before SwiftUI's parent key handler. Observe only this editor's
/// window while it owns focus; plain Return and a marked IME composition are left untouched.
private struct MavisComposerKeys: NSViewRepresentable {
    var active: Bool
    var submit: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        context.coordinator.view = view
        context.coordinator.monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak coordinator = context.coordinator] event in
            MainActor.assumeIsolated {
                guard let coordinator, coordinator.active,
                      let window = coordinator.view?.window, event.window === window,
                      event.keyCode == 36 || event.keyCode == 76,
                      !event.modifierFlags.intersection([.command, .control]).isEmpty,
                      let editor = window.firstResponder as? NSTextView,
                      !editor.hasMarkedText() else { return event }
                coordinator.submit()
                return nil
            }
        }
        return view
    }
    func updateNSView(_ view: NSView, context: Context) {
        context.coordinator.active = active
        context.coordinator.submit = submit
    }
    static func dismantleNSView(_ view: NSView, coordinator: Coordinator) {
        if let monitor = coordinator.monitor { NSEvent.removeMonitor(monitor) }
        coordinator.monitor = nil
    }
    @MainActor final class Coordinator {
        weak var view: NSView?
        var active = false
        var submit: () -> Void = {}
        var monitor: Any?
    }
}`,
  vue: {
    types: ['ComposerAttachment', 'ComposerMessage'],
    rename: {
      value: 'modelValue',
      onChange: 'update:modelValue',
      onAttachmentsChange: 'update:attachments',
    },
  },
}
