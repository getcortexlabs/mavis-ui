import { fieldReference, swiftArguments, swiftCall } from './choices.mjs'
import { flexRuntime } from './flex.mjs'
import { fileSelectionRuntime, fileSelectionTypes } from './file-selection.mjs'
import {
  fileSelectionOpen,
  fileSelectionCall,
  fileSelectionMember,
  fileSelectionReadCall,
  fileOpaqueMember,
  fileOpaqueEffect,
} from '../frontends/resources.mjs'
import {
  fileSelectionSwiftInit,
  fileSelectionSwiftValue,
  fileSelectionVueScript,
  fileSelectionSwiftUpdate,
  fileSelectionSwiftStatement,
} from '../resources.mjs'

const labels = [
  'chooseLabel',
  'uploadLabel',
  'cancelLabel',
  'retryLabel',
  'removeLabel',
  'emptyLabel',
  'pendingLabel',
]
const statuses = ['selected', 'uploading', 'uploaded', 'failed', 'cancelled']
const errors = ['picker', 'type', 'size', 'count']
const labelRecord =
  (type) =>
  ({ value, ctx, expr, record }) => ({ expr: expr(value, ctx, record(type)) })

export const MFilePicker = {
  props: {
    id: 'string',
    label: 'string',
    selection({ value, ctx, fail, ts }) {
      const resource =
        ts.isIdentifier(value) &&
        ctx.component.refs.find((resource) => resource.name === value.text)
      if (!resource || resource.kind !== 'files')
        fail(
          value,
          'selection is the controller owned by this component: const files = useFileSelection({ … }).',
        )
      resource.field = true
      return { ref: resource.name }
    },
    disabled: 'boolean',
    ref: fieldReference,
    statusLabels: labelRecord('FileStatusLabels'),
    errorLabels: labelRecord('FileErrorLabels'),
    ...Object.fromEntries(labels.map((label) => [label, 'string'])),
  },
  required: ['label', 'selection'],
  control: true,
  focus: () => true,
  uses: [flexRuntime, fileSelectionRuntime],
  composable: {
    name: 'useFileSelection',
    kind: 'files',
    resource: true,
    typeImports: {
      '@getcortexlabs/mavis-core': [
        'FileHandle',
        'FileUploadContext',
        'FileCancellation',
        'FileItem',
        'FileSelectionState',
        'FileSelectionOptions',
        'FileSelectionController',
        'FileUpload',
      ],
    },
    types: {
      FileHandle: {
        type: { k: 'opaque', name: 'FileHandle', swift: 'MavisFileHandle' },
        member: fileOpaqueMember,
        effect: fileOpaqueEffect,
      },
      FileUploadContext: {
        type: { k: 'opaque', name: 'FileUploadContext', swift: 'MavisFileUploadContext' },
        member: fileOpaqueMember,
        effect: fileOpaqueEffect,
      },
      FileCancellation: {
        type: { k: 'opaque', name: 'FileCancellation', swift: 'MavisFileCancellation' },
        member: fileOpaqueMember,
        effect: fileOpaqueEffect,
      },
    },
    declaration:
      'function useFileSelection(options?: FileSelectionOptions): FileSelectionController',
    open: fileSelectionOpen,
    call: fileSelectionCall,
    member: fileSelectionMember,
    valueCall: fileSelectionReadCall,
    swift: (name) => `@StateObject private var ${name}: MavisFileSelection`,
    initialize: (reference, emit) => fileSelectionSwiftInit({ reference, emit }),
    update: fileSelectionSwiftUpdate,
    statement: fileSelectionSwiftStatement,
    value: (emit, value, owner) => fileSelectionSwiftValue({ emit, value, owner }),
    contextType: 'MavisFileSelection',
    dispose: (reference, owner = 'self') => `${owner}.${reference.name}.dispose()`,
    vue: (reference, js) => fileSelectionVueScript({ reference, js }),
    unused: (name) =>
      `${name} is not shown anywhere: add MFilePicker with ${name} as its selection.`,
  },
  records: {
    FileItem: 'the serializable Mavis file metadata',
    FileSelectionFailure: 'the file selection error',
    FileSelectionState: 'the file controller snapshot',
    FileStatusLabels: 'the file status labels',
    FileErrorLabels: 'the file error labels',
  },
  types: () => `${fileSelectionTypes}
type FileStatusLabels = { ${statuses.map((status) => `${status}?: string`).join('; ')} }
type FileErrorLabels = { ${errors.map((error) => `${error}?: string`).join('; ')} }`,
  declaration: `declare function MFilePicker(props: { id?: string; label: string; selection: FileSelectionController; disabled?: boolean; ref?: MavisFieldRef; statusLabels?: FileStatusLabels; errorLabels?: FileErrorLabels; ${labels.map((label) => `${label}?: string`).join('; ')} }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    const args = [
      `selection: self.${props.selection.ref}`,
      `label: ${emit.value(props.label)}`,
      'focus: $mavisFocus',
      `focusKey: ${props.ref ? JSON.stringify(props.ref.ref) : emit.focusKey('files')}`,
      ...swiftArguments(node, context, [['disabled'], ...labels.map((label) => [label])]),
    ]
    for (const [key, type, fields] of [
      ['statusLabels', 'FileStatusLabels', statuses],
      ['errorLabels', 'FileErrorLabels', errors],
    ]) {
      if (props[key])
        args.push(
          `${key}: { (labels: ${type}) in [${fields.map((field) => `"${field}": labels.${field}`).join(', ')}].compactMapValues { $0 } }(${emit.expr(props[key].expr)})`,
        )
    }
    if (props.id) args.push(`id: ${emit.value(props.id)}`)
    return swiftCall('MavisFilePicker', args, indent)
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// Native file selection with Mavis labels, metadata and resource ownership. File URLs remain
/// in the controller; the shared source sees only FileItem snapshots. Jolt moves retained rows.
struct MavisFilePicker: View {
    @ObservedObject var selection: MavisFileSelection
    let label: String
    let focus: FocusState<String?>.Binding
    let focusKey: String
    var disabled = false
    var chooseLabel = "Choose files"
    var uploadLabel = "Upload"
    var cancelLabel = "Cancel"
    var retryLabel = "Retry"
    var removeLabel = "Remove"
    var emptyLabel = "No files selected"
    var pendingLabel = "Working"
    var statusLabels: [String: String] = [:]
    var errorLabels: [String: String] = [:]
    var id = ""
    @StateObject private var lifetime = MavisFilePickerLifetime()
    @State private var anchor = MavisFileAnchor()
    @State private var mounted = false
    @State private var targeted = false

    private func focusChoose() {
        if mounted && !disabled && !selection.picking { focus.wrappedValue = focusKey }
    }
    private func choose() {
        guard mounted && !disabled && !selection.picking else { return }
        focusChoose()
        selection.choose(in: anchor.view?.window)
    }
    private func status(_ item: MavisFileDescriptor) -> String {
        statusLabels[item.status] ?? ["selected": "Ready", "uploading": "Uploading", "uploaded": "Uploaded", "failed": "Failed", "cancelled": "Cancelled"][item.status]!
    }
    private func row(_ item: MavisFileDescriptor) -> some View {
        MavisCard(paddingX: ${theme.space.lg}, paddingY: ${theme.space.lg}, spacing: ${theme.space.sm}) {
            if let image = selection.preview(item.id) {
                Image(nsImage: image).resizable().scaledToFit().frame(width: 80, height: 80).accessibilityHidden(true)
            }
            Text(verbatim: item.name).font(${font('body')}).fontWeight(.semibold).foregroundStyle(MavisTokens.text).fixedSize(horizontal: false, vertical: true)
            Text(verbatim: status(item) + (item.size.map { " · " + mavisString($0) + " B" } ?? ""))
                .font(${font('caption')}).foregroundStyle(item.status == "failed" ? MavisTokens.danger : item.status == "uploaded" ? MavisTokens.success : MavisTokens.muted)
            if item.status == "uploading" {
                MavisProgress(label: uploadLabel + ": " + item.name, value: (item.progress ?? 0) * 100, indeterminate: item.progress == nil, indeterminateLabel: pendingLabel)
            }
            if let error = item.error { Text(verbatim: error).font(${font('caption')}).foregroundStyle(MavisTokens.danger) }
            MavisRow(spacing: ${theme.space.sm}, wrap: true) {
                if item.status == "uploading" {
                    Button(action: { if !disabled { selection.cancel(item.id) } }) { Text(verbatim: cancelLabel) }
                        .buttonStyle(MavisButtonStyle(variant: .secondary)).disabled(disabled)
                        .accessibilityLabel(Text(verbatim: cancelLabel + ": " + item.name))
                }
                if selection.canUpload && item.status != "uploaded" && item.status != "uploading" {
                    let retry = item.status == "failed" || item.status == "cancelled"
                    Button(action: {
                        guard mounted && !disabled else { return }
                        let current = selection
                        Task { @MainActor in await current.upload(item.id) }
                    }) { Text(verbatim: retry ? retryLabel : uploadLabel) }
                        .buttonStyle(MavisButtonStyle(variant: .primary))
                        .disabled(disabled || !selection.hasFile(item.id))
                        .accessibilityLabel(Text(verbatim: (retry ? retryLabel : uploadLabel) + ": " + item.name))
                }
                Button(action: { if !disabled { focusChoose(); selection.remove(item.id) } }) { Text(verbatim: removeLabel) }
                    .buttonStyle(MavisButtonStyle(variant: .ghost)).disabled(disabled)
                    .accessibilityLabel(Text(verbatim: removeLabel + ": " + item.name))
            }
        }
    }

    var body: some View {
        let _ = precondition(!mavisTrim(label).isEmpty, "FilePicker needs a non-empty label")
        MavisColumn(spacing: ${theme.space.md}) {
            Text(verbatim: label).font(${font('body')}).fontWeight(.semibold).foregroundStyle(MavisTokens.text)
            MavisRow(spacing: ${theme.space.sm}, wrap: true) {
                Button(action: choose) { Text(verbatim: chooseLabel) }
                    .buttonStyle(MavisButtonStyle(variant: .secondary))
                    .disabled(disabled || selection.picking)
                    .focused(focus, equals: focusKey)
                if selection.picking {
                    Button(action: { selection.cancelSelection(); focusChoose() }) { Text(verbatim: cancelLabel) }
                        .buttonStyle(MavisButtonStyle(variant: .ghost))
                }
            }
            if let error = selection.error {
                Text(verbatim: errorLabels[error.code] ?? error.message).font(${font('body')}).foregroundStyle(MavisTokens.danger)
            }
            if selection.items.isEmpty { Text(verbatim: emptyLabel).font(${font('body')}).foregroundStyle(MavisTokens.muted) }
            ForEach(selection.items) { row($0) }
        }
        .joltLayout(value: selection.items.map(\\.id), transition: .spring(.smooth))
        .overlay(RoundedRectangle(cornerRadius: ${theme.radius.lg}).strokeBorder(targeted && !disabled ? MavisTokens.primary : .clear, lineWidth: 2).allowsHitTesting(false))
        .background(MavisFileAnchorReader(anchor: anchor, lifetime: lifetime, selection: selection))
        .onDrop(of: [UTType.fileURL], isTargeted: $targeted) { providers in !disabled && selection.drop(providers) }
        .onAppear { mounted = true; if disabled { selection.pause() } }
        .onDisappear { mounted = false }
        .onChange(of: disabled) { _, value in if value { selection.pause() } }
        .onChange(of: selection.picking) { _, value in if !value { focusChoose() } }
        .mavisIdentifier(id)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}

private final class MavisFileAnchor { weak var view: NSView? }
/// A picker disappearing under another view is not a disposal. Pause only when the control's
/// identity is released; the shared component separately owns and disposes its controller.
private final class MavisFilePickerLifetime: ObservableObject {
    var cleanup: (@MainActor () -> Void)?
    deinit {
        let finish = cleanup
        Task { @MainActor in finish?() }
    }
}
private struct MavisFileAnchorReader: NSViewRepresentable {
    let anchor: MavisFileAnchor
    let lifetime: MavisFilePickerLifetime
    let selection: MavisFileSelection
    func makeNSView(context: Context) -> NSView { let view = Anchor(); updateNSView(view, context: context); return view }
    func updateNSView(_ view: NSView, context: Context) {
        anchor.view = view
        lifetime.cleanup = { [selection] in selection.pause() }
    }
    private class Anchor: NSView { override func hitTest(_ point: NSPoint) -> NSView? { nil } }
}`,
  vue: {
    types: ['FileItem', 'FileSelectionState', 'FileSelectionOptions', 'FileSelectionController'],
    attribute(name, value) {
      if (name === 'selection') return `:selection="${value.ref}"`
    },
  },
}
