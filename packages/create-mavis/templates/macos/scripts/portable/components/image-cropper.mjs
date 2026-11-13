// MImageCropper: a crop of one aspect ratio over a picture, moved, zoomed and turned by quarter
// turns. The crop math is the Mavis core's (image-crop.ts), ported call for call.
import { source } from './assets.mjs'
import { event as valueEvent } from './choices.mjs'
import { flexRuntime } from './flex.mjs'
import { pictureRuntime } from './image.mjs'
import { flexItem } from './shared.mjs'

const labels = [
  'zoomLabel',
  'rotateLabel',
  'resetLabel',
  'exportLabel',
  'loadingLabel',
  'moveLabel',
  'leftLabel',
  'rightLabel',
  'upLabel',
  'downLabel',
]
const records = {
  ImageCrop: ['x', 'y', 'width', 'height', 'rotation'],
  CropExport: ['uri', 'width', 'height', 'mimeType'],
  CropImage: ['width', 'height'],
  MavisCropFailure: ['stage', 'message'],
}

const crop = ({ value, ctx, expr, record, T }) => ({
  expr: expr(value, ctx, T.optional(record('ImageCrop'))),
})
const output = ({ value, ctx, expr, record }) => ({
  expr: expr(value, ctx, record('CropExportOptions')),
})
const event = (name) => valueEvent(({ record }) => [record(name)], name)

// The crop's width over its height, in the range the core accepts.
function ratio({ attribute, value, ctx, expr, fail, T }) {
  const number = expr(value, ctx, T.number)
  if (number.e === 'lit' && !(number.value >= 0.1 && number.value <= 10))
    fail(attribute, 'aspectRatio is between 0.1 and 10.')
  return { expr: number }
}

// A handler of the source takes one of the project's records; the Mac's cropper hands plain
// values, so the call builds the record from them.
const listener = (name, prop, values, { emit, indent }) =>
  `{ ${values.join(', ')} in\n${' '.repeat(indent + 4)}(${emit.handler(prop, indent + 4)})(${name}(${records[
    name
  ]
    .map(
      (field, index) =>
        `${field}: ${values.length === 1 ? `${values[0]}.${field}` : values[index]}`,
    )
    .join(', ')}))\n${' '.repeat(indent)}}`

