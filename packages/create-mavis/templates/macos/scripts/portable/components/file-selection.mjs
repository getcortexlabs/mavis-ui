// The public controller types stay intact in shared sources. Its platform resource is never
// lowered to a file path or to serializable metadata; only FileItem crosses that boundary.
export const fileSelectionTypes = `type FileItem = {
  readonly id: string; readonly name: string; readonly size?: number; readonly type?: string
  readonly status: 'selected' | 'uploading' | 'uploaded' | 'failed' | 'cancelled'
  readonly progress?: number; readonly error?: string
}
type FileSelectionFailure = { readonly code: 'picker' | 'type' | 'size' | 'count'; readonly message: string }
type FileSelectionState = { readonly items: readonly FileItem[]; readonly picking: boolean; readonly error?: FileSelectionFailure }
interface FileHandle { readonly __mavisFileHandle: never }
interface FileCancellation { readonly cancelled: boolean; onCancel(callback: () => void): () => void }
interface SelectedFile { readonly name: string; readonly size?: number; readonly type?: string; readonly handle: FileHandle; preview?(): Promise<unknown>; release(): void }
interface FileSelectionRequest { readonly multiple: boolean; readonly accept: readonly string[] }
interface FilePickerAdapter { pick(request: FileSelectionRequest, cancellation: FileCancellation): Promise<readonly SelectedFile[] | null> }
interface FileUploadContext { readonly item: FileItem; readonly handle: FileHandle; readonly cancellation: FileCancellation; progress(loaded: number, total?: number): void }
type FileUpload = (context: FileUploadContext) => Promise<void>
interface FileSelectionOptions { initial?: readonly FileItem[]; multiple?: boolean; accept?: readonly string[]; maxCount?: number; maxSize?: number; upload?: FileUpload }
interface FileSelectionController {
  readonly state: FileSelectionState; readonly canUpload: boolean
  subscribe(listener: (state: FileSelectionState) => void): () => void
  select(picker: FilePickerAdapter): Promise<void>; cancelSelection(): void
  hasFile(id: string): boolean; preview(id: string): unknown; discardPreview(id: string): void
  upload(id: string): Promise<void>; retry(id: string): Promise<void>; cancel(id: string): void
  remove(id: string): void; clear(): void; pause(): void; dispose(): void
}
declare function useFileSelection(options?: FileSelectionOptions): FileSelectionController
declare module '@getcortexlabs/mavis-core/vue' {
  export function useFileSelection(options?: FileSelectionOptions): FileSelectionController
}`

