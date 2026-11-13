// MImage and MAvatar: pictures from the files the app carries, data: URIs and the network.
import { swiftNumber } from '../swift-text.mjs'
import { bundleRuntime, source } from './assets.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'
import { accessibility, flexItem, flexProps, radius, union, viewProps } from './shared.mjs'
import { motionSurfaceReference, motionSurfaceRuntime } from './motion-surface.mjs'

const fits = ['cover', 'contain']
const hints = {
  loading: ['eager', 'lazy'],
  decoding: ['async', 'sync', 'auto'],
  fetchpriority: ['high', 'low', 'auto'],
}

// The box is this many times as wide as it is tall.
function ratio({ attribute, value, ctx, expr, fail, T }) {
  const number = expr(value, ctx, T.number)
  if (number.e === 'lit' && !(number.value > 0 && Number.isFinite(number.value)))
    fail(attribute, 'aspectRatio is a positive number, the width over the height.')
  return { expr: number }
}

const optional = (props, names, write) =>
  names.filter((name) => props[name]).map((name) => write(name, props[name]))

/** Swift helpers that load a picture, shared by the components that show one. */
export const pictureRuntime = {
  swiftRuntime:
    () => `/// Where a picture comes from: a file of shared/assets the app carries (~/assets/name.png), a
/// data: URI, or an http(s) URL. Nil when it cannot be read as an image.
enum MavisPicture {
    static func load(_ source: String) async -> NSImage? {
        let source = mavisTrim(source)
        if source.hasPrefix("~/assets/") {
            let name = String(source.dropFirst(9))
            guard let file = MavisBundle.url("Assets/" + name, name) else { return nil }
            return valid(NSImage(contentsOf: file))
        }
        if source.lowercased().hasPrefix("data:") {
            guard let comma = source.firstIndex(of: ",") else { return nil }
            let header = source[..<comma].lowercased()
            let body = String(source[source.index(after: comma)...])
            let data = header.hasSuffix(";base64")
                ? Data(base64Encoded: body, options: .ignoreUnknownCharacters)
                : body.removingPercentEncoding?.data(using: .utf8)
            return valid(data.flatMap(NSImage.init(data:)))
        }
        guard let url = URL(string: source), ["http", "https"].contains(url.scheme?.lowercased() ?? "") else { return nil }
        guard let (data, response) = try? await URLSession.shared.data(from: url) else { return nil }
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) { return nil }
        return valid(NSImage(data: data))
    }

    private static func valid(_ image: NSImage?) -> NSImage? {
        guard let image, image.isValid, image.size.width > 0, image.size.height > 0 else { return nil }
        return image
    }
}`,
}

