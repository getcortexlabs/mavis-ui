import { bounded, event, swiftCall } from './choices.mjs'
import { MImage } from './image.mjs'
import { MSheet } from './sheet.mjs'

const labels = [
  'closeLabel',
  'previousLabel',
  'nextLabel',
  'zoomInLabel',
  'zoomOutLabel',
  'resetLabel',
  'errorLabel',
]

export const MImageViewer = {
  props: {
    label: 'string',
    images: ({ value, ctx, expr, record, T }) => ({
      expr: expr(value, ctx, T.array(record('ViewerImage'))),
    }),
    value: 'optional-string',
    onChange: 'string-handler',
    open: 'boolean',
    onUpdateOpen: 'boolean-handler',
    disabled: 'boolean',
    maxZoom: bounded(
      'maxZoom',
      (value) => Number.isFinite(value) && value >= 1 && value <= 100,
      'must be between 1 and 100 on the Mac (the Jolt gesture scale range).',
    ),
    ...Object.fromEntries(labels.map((name) => [name, 'string'])),
    onClose: 'string-handler',
    onError: event(({ record }) => [record('ViewerImage')], 'ViewerImage'),
  },
  required: ['label', 'images'],
  control: true,
  uses: [MImage, MSheet],
  records: { ViewerImage: 'the Mavis viewer image type' },
  types: () =>
    'type ViewerImage = { key: string; src: string; thumbnail?: string; alt: string; caption?: string; aspectRatio?: number }',
  declaration: `declare function MImageViewer(props: { label: string; images: readonly ViewerImage[]; value?: string; onChange?: (key: string) => void; open?: boolean; onUpdateOpen?: (open: boolean) => void; disabled?: boolean; maxZoom?: number; ${labels.map((name) => `${name}?: string`).join('; ')}; onClose?: (reason: 'button' | 'escape' | 'gesture' | 'outside') => void; onError?: (image: ViewerImage) => void }): JSX.Element`,
  swift(node, { emit, indent }) {
    const props = node.props
    return swiftCall(
      'MavisImageViewer',
      [
        `label: ${emit.value(props.label)}`,
        `images: ${emit.wrap(props.images.expr)}.map { MavisViewerEntry(item: $0, key: $0.key, src: $0.src, thumbnail: $0.thumbnail, alt: $0.alt, caption: $0.caption, aspectRatio: $0.aspectRatio) }`,
        ...['value', 'open', 'disabled', 'maxZoom', ...labels].flatMap((name) =>
          props[name] ? [`${name}: ${emit.value(props[name])}`] : [],
        ),
        ...['onChange', 'onUpdateOpen', 'onClose', 'onError'].flatMap((name) =>
          props[name] ? [`${name}: ${emit.handler(props[name], indent + 4)}`] : [],
        ),
      ],
      indent,
    )
  },
  vue: {
    types: ['ViewerImage'],
    rename: { value: 'modelValue', onChange: 'update:modelValue', onUpdateOpen: 'update:open' },
  },
  swiftRuntime: ({ theme, font, metric }) => `struct MavisViewerEntry<Item>: Identifiable {
    let item: Item
    let key: String
    let src: String
    let thumbnail: String?
    let alt: String
    let caption: String?
    let aspectRatio: Double?
    var id: String { key }
}

struct MavisImageViewer<Item>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let images: [MavisViewerEntry<Item>]
    var value: String? = nil
    var open = false
    var disabled = false
    var maxZoom = 4.0
    var closeLabel = "Close viewer"
    var previousLabel = "Previous image"
    var nextLabel = "Next image"
    var zoomInLabel = "Zoom in"
    var zoomOutLabel = "Zoom out"
    var resetLabel = "Reset zoom"
    var errorLabel = "Image unavailable"
    var onChange: (String) -> Void = { _ in }
    var onUpdateOpen: (Bool) -> Void = { _ in }
    var onClose: (String) -> Void = { _ in }
    var onError: (Item) -> Void = { _ in }
    @Namespace private var photos

    private var index: Int { images.firstIndex { $0.key == value } ?? 0 }
    private var presented: Bool { open && !disabled && !images.isEmpty }

    private func move(_ delta: Int) {
        let next = index + delta
        guard !disabled, images.indices.contains(next) else { return }
        onChange(images[next].key)
    }
    private func close(_ reason: String) {
        guard presented else { return }
        onUpdateOpen(false)
        onClose(reason)
    }

    var body: some View {
        // Invalid input fails consistently before creating a gesture model or indexing images.
        let _ = precondition(maxZoom.isFinite && maxZoom >= 1 && maxZoom <= 100, "maxZoom must be between 1 and 100 on the Mac.")
        let _ = precondition(Set(images.map(\\.key)).count == images.count, "Viewer images require unique keys.")
        let _ = precondition(images.allSatisfy { !mavisTrim($0.src).isEmpty && !mavisTrim($0.alt).isEmpty && ($0.aspectRatio == nil || ($0.aspectRatio!.isFinite && $0.aspectRatio! > 0)) }, "Viewer images require src, alt and a positive aspectRatio.")
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 12)], spacing: 12) {
            ForEach(images) { image in
                Button(action: { onChange(image.key); onUpdateOpen(true) }) {
                    VStack(alignment: .leading, spacing: 0) {
                        MavisImage(src: image.thumbnail ?? image.src, alt: "", aspectRatio: image.aspectRatio ?? 1.5, radius: 0)
                            .joltSharedLayout(image.key, in: photos, isSource: !presented || image.key != images[index].key)
                        Text(verbatim: image.alt).font(${font('body')}).padding(12)
                    }
                    .background(MavisTokens.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(MavisTokens.border).allowsHitTesting(false))
                }
                .buttonStyle(.plain)
                .disabled(disabled)
                .accessibilityLabel(Text(verbatim: image.alt))
            }
        }
        .background {
            MavisSheet(open: presented, label: label, fullscreen: true, closeLabel: closeLabel, padding: 16, gap: 12,
                onClose: { reason in
                    if reason != "program" { close(reason == "backdrop" ? "outside" : reason == "swipe" ? "gesture" : reason) }
                }, content: {
                    if images.indices.contains(index) {
                        let image = images[index]
                        MavisViewerPhoto(image: image, index: index, count: images.count, maxZoom: maxZoom,
                            previousLabel: previousLabel, nextLabel: nextLabel, zoomInLabel: zoomInLabel,
                            zoomOutLabel: zoomOutLabel, resetLabel: resetLabel, errorLabel: errorLabel,
                            photos: photos, move: move, dismiss: { close("gesture") }, onError: { onError(image.item) })
                            .id(image.key + "|" + image.src + "|" + String(maxZoom))
                    }
                })
        }
        .joltLayout(value: presented)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}

private struct MavisViewerPhoto<Item>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let image: MavisViewerEntry<Item>
    let index: Int
    let count: Int
    let maxZoom: Double
    let previousLabel: String
    let nextLabel: String
    let zoomInLabel: String
    let zoomOutLabel: String
    let resetLabel: String
    let errorLabel: String
    let photos: Namespace.ID
    let move: (Int) -> Void
    let dismiss: () -> Void
    let onError: () -> Void
    @StateObject private var motion: JoltGestureModel
    @State private var picture: NSImage?
    @State private var failed = false
    @State private var viewport = CGSize.zero
    @State private var pan = CGSize.zero
    @State private var pinch = 1.0
    @State private var window = MavisWindowBox()
    @FocusState private var focused: Bool
    @Environment(\\.accessibilityReduceMotion) private var reduced
    @Environment(\\.scenePhase) private var phase

    init(image: MavisViewerEntry<Item>, index: Int, count: Int, maxZoom: Double,
        previousLabel: String, nextLabel: String, zoomInLabel: String, zoomOutLabel: String,
        resetLabel: String, errorLabel: String, photos: Namespace.ID, move: @escaping (Int) -> Void,
        dismiss: @escaping () -> Void, onError: @escaping () -> Void) {
        self.image = image; self.index = index; self.count = count; self.maxZoom = maxZoom
        self.previousLabel = previousLabel; self.nextLabel = nextLabel; self.zoomInLabel = zoomInLabel
        self.zoomOutLabel = zoomOutLabel; self.resetLabel = resetLabel; self.errorLabel = errorLabel
        self.photos = photos; self.move = move; self.dismiss = dismiss; self.onError = onError
        _motion = StateObject(wrappedValue: try! JoltGestureModel(bounds: JoltDragBounds(x: -100_000...100_000, y: -100_000...100_000), scale: 1...maxZoom))
    }
    private var still: Bool { reduced || !window.onScreen }
    private var ready: Bool { picture != nil }
    private var scale: Double { motion.position.scale }
    private func constrained(_ position: JoltGesturePosition) -> JoltGesturePosition {
        guard let picture, viewport.width > 0, viewport.height > 0 else { return position }
        let fit = Swift.min(viewport.width / picture.size.width, viewport.height / picture.size.height)
        let x = Swift.max(0, (picture.size.width * fit * position.scale - viewport.width) / 2)
        let y = Swift.max(0, (picture.size.height * fit * position.scale - viewport.height) / 2)
        return try! JoltGesturePosition(x: Swift.min(x, Swift.max(-x, position.x)), y: Swift.min(y, Swift.max(-y, position.y)), scale: position.scale)
    }
    private func settle(_ value: Double? = nil) {
        let current = motion.position
        let next = constrained(try! JoltGesturePosition(x: current.x, y: current.y, scale: Swift.max(1, Swift.min(maxZoom, value ?? current.scale))))
        try? motion.settle(to: next, reducedMotion: still)
    }
    private func reset() { try? motion.settle(to: JoltGesturePosition(), reducedMotion: still) }
    private var gestures: some Gesture {
        let drag = DragGesture(minimumDistance: 3).onChanged { event in
            guard ready, motion.begin(.pan) else { return }
            try? motion.change(pan: CGSize(width: event.translation.width - pan.width, height: event.translation.height - pan.height))
            pan = event.translation
        }.onEnded { event in
            motion.end(.pan); pan = .zero
            if scale <= 1.001 && abs(event.translation.height) > 100 && abs(event.translation.height) > abs(event.translation.width) { dismiss() }
            settle()
        }
        let zoom = MagnifyGesture().onChanged { event in
            guard ready, motion.begin(.pinch) else { return }
            let focal = CGPoint(x: (event.startAnchor.x - 0.5) * viewport.width, y: (event.startAnchor.y - 0.5) * viewport.height)
            try? motion.change(magnification: event.magnification / pinch, around: focal)
            pinch = event.magnification
        }.onEnded { _ in motion.end(.pinch); pinch = 1; settle() }
        return drag.simultaneously(with: zoom)
    }
    private func key(_ press: KeyPress) -> KeyPress.Result {
        guard press.modifiers.isDisjoint(with: [.command, .control, .option]) else { return .ignored }
        if scale <= 1.001 && (press.key == .leftArrow || press.key == .rightArrow) { move(press.key == .rightArrow ? 1 : -1); return .handled }
        return .ignored
    }
    var body: some View {
        VStack(spacing: 12) {
            Text(verbatim: "\\(index + 1) / \\(count) · " + image.alt).font(${font('body')})
            GeometryReader { geometry in
                ZStack {
                    if let picture {
                        Image(nsImage: picture).resizable().aspectRatio(contentMode: .fit)
                            .frame(width: geometry.size.width, height: geometry.size.height)
                            .scaleEffect(scale).offset(x: motion.position.x, y: motion.position.y)
                            .joltSharedLayout(image.key, in: photos)
                    } else if failed { Text(verbatim: errorLabel) } else { ProgressView() }
                }
                .frame(width: geometry.size.width, height: geometry.size.height)
                .contentShape(Rectangle()).clipped()
                .gesture(gestures)
                .onTapGesture(count: 2) { if ready { scale > 1.001 ? reset() : settle(Swift.min(2.5, maxZoom)) } }
                .focusable(interactions: .edit).focused($focused).onKeyPress(action: key)
                .onAppear { viewport = geometry.size }
                .onChange(of: geometry.size) { _, size in viewport = size; settle() }
            }
            .frame(minHeight: 160, maxHeight: .infinity)
            HStack(spacing: 8) {
                Button(previousLabel, action: { move(-1) }).disabled(index <= 0)
                Button(zoomOutLabel, action: { settle(scale - 0.5) }).disabled(!ready || scale <= 1.001)
                Button("\\(Int((scale * 100).rounded()))%", action: reset).accessibilityLabel(Text(verbatim: "\\(Int((scale * 100).rounded()))% · " + resetLabel)).disabled(!ready)
                Button(zoomInLabel, action: { settle(scale + 0.5) }).disabled(!ready || scale >= maxZoom)
                Button(nextLabel, action: { move(1) }).disabled(index >= count - 1)
            }.buttonStyle(MavisButtonStyle(variant: .secondary))
            if let caption = image.caption, !caption.isEmpty { Text(verbatim: caption).foregroundStyle(MavisTokens.muted).font(${font('body')}) }
        }
        .frame(maxHeight: .infinity)
        .background(MavisWindowReader(box: window))
        .task(id: image.src) {
            picture = nil; failed = false
            let loaded = await MavisPicture.load(image.src)
            guard !_Concurrency.Task.isCancelled else { return }
            picture = loaded; failed = loaded == nil
            if failed { onError() }
        }
        .onChange(of: phase) { _, next in
            if next == .active { motion.resume() } else { motion.suspend(); pan = .zero; pinch = 1 }
        }
        .onDisappear { motion.dispose() }
    }
}`,
}