export const fileSelectionRuntime = {
  swiftRuntime: () => `import UniformTypeIdentifiers
import ImageIO

struct MavisFileDescriptor: Identifiable, Equatable {
    let id: String
    let name: String
    var size: Double? = nil
    var type: String? = nil
    var status = "selected"
    var progress: Double? = nil
    var error: String? = nil
}

struct MavisFileFailure: Equatable {
    let code: String
    let message: String
}

/// Platform-only identity. This never appears in FileItem or a persistence snapshot.
@MainActor final class MavisFileHandle {
    fileprivate let url: URL
    fileprivate init(_ url: URL) { self.url = url }
}

@MainActor final class MavisSelectedFile {
    let handle: MavisFileHandle
    let name: String
    let size: Double?
    let type: String?
    private let scoped: Bool
    private var released = false

    init(_ url: URL) throws {
        let scoped = url.startAccessingSecurityScopedResource()
        do {
            let metadata = try url.resourceValues(forKeys: [.isRegularFileKey, .fileSizeKey, .contentTypeKey])
            guard metadata.isRegularFile == true else { throw CocoaError(.fileReadUnsupportedScheme) }
            self.handle = MavisFileHandle(url)
            self.name = url.lastPathComponent
            self.size = metadata.fileSize.map(Double.init)
            self.type = metadata.contentType?.preferredMIMEType
            self.scoped = scoped
        } catch {
            if scoped { url.stopAccessingSecurityScopedResource() }
            throw error
        }
    }

    func release() {
        guard !released else { return }
        released = true
        if scoped { handle.url.stopAccessingSecurityScopedResource() }
    }

    func preview() -> NSImage? {
        guard !released, type?.hasPrefix("image/") == true,
              let source = CGImageSourceCreateWithURL(handle.url as CFURL, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceThumbnailMaxPixelSize: 160] as CFDictionary) else { return nil }
        return NSImage(cgImage: image, size: .zero)
    }
}

/// Owns file access for one component identity. Every picker/drop completion is checked against
/// its operation token, so cancellation, replacement and disposal cannot reintroduce resources.
@MainActor final class MavisFileSelection: ObservableObject {
    @Published private(set) var items: [MavisFileDescriptor]
    @Published private(set) var picking = false
    @Published private(set) var error: MavisFileFailure?
    @Published private var previews: [String: NSImage] = [:]
    let multiple: Bool
    let accept: [String]
    let maxCount: Double
    let maxSize: Double?
    var canUpload: Bool { false }
    private var disposed = false
    private var operation: UUID?
    private var panel: NSOpenPanel?
    private var resources: [String: MavisSelectedFile] = [:]
    private var ids: Set<String>
    private var nextId = 0

    init(initial: [MavisFileDescriptor] = [], multiple: Bool = false, accept: [String] = [], maxCount: Double? = nil, maxSize: Double? = nil) {
        let count = maxCount ?? (multiple ? 10 : 1)
        precondition(count.isFinite && count.rounded() == count && count >= 1, "File maxCount must be a positive integer")
        precondition(maxSize == nil || (maxSize!.isFinite && maxSize! >= 0), "File maxSize must be finite and nonnegative")
        precondition(accept.allSatisfy { $0.range(of: #"^(\\.[A-Za-z0-9_.-]+|[A-Za-z0-9_!#$&^.+-]+/(?:[A-Za-z0-9_!#$&^.+-]+|\\*))$"#, options: .regularExpression) != nil }, "File accept must contain extensions or MIME types")
        precondition(Double(initial.count) <= (multiple ? count : 1), "Initial files exceed the selection count")
        precondition(Set(initial.map(\\.id)).count == initial.count && initial.allSatisfy { !$0.id.isEmpty && !mavisTrim($0.name).isEmpty }, "File descriptors need unique IDs and readable names")
        precondition(initial.allSatisfy { $0.size == nil || ($0.size!.isFinite && $0.size! >= 0) }, "File size must be finite and nonnegative")
        precondition(initial.allSatisfy { ["selected", "uploading", "uploaded", "failed", "cancelled"].contains($0.status) }, "Invalid file status")
        precondition(initial.allSatisfy { $0.progress == nil || ($0.progress!.isFinite && $0.progress! >= 0 && $0.progress! <= 1) }, "File progress must be between zero and one")
        self.items = initial
        self.multiple = multiple
        self.accept = accept
        self.maxCount = count
        self.maxSize = maxSize
        self.ids = Set(initial.map(\\.id))
    }

    static func accepts(name: String, type: String?, hints: [String]) -> Bool {
        hints.isEmpty || hints.contains { hint in
            let hint = hint.lowercased()
            if hint.hasPrefix(".") { return name.lowercased().hasSuffix(hint) }
            if hint.hasSuffix("/*") { return type?.lowercased().hasPrefix(String(hint.dropLast())) == true }
            return type?.lowercased() == hint
        }
    }

    private var contentTypes: [UTType] {
        let types = accept.compactMap { hint -> UTType? in
            if hint.hasPrefix(".") { return UTType(filenameExtension: String(hint.dropFirst())) }
            switch hint.lowercased() {
            case "image/*": return .image
            case "audio/*": return .audio
            case "video/*": return .movie
            default: return UTType(mimeType: hint)
            }
        }
        // The controller still checks the complete accept list after the system chooser.
        return types.count == accept.count && !types.isEmpty ? types : [.item]
    }

    private func begin() -> UUID? {
        guard !disposed else { return nil }
        cancelSelection()
        let token = UUID()
        operation = token
        picking = true
        error = nil
        return token
    }

    func choose(in window: NSWindow?) {
        guard let token = begin() else { return }
        let chooser = NSOpenPanel()
        panel = chooser
        chooser.canChooseDirectories = false
        chooser.canChooseFiles = true
        chooser.allowsMultipleSelection = multiple
        chooser.allowedContentTypes = contentTypes
        let complete: (NSApplication.ModalResponse) -> Void = { [weak self, weak chooser] response in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.receive(response == .OK ? chooser?.urls ?? [] : [], token: token)
            }
        }
        if let window { chooser.beginSheetModal(for: window, completionHandler: complete) }
        else { chooser.begin(completionHandler: complete) }
    }

    func drop(_ providers: [NSItemProvider]) -> Bool {
        let providers = providers.filter { $0.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) }
        guard !providers.isEmpty, let token = begin() else { return false }
        Task { @MainActor [weak self] in
            var urls: [URL] = []
            for provider in providers {
                let url: URL? = await withCheckedContinuation { continuation in
                    provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier, options: nil) { item, _ in
                        let url = (item as? URL) ?? (item as? Data).flatMap { URL(dataRepresentation: $0, relativeTo: nil) }
                        continuation.resume(returning: url?.isFileURL == true ? url : nil)
                    }
                }
                guard let self, !self.disposed, self.operation == token else { return }
                guard let url else {
                    self.finish(token, failure: MavisFileFailure(code: "picker", message: "Unable to select files"))
                    return
                }
                urls.append(url)
            }
            self?.receive(urls, token: token)
        }
        return true
    }

    private func receive(_ urls: [URL], token: UUID) {
        guard !disposed, operation == token else { return }
        guard !urls.isEmpty else { finish(token); return }
        var files: [MavisSelectedFile] = []
        var retained = false
        defer { if !retained { files.forEach { $0.release() } } }
        do {
            for url in urls { files.append(try MavisSelectedFile(url)) }
        } catch {
            finish(token, failure: MavisFileFailure(code: "picker", message: error.localizedDescription))
            return
        }
        let count = multiple ? items.count + files.count : files.count
        var failure: MavisFileFailure?
        if Double(count) > (multiple ? maxCount : 1) {
            failure = MavisFileFailure(code: "count", message: "Choose at most \\(mavisString(multiple ? maxCount : 1)) files")
        } else if files.contains(where: { mavisTrim($0.name).isEmpty || !Self.accepts(name: $0.name, type: $0.type, hints: accept) }) {
            failure = MavisFileFailure(code: "type", message: "This file type is not accepted")
        } else if files.contains(where: { file in file.size.map { !$0.isFinite || $0 < 0 || (maxSize != nil && $0 > maxSize!) } ?? false }) {
            failure = MavisFileFailure(code: "size", message: "A file exceeds the size limit")
        }
        if let failure { finish(token, failure: failure); return }
        if !multiple { for item in items { forget(item.id) } }
        var additions: [MavisFileDescriptor] = []
        for file in files {
            var id: String
            repeat { nextId += 1; id = "file-\\(nextId)" } while ids.contains(id)
            ids.insert(id)
            resources[id] = file
            additions.append(MavisFileDescriptor(id: id, name: file.name, size: file.size, type: file.type))
            if let preview = file.preview() { previews[id] = preview }
        }
        retained = true
        items = multiple ? items + additions : additions
        finish(token)
    }

    private func finish(_ token: UUID, failure: MavisFileFailure? = nil) {
        guard !disposed, operation == token else { return }
        operation = nil
        panel = nil
        error = failure
        picking = false
    }

    func cancelSelection() {
        operation = nil
        let previous = panel
        panel = nil
        previous?.cancel(nil)
        if !disposed { picking = false }
    }
    func hasFile(_ id: String) -> Bool { resources[id] != nil }
    func preview(_ id: String) -> NSImage? { previews[id] }
    func discardPreview(_ id: String) { if !disposed { previews[id] = nil } }
    // An initial uploading descriptor has no local upload operation, as in the core controller.
    func cancel(_ id: String) {}
    private func forget(_ id: String) {
        resources.removeValue(forKey: id)?.release()
        previews[id] = nil
    }
    func remove(_ id: String) {
        guard !disposed else { return }
        forget(id)
        items.removeAll { $0.id == id }
        error = nil
    }
    func clear() {
        guard !disposed else { return }
        cancelSelection()
        for id in Array(resources.keys) { forget(id) }
        items = []
        error = nil
    }
    func pause() { cancelSelection() }
    func dispose() {
        guard !disposed else { return }
        disposed = true
        cancelSelection()
        resources.values.forEach { $0.release() }
        resources = [:]
        previews = [:]
    }
}`,
}
