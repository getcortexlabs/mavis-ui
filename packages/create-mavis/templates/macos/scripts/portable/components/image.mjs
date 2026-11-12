// MImage and MAvatar: pictures from the files the app carries, data: URIs and the network.
import { swiftNumber } from '../swift-text.mjs'
import { bundleRuntime, source } from './assets.mjs'
import { flexRuntime } from './flex.mjs'
import { flexItem, flexProps, radius, union } from './shared.mjs'

const fits = ['cover', 'contain']
const hints = {
  loading: ['eager', 'lazy'],
  decoding: ['async', 'sync', 'auto'],
  fetchpriority: ['high', 'low', 'auto'],
}

const motionSurface = (name) => (read) =>
  read.fail(
    read.attribute,
    `motionSurface needs the Mavis motion API, which the Mac does not have yet (#354). Leave it out of a shared ${name} for now.`,
  )

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
    motionSurface: motionSurface('MImage'),
  },
  required: ['src', 'alt'],
  uses: [flexRuntime, bundleRuntime, pictureRuntime],
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
                JoltPresence(picture != nil, enter: JoltPreset.fadeIn.recipe()) {
                    if let picture {
                        Image(nsImage: picture)
                            .resizable()
                            .aspectRatio(contentMode: fit == .cover ? .fill : .fit)
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