// imageProps. srcset, sizes, loading, decoding and fetchpriority are hints for the Web's <img>;
// the Mac loads src when the picture appears.
export const MImage = {
  props: {
    id: 'string',
    accessibilityHidden: 'boolean',
    ...flexProps,
    width: 'dimension',
    height: 'dimension',
    radius: 'radius',
    backgroundColor: 'color',
    src: source,
    alt: 'string',
    aspectRatio: ratio,
    fit: 'string',
    loadingLabel: 'string',
    errorLabel: 'string',
    srcset: 'string',
    sizes: 'string',
    loading: 'string',
    decoding: 'string',
    fetchpriority: 'string',
    onLoad: 'string-handler',
    onError: 'string-handler',
    motionSurface: motionSurfaceReference,
  },
  required: ['src', 'alt'],
  uses: [flexRuntime, bundleRuntime, pictureRuntime, motionSurfaceRuntime],
  declaration: `declare function MImage(props: MavisFlexItem & { id?: string; accessibilityHidden?: boolean; width?: MavisDimension; height?: MavisDimension; radius?: MavisRadius; backgroundColor?: string; src: string; alt: string; aspectRatio?: number; fit?: ${union(fits)}; loadingLabel?: string; errorLabel?: string; srcset?: string; sizes?: string; loading?: ${union(hints.loading)}; decoding?: ${union(hints.decoding)}; fetchpriority?: ${union(hints.fetchpriority)}; onLoad?: (src: string) => void; onError?: (src: string) => void; motionSurface?: unknown }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      `src: ${emit.value(props.src)}`,
      `alt: ${emit.value(props.alt)}`,
      // A height of its own replaces the one the ratio gives.
      ...(props.height
        ? ['aspectRatio: nil']
        : optional(props, ['aspectRatio'], (name, prop) => `${name}: ${emit.expr(prop.expr)}`)),
      ...optional(props, ['fit'], (name, prop) =>
        'lit' in prop ? `fit: .${prop.lit}` : `fit: MavisImageFit(${emit.expr(prop.expr)})`,
      ),
      ...optional(props, ['radius'], (name, prop) => `radius: ${radius(prop, context)}`),
      ...optional(
        props,
        ['backgroundColor'],
        (name, prop) => `background: mavisColor(${emit.value(prop)})`,
      ),
      ...optional(
        props,
        ['loadingLabel', 'errorLabel'],
        (name, prop) => `${name}: ${emit.value(prop)}`,
      ),
      ...(props.motionSurface ? [`motionSurface: self.${props.motionSurface.ref}`] : []),
      ...optional(
        props,
        ['onLoad', 'onError'],
        (name, prop) => `${name}: ${emit.handler(prop, indent + 4)}`,
      ),
    ]
    const fills = !props.width || props.width.lit === 'auto'
    return [
      `${pad}MavisImage(${args.join(', ')})`,
      ...(props.accessibilityHidden
        ? [`${pad}    .accessibilityHidden(${emit.value(props.accessibilityHidden)})`]
        : []),
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
      // As wide as its container unless width says otherwise, like the Web's 100%.
      ...flexItem({ ...props, width: fills ? { lit: '100%' } : props.width }, context),
    ].join('\n')
  },
  vue: {
    attribute: (name, value) =>
      name === 'motionSurface' ? `:motionSurface="${value.ref}"` : undefined,
  },
  swiftRuntime: ({ theme, font }) => `enum MavisImageFit: String {
    case cover, contain
    init(_ name: String) { self = MavisImageFit(rawValue: name) ?? .cover }
}

/// MImage: a box as wide as it is offered and as tall as aspectRatio makes it, which holds
/// its place while the picture loads and when it fails. A newer src replaces one still loading.
struct MavisImage: View {
    let src: String
    let alt: String
    var aspectRatio: Double? = ${swiftNumber(4 / 3)}
    var fit: MavisImageFit = .cover
    var radius: Double = ${theme.radius.md}
    var background: Color? = nil
    var loadingLabel: String = "Loading image"
    var errorLabel: String = "Image unavailable"
    var motionSurface: MavisMotionSurface? = nil
    var onLoad: ((String) -> Void)? = nil
    var onError: ((String) -> Void)? = nil
    @State private var picture: NSImage? = nil
    @State private var failed = false

    private var status: String { failed ? errorLabel : loadingLabel }

    @ViewBuilder private var box: some View {
        if let aspectRatio, aspectRatio > 0, aspectRatio.isFinite {
            Color.clear.aspectRatio(aspectRatio, contentMode: .fit)
        } else {
            Color.clear
        }
    }

    var body: some View {
        box
            .overlay {
                if picture == nil {
                    Text(verbatim: status)
                        .font(${font('caption')})
                        .foregroundStyle(MavisTokens.muted)
                        .multilineTextAlignment(.center)
                        .padding(16)
                }
            }
            .overlay {
                if let motionSurface {
                    if let picture {
                        Image(nsImage: picture)
                            .resizable()
                            .aspectRatio(contentMode: fit == .cover ? .fill : .fit)
                            .mavisMotionSurface(motionSurface)
                            .id(src)
                    }
                } else {
                    JoltPresence(picture != nil, enter: JoltPreset.fadeIn.recipe()) {
                        if let picture {
                            Image(nsImage: picture)
                                .resizable()
                                .aspectRatio(contentMode: fit == .cover ? .fill : .fit)
                        }
                    }
                }
            }
            .background(background.map(AnyShapeStyle.init) ?? AnyShapeStyle(MavisTokens.elevated))
            .clipShape(RoundedRectangle(cornerRadius: max(0, radius)))
            .contentShape(Rectangle())
            .task(id: src) { await load() }
            .accessibilityElement()
            .accessibilityLabel(Text(verbatim: picture == nil ? alt + ": " + status : alt))
            .accessibilityAddTraits(.isImage)
            .accessibilityHidden(alt.isEmpty)
    }

    private func load() async {
        let source = src
        picture = nil
        failed = false
        // No source shows the fallback without asking for anything.
        guard !mavisTrim(source).isEmpty else {
            failed = true
            return
        }
        let loaded = await MavisPicture.load(source)
        // A source that changed meanwhile has its own load: this result is obsolete.
        guard !Task.isCancelled else { return }
        picture = loaded
        failed = loaded == nil
        if loaded == nil { onError?(source) } else { onLoad?(source) }
    }
}`,
}

// avatarSizes of the Mavis core.
const avatarSizes = { sm: 32, md: 48, lg: 64, xl: 96 }
const shapes = ['circle', 'square']

// avatarProps: a picture of someone, or their initials, or a figure when there is no name.
export const MAvatar = {
  props: { ...viewProps, src: source, name: 'string', size: 'string', shape: 'string' },
  uses: [flexRuntime, bundleRuntime, pictureRuntime],
  declaration: `declare function MAvatar(props: MavisView & { src?: string; name?: string; size?: ${union(Object.keys(avatarSizes))}; shape?: ${union(shapes)} }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const args = [
      ...optional(props, ['src', 'name'], (name, prop) => `${name}: ${emit.value(prop)}`),
      ...optional(props, ['size'], (name, prop) =>
        'lit' in prop ? `size: .${prop.lit}` : `size: MavisAvatarSize(${emit.expr(prop.expr)})`,
      ),
      ...optional(props, ['shape'], (name, prop) =>
        'lit' in prop
          ? `square: ${prop.lit === 'square'}`
          : `square: ${emit.expr(prop.expr)} == "square"`,
      ),
      ...optional(props, ['accessibilityLabel'], (name, prop) => `label: ${emit.value(prop)}`),
    ]
    return [
      `${pad}MavisAvatar(${args.join(', ')})`,
      ...accessibility({ accessibilityHidden: props.accessibilityHidden }, context),
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
      // It keeps its size and sits at the start of its column, like the Web's.
      `${pad}    .mavisItem(shrink: 0, align: .start)`,
    ].join('\n')
  },
  swiftRuntime:
    () => `/// avatarInitials of the Mavis core: the first letter of the first word and of the last, in
/// capitals. Words are split at JavaScript's white space and a letter is one code point.
func mavisInitials(_ name: String) -> String {
    func space(_ scalar: Unicode.Scalar) -> Bool {
        switch scalar.value {
        case 0x9, 0xA, 0xB, 0xC, 0xD, 0x20, 0xA0, 0x1680, 0x2000...0x200A, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF:
            return true
        default:
            return false
        }
    }
    let words = name.precomposedStringWithCanonicalMapping.unicodeScalars.split(whereSeparator: space)
    guard let first = words.first?.first else { return "" }
    var letters = String.UnicodeScalarView([first])
    if words.count > 1, let last = words.last?.first { letters.append(last) }
    return String(letters).uppercased()
}

/// MAvatar size: avatarSizes of the Mavis core.
enum MavisAvatarSize: String {
    case ${Object.keys(avatarSizes).join(', ')}
    init(_ name: String) { self = MavisAvatarSize(rawValue: name) ?? .md }
    var points: Double {
        switch self {
${Object.entries(avatarSizes)
  .map(([name, points]) => `        case .${name}: return ${points}`)
  .join('\n')}
        }
    }
}

/// MAvatar: the picture when src loads, over the initials of name, or a figure without a name.
struct MavisAvatar: View {
    var src: String = ""
    var name: String = ""
    var size: MavisAvatarSize = .md
    var square: Bool = false
    var label: String? = nil
    @State private var picture: NSImage? = nil

    private var spoken: String { label ?? mavisTrim(name) }

    var body: some View {
        let side = size.points
        let initials = mavisInitials(name)
        ZStack {
            if picture != nil {
                EmptyView()
            } else if initials.isEmpty {
                MavisIcon(glyph: ${swiftGlyph('user-round')}, size: mavisRound(side * 0.46))
            } else {
                Text(verbatim: initials)
                    .font(.system(size: mavisRound(side * 0.34), weight: .semibold))
                    .lineLimit(1)
            }
        }
        .frame(width: side, height: side)
        .foregroundStyle(MavisTokens.primary)
        .overlay {
            JoltPresence(picture != nil, enter: JoltPreset.fadeIn.recipe()) {
                if let picture {
                    Image(nsImage: picture)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: side, height: side)
                        .clipped()
                }
            }
        }
        .background(MavisTokens.primarySoft)
        .clipShape(square ? AnyShape(RoundedRectangle(cornerRadius: side / 4)) : AnyShape(Circle()))
        .task(id: src) {
            picture = nil
            let source = mavisTrim(src)
            guard !source.isEmpty else { return }
            let loaded = await MavisPicture.load(source)
            // A source that changed meanwhile has its own load.
            guard !Task.isCancelled else { return }
            picture = loaded
        }
        .accessibilityElement()
        .accessibilityLabel(Text(verbatim: spoken))
        .accessibilityAddTraits(.isImage)
        .accessibilityHidden(spoken.isEmpty)
    }
}`,
}