// imageCropperProps. value and onChange are the contract's modelValue. The exported picture
// reaches onExport as its data; its dispose() is a promise, which a shared source cannot call
// on the Mac yet (#340), and the Mac's export is a data: URI that needs none.
export const MImageCropper = {
  props: {
    id: 'string',
    label: 'string',
    src: source,
    value: crop,
    onChange: event('ImageCrop'),
    aspectRatio: ratio,
    animated: 'boolean',
    disabled: 'boolean',
    output,
    ...Object.fromEntries(labels.map((name) => [name, 'string'])),
    onExport: event('CropExport'),
    onLoad: event('CropImage'),
    onError: event('MavisCropFailure'),
  },
  required: ['label', 'src', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, pictureRuntime],
  types: () => `/** A crop in the pixels of the picture after its quarter turns. */
type ImageCrop = { x: number; y: number; width: number; height: number; rotation: 0 | 90 | 180 | 270 }
type CropImage = { width: number; height: number }
type CropExportOptions = { mimeType: 'image/png' | 'image/jpeg'; quality: number; width?: number }
/** What MImageCropper exports, as its data. */
type CropExport = { uri: string; width: number; height: number; mimeType: 'image/png' | 'image/jpeg' }
type MavisCropFailure = { stage: 'load' | 'export'; message: string }`,
  records: {
    ImageCrop: "the Mavis cropper's crop",
    CropImage: "the size of the Mavis cropper's picture",
    CropExportOptions: "the Mavis cropper's export options",
    CropExport: "the Mavis cropper's exported picture",
    MavisCropFailure: "the Mavis cropper's failure",
  },
  declaration: `declare function MImageCropper(props: { id?: string; label: string; src: string; value: ImageCrop | undefined | null; onChange: (crop: ImageCrop) => void; aspectRatio?: number; animated?: boolean; disabled?: boolean; output?: CropExportOptions; ${labels.map((name) => `${name}?: string`).join('; ')}; onExport?: (picture: CropExport) => void; onLoad?: (picture: CropImage) => void; onError?: (failure: MavisCropFailure) => void }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const inner = { emit, indent: indent + 4 }
    const args = [
      `label: ${emit.value(props.label)}`,
      `src: ${emit.value(props.src)}`,
      `value: mavisCrop(${emit.expr(props.value.expr)}) { MavisCrop(x: $0.x, y: $0.y, width: $0.width, height: $0.height, rotation: $0.rotation) }`,
      `onChange: ${listener('ImageCrop', props.onChange, ['next'], inner)}`,
      ...['aspectRatio', 'animated', 'disabled']
        .filter((name) => props[name])
        .map((name) => `${name}: ${emit.value(props[name])}`),
      ...(props.output
        ? [
            `output: mavisCropOutput(${emit.expr(props.output.expr)}) { MavisCropOutput(mimeType: $0.mimeType, quality: $0.quality, width: $0.width) }`,
          ]
        : []),
      ...labels.filter((name) => props[name]).map((name) => `${name}: ${emit.value(props[name])}`),
      ...(props.onExport
        ? [`onExport: ${listener('CropExport', props.onExport, ['picture'], inner)}`]
        : []),
      ...(props.onLoad
        ? [`onLoad: ${listener('CropImage', props.onLoad, ['width', 'height'], inner)}`]
        : []),
      ...(props.onError
        ? [`onError: ${listener('MavisCropFailure', props.onError, ['stage', 'message'], inner)}`]
        : []),
    ]
    return [
      `${pad}MavisImageCropper(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
      ...flexItem({ width: { lit: '100%' } }, context),
    ].join('\n')
  },
  swiftRuntime({ theme, font }) {
    const settle = theme.motion.enterDuration * 1.5
    return `/// ImageCrop of the Mavis core, apart from the record type of each project.
struct MavisCrop: Equatable {
    var x: Double
    var y: Double
    var width: Double
    var height: Double
    var rotation: Double
    var values: [Double] { [x, y, width, height, rotation] }
}

struct MavisCropOutput: Equatable {
    var mimeType: String = "image/png"
    var quality: Double = 0.92
    var width: Double? = nil
}

struct MavisCropPicture {
    let uri: String
    let width: Double
    let height: Double
    let mimeType: String
}

func mavisCrop<T>(_ value: T?, _ convert: (T) -> MavisCrop) -> MavisCrop? { value.map(convert) }
func mavisCropOutput<T>(_ value: T, _ convert: (T) -> MavisCropOutput) -> MavisCropOutput { convert(value) }

/// image-crop.ts of the Mavis core, call for call. Where the core throws a RangeError these
/// answer nil, and the cropper falls back to the crop that fits.
enum MavisCropMath {
    static func rotated(_ image: CGSize, _ rotation: Double) -> CGSize? {
        guard [0, 90, 180, 270].contains(rotation), image.width.isFinite, image.height.isFinite, image.width > 0, image.height > 0 else { return nil }
        return rotation == 90 || rotation == 270 ? CGSize(width: image.height, height: image.width) : image
    }

    static func fit(_ image: CGSize, _ aspectRatio: Double, _ rotation: Double = 0) -> MavisCrop? {
        guard let size = rotated(image, rotation), aspectRatio.isFinite, aspectRatio >= 0.1, aspectRatio <= 10 else { return nil }
        let width = Swift.min(size.width, size.height * aspectRatio)
        let height = width / aspectRatio
        return MavisCrop(x: (size.width - width) / 2, y: (size.height - height) / 2, width: width, height: height, rotation: rotation)
    }

    static func valid(_ image: CGSize, _ crop: MavisCrop, _ aspectRatio: Double? = nil) -> Bool {
        guard let size = rotated(image, crop.rotation) else { return false }
        return [crop.x, crop.y, crop.width, crop.height].allSatisfy(\\.isFinite)
            && crop.x >= 0 && crop.y >= 0 && crop.width >= 1 && crop.height >= 1
            && crop.x + crop.width <= size.width + 0.001 && crop.y + crop.height <= size.height + 0.001
            && (aspectRatio.map { abs(crop.width / crop.height - $0) <= 0.001 } ?? true)
    }

    static func move(_ image: CGSize, _ crop: MavisCrop, _ dx: Double, _ dy: Double) -> MavisCrop? {
        guard valid(image, crop), dx.isFinite, dy.isFinite, let size = rotated(image, crop.rotation) else { return nil }
        var next = crop
        next.x = Swift.max(0, Swift.min(size.width - crop.width, crop.x + dx))
        next.y = Swift.max(0, Swift.min(size.height - crop.height, crop.y + dy))
        return next
    }

    static func zoom(_ image: CGSize, _ crop: MavisCrop, _ zoom: Double) -> MavisCrop? {
        guard valid(image, crop), zoom.isFinite, zoom >= 1, zoom <= 8, let fit = fit(image, crop.width / crop.height, crop.rotation) else { return nil }
        let by = Swift.min(zoom, fit.width, fit.height)
        let width = fit.width / by
        let height = fit.height / by
        return move(image, MavisCrop(x: 0, y: 0, width: width, height: height, rotation: crop.rotation), crop.x + crop.width / 2 - width / 2, crop.y + crop.height / 2 - height / 2)
    }

    /// The whole picture's size and place in a viewport that shows the crop: [width, height, x, y, rotation].
    static func presentation(_ image: CGSize, _ crop: MavisCrop, _ viewportWidth: Double) -> [Double]? {
        guard valid(image, crop), let size = rotated(image, crop.rotation) else { return nil }
        let scale = viewportWidth / crop.width
        return [image.width * scale, image.height * scale, (size.width / 2 - crop.x - image.width / 2) * scale, (size.height / 2 - crop.y - image.height / 2) * scale, crop.rotation]
    }

    static func outputSize(_ crop: MavisCrop, _ output: MavisCropOutput) -> CGSize? {
        guard ["image/png", "image/jpeg"].contains(output.mimeType), output.quality.isFinite, output.quality >= 0, output.quality <= 1 else { return nil }
        let width = output.width ?? mavisRound(crop.width)
        let height = mavisRound(width * crop.height / crop.width)
        guard width == width.rounded(), width >= 1, width <= 4096, height >= 1, height <= 4096 else { return nil }
        return CGSize(width: width, height: height)
    }

    /// The crop as a picture: the part of the source the crop covers after its quarter turns.
    static func export(_ source: CGImage, _ crop: MavisCrop, _ output: MavisCropOutput) -> MavisCropPicture? {
        let image = CGSize(width: source.width, height: source.height)
        guard valid(image, crop), let size = outputSize(crop, output), let rotated = rotated(image, crop.rotation),
              let context = CGContext(data: nil, width: Int(size.width), height: Int(size.height), bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
        else { return nil }
        let scale = size.width / crop.width
        context.interpolationQuality = .high
        // The context draws upwards; the crop is measured from the top.
        context.translateBy(x: 0, y: size.height)
        context.scaleBy(x: scale, y: -scale)
        context.translateBy(x: -crop.x + rotated.width / 2, y: -crop.y + rotated.height / 2)
        context.rotate(by: crop.rotation * .pi / 180)
        context.translateBy(x: -image.width / 2, y: image.height / 2)
        context.scaleBy(x: 1, y: -1)
        context.draw(source, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        guard let drawn = context.makeImage() else { return nil }
        let png = output.mimeType == "image/png"
        let data = NSBitmapImageRep(cgImage: drawn).representation(using: png ? .png : .jpeg, properties: png ? [:] : [.compressionFactor: output.quality])
        guard let data else { return nil }
        return MavisCropPicture(uri: "data:" + output.mimeType + ";base64," + data.base64EncodedString(), width: size.width, height: size.height, mimeType: output.mimeType)
    }
}

/// MImageCropper: the picture behind a viewport of the crop's shape. A drag moves the crop and a
/// pinch zooms it while they last, and the crop they end on is asked of the source; the slider,
/// the buttons and the arrow keys ask for theirs at once. Jolt settles a crop that changes.
struct MavisImageCropper: View {
    let label: String
    let src: String
    let value: MavisCrop?
    let onChange: (MavisCrop) -> Void
    var aspectRatio: Double = 1
    var animated: Bool = true
    var disabled: Bool = false
    var output = MavisCropOutput()
    var zoomLabel: String = "Zoom"
    var rotateLabel: String = "Rotate clockwise"
    var resetLabel: String = "Reset"
    var exportLabel: String = "Export image"
    var loadingLabel: String = "Loading image"
    var moveLabel: String = "Move image"
    var leftLabel: String = "Move left"
    var rightLabel: String = "Move right"
    var upLabel: String = "Move up"
    var downLabel: String = "Move down"
    var onExport: ((MavisCropPicture) -> Void)? = nil
    var onLoad: ((Double, Double) -> Void)? = nil
    var onError: ((String, String) -> Void)? = nil
    @State private var source: CGImage?
    @State private var failure = ""
    @State private var draft: MavisCrop?
    @State private var base: MavisCrop?
    @FocusState private var focused: Bool

    /// componentMotion(theme, "selection") of the Mavis core.
    private static let settle = (try? JoltTransition.spring(milliseconds: ${settle}, bounce: 0)) ?? .spring(.smooth)
    private static let direct = (try? JoltTransition.tween(milliseconds: 0)) ?? .spring(.snappy)

    private var image: CGSize? { source.map { CGSize(width: $0.width, height: $0.height) } }
    private var still: Bool { disabled || source == nil }

    private var effective: MavisCrop? {
        guard let image, let fitted = MavisCropMath.fit(image, aspectRatio) else { return nil }
        let wanted = draft ?? value ?? fitted
        return MavisCropMath.valid(image, wanted, aspectRatio) ? wanted : fitted
    }

    private var zoom: Double {
        guard let image, let crop = effective, let fitted = MavisCropMath.fit(image, aspectRatio, crop.rotation) else { return 1 }
        return fitted.width / crop.width
    }

    private func choose(_ next: MavisCrop?) {
        guard !disabled, let image, let next, MavisCropMath.valid(image, next, aspectRatio) else { return }
        onChange(next)
    }

    private func pan(_ x: Double, _ y: Double) {
        guard let image, let crop = effective else { return }
        choose(MavisCropMath.move(image, crop, x * crop.width / 20, y * crop.height / 20))
    }

    // A gesture reads the crop it began on: its translation and scale are whole, not steps.
    private func gesture(_ translation: CGSize, _ scale: Double, _ width: Double) {
        guard !still, width > 0, let image else { return }
        if base == nil { base = effective }
        guard let base, let fitted = MavisCropMath.fit(image, aspectRatio, base.rotation),
              let zoomed = MavisCropMath.zoom(image, base, Swift.min(8, Swift.max(1, fitted.width / base.width * scale)))
        else { return }
        draft = MavisCropMath.move(image, zoomed, -translation.width * base.width / width, -translation.height * base.width / width)
    }

    private func finish(_ keep: Bool) {
        let ended = draft
        base = nil
        draft = nil
        if keep { choose(ended) }
    }

    private func key(_ press: KeyPress) -> KeyPress.Result {
        if press.key == .escape {
            finish(false)
            return .handled
        }
        guard !still else { return .ignored }
        switch press.key {
        case .leftArrow: pan(1, 0)
        case .rightArrow: pan(-1, 0)
        case .upArrow: pan(0, 1)
        case .downArrow: pan(0, -1)
        default: return .ignored
        }
        return .handled
    }

    private func save() {
        guard !still, let source, let crop = effective else { return }
        failure = ""
        if let picture = MavisCropMath.export(source, crop, output) {
            onExport?(picture)
        } else {
            fail("export", "Crop output dimensions must be between 1 and 4096 pixels.")
        }
    }

    private func fail(_ stage: String, _ message: String) {
        failure = message
        onError?(stage, message)
    }

    private func load() async {
        source = nil
        draft = nil
        base = nil
        failure = ""
        guard !mavisTrim(src).isEmpty else { return }
        let loaded = await MavisPicture.load(src)?.cgImage(forProposedRect: nil, context: nil, hints: nil)
        // A source that changed meanwhile has its own load.
        guard !Task.isCancelled else { return }
        guard let loaded else { return fail("load", "Image could not be loaded.") }
        guard loaded.width * loaded.height <= 40_000_000 else { return fail("load", "ImageCropper supports decoded images up to 40 megapixels.") }
        source = loaded
        onLoad?(Double(loaded.width), Double(loaded.height))
    }

    @ViewBuilder private func viewport(_ width: Double) -> some View {
        if let source, let image, let crop = effective, let shown = MavisCropMath.presentation(image, crop, width),
           let pose = try? JoltPose(x: shown[2], y: shown[3], rotate: shown[4]) {
            Image(decorative: source, scale: 1)
                .resizable()
                .frame(width: shown[0], height: shown[1])
                .joltMotion(to: pose, transition: animated && draft == nil ? Self.settle : Self.direct)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .allowsHitTesting(false)
            // The frame of the crop and its thirds.
            HStack(spacing: 0) {
                Color.clear
                Rectangle().fill(.white.opacity(0.31)).frame(width: 1)
                Color.clear
                Rectangle().fill(.white.opacity(0.31)).frame(width: 1)
                Color.clear
            }
            .overlay(Rectangle().strokeBorder(.white, lineWidth: 1))
            .allowsHitTesting(false)
            .accessibilityHidden(true)
        } else {
            Text(verbatim: failure.isEmpty ? loadingLabel : failure)
                .font(${font('body')})
                .foregroundStyle(MavisTokens.muted)
                .padding(${theme.space.md})
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    private func action(_ text: String, _ variant: MavisButtonVariant, _ size: MavisButtonSize = .md, _ run: @escaping () -> Void) -> some View {
        Button(action: run) { Text(verbatim: text) }
            .buttonStyle(MavisButtonStyle(variant: variant, size: size))
            .disabled(still)
    }

    var body: some View {
        MavisColumn(spacing: ${theme.space.md}) {
            Text(verbatim: label)
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
            Color(red: 0x20 / 255.0, green: 0x23 / 255.0, blue: 0x2A / 255.0)
                .aspectRatio(aspectRatio >= 0.1 && aspectRatio <= 10 ? aspectRatio : 1, contentMode: .fit)
                .overlay {
                    GeometryReader { proxy in
                        ZStack(alignment: .topLeading) { viewport(proxy.size.width) }
                            .frame(width: proxy.size.width, height: proxy.size.height, alignment: .topLeading)
                            .contentShape(Rectangle())
                            .gesture(DragGesture(minimumDistance: 1)
                                .onChanged { gesture($0.translation, 1, proxy.size.width) }
                                .onEnded { _ in finish(true) })
                            .gesture(MagnifyGesture()
                                .onChanged { gesture(.zero, $0.magnification, proxy.size.width) }
                                .onEnded { _ in finish(true) })
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: ${theme.radius.lg}))
                .focusable(!still, interactions: .edit)
                .focused($focused)
                .onKeyPress(action: key)
                .accessibilityElement(children: .contain)
                .accessibilityLabel(Text(verbatim: moveLabel))
            if !failure.isEmpty, source != nil {
                Text(verbatim: failure)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.text)
            }
            MavisSlider(label: zoomLabel, value: zoom, onChange: { next in
                guard let image, let crop = effective else { return }
                choose(MavisCropMath.zoom(image, crop, Swift.min(8, Swift.max(1, next))))
            }, minimum: 1, maximum: 8, step: 0.1, disabled: still)
            MavisRow(spacing: ${theme.space.xs}, wrap: true) {
                action(leftLabel, .ghost, .sm) { pan(-1, 0) }.fixedSize()
                action(rightLabel, .ghost, .sm) { pan(1, 0) }.fixedSize()
                action(upLabel, .ghost, .sm) { pan(0, -1) }.fixedSize()
                action(downLabel, .ghost, .sm) { pan(0, 1) }.fixedSize()
            }
            MavisStack(axis: .vertical, spacing: ${theme.space.sm}, breakpoints: [MavisBreakpoint(at: 520, axis: .horizontal)]) {
                action(rotateLabel, .secondary) {
                    guard let image, let crop = effective else { return }
                    choose(MavisCropMath.fit(image, aspectRatio, (crop.rotation + 90).truncatingRemainder(dividingBy: 360)))
                }
                action(resetLabel, .ghost) {
                    guard let image else { return }
                    choose(MavisCropMath.fit(image, aspectRatio))
                }
                action(exportLabel, .primary, .md, save)
            }
        }
        .mavisColorScheme()
        .task(id: src) { await load() }
        .onChange(of: disabled) { _, _ in finish(false) }
        .onChange(of: value) { _, _ in finish(false) }
        .onChange(of: aspectRatio) { _, _ in finish(false) }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`
  },
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['ImageCrop', 'CropImage', 'CropExportOptions', 'CropExport'],
  },
}
