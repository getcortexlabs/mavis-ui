// MIcon: one glyph of the Lucide font, the same font and names as the Web and NativeScript. The
// Mac app carries lucide.ttf in its resources (see the starter's Package.swift).
import { swiftNumber } from '../swift-text.mjs'
import { flexRuntime } from './flex.mjs'
import { iconGlyphs } from './icon-glyphs.mjs'
import { union } from './shared.mjs'

/** The icon names of the Mavis core, in its order. */
export const iconNames = Object.keys(iconGlyphs)
/** iconSizes of the Mavis core: the points of sm, md and lg. */
export const iconSizes = { sm: 16, md: 20, lg: 24 }

/** The Swift string literal of an icon's glyph: "\u{e151}" for search. */
export function swiftGlyph(name) {
  if (!Object.hasOwn(iconGlyphs, name)) throw new Error(`Unknown icon ${name}.`)
  return `"\\u{${iconGlyphs[name].toString(16)}}"`
}

/**
 * The SwiftUI view that draws an icon, for the modules that show one: MavisIcon(glyph:size:).
 *
 *   name  the icon: its name as a string, or a model property ({ lit } or { expr })
 *   size  points: a number, or a Swift expression; md (20) when left out
 *   emit  the context's emitter, needed for a name that is an expression
 *
 * The view is size by size points, decoration hidden from assistive technology, and drawn in the
 * foreground style around it: add .foregroundStyle(MavisTokens.muted) for a tone.
 */
export function swiftIcon(name, size = iconSizes.md, emit) {
  const points = typeof size === 'number' ? swiftNumber(size) : size
  const literal = typeof name === 'string' ? name : 'lit' in name ? name.lit : undefined
  return literal === undefined
    ? `MavisIcon(${emit.expr(name.expr)}, size: ${points})`
    : `MavisIcon(glyph: ${swiftGlyph(literal)}, size: ${points})`
}

/** An icon property's glyph as a Swift string: a literal, or looked up while the screen runs. */
export const swiftGlyphOf = (prop, emit) =>
  'lit' in prop ? swiftGlyph(prop.lit) : `MavisIcons.glyph(${emit.expr(prop.expr)})`

const kinds = (type, ts) => {
  const parts = type.isUnion() ? type.types : [type]
  return {
    text: parts.some((part) => part.flags & ts.TypeFlags.StringLike),
    number: parts.some((part) => part.flags & ts.TypeFlags.NumberLike),
  }
}

// sm, md or lg, or a number of points; either can be a value of the screen.
function size({ attribute, value, ctx, expr, fail, checker, ts, T }) {
  const named = `size is ${Object.keys(iconSizes).join(', ')} or a number of points.`
  if (ts.isStringLiteral(value)) {
    if (!Object.hasOwn(iconSizes, value.text)) fail(attribute, named)
    return { lit: value.text }
  }
  const kind = kinds(checker.getTypeAtLocation(value), ts)
  if (kind.text && kind.number)
    fail(attribute, `${named} A value that can be either is not supported: use one kind.`)
  if (kind.text) return { expr: expr(value, ctx, T.string) }
  const points = expr(value, ctx, T.number)
  if (points.e === 'lit' && !(points.value > 0))
    fail(attribute, 'size is a positive number of points.')
  return { expr: points }
}

const motionSurface = ({ attribute, fail }) =>
  fail(
    attribute,
    'motionSurface needs the Mavis motion API, which the Mac does not have yet (#354). Leave it out of a shared MIcon for now.',
  )

/** An icon's size in points as Swift: a literal, a number of the screen or a name of the screen. */
export function swiftIconSize(prop, emit) {
  if (!prop) return swiftNumber(iconSizes.md)
  if ('lit' in prop) return swiftNumber(iconSizes[prop.lit])
  return prop.expr.type.k === 'string'
    ? `MavisIcons.size(${emit.expr(prop.expr)})`
    : emit.expr(prop.expr)
}

// iconProps. systemName is iOS artwork; the Mac draws name, as the Web and Android do.
export const MIcon = {
  props: {
    id: 'string',
    name: 'string',
    size,
    tone: 'string',
    label: 'string',
    systemName: 'string',
    motionSurface,
  },
  required: ['name'],
  uses: [flexRuntime],
  types: () => `/** An icon of the Lucide set every Mavis app carries. */
type MavisIconName = ${union(iconNames)}
type MavisIconSize = ${union(Object.keys(iconSizes))} | number
declare module '@getcortexlabs/mavis-core' {
  export type IconName = MavisIconName
  export type IconSize = MavisIconSize
}`,
  declaration:
    'declare function MIcon(props: { id?: string; name: MavisIconName; size?: MavisIconSize; tone?: MavisTone; label?: string; systemName?: string; motionSurface?: unknown }): JSX.Element',
  swift(node, { emit, indent, tokens }) {
    const pad = ' '.repeat(indent)
    const props = node.props
    const tone =
      !props.tone || 'lit' in props.tone
        ? tokens.color(props.tone?.lit ?? 'text')
        : `MavisTokens.tone(${emit.expr(props.tone.expr)})`
    return [
      `${pad}${swiftIcon(props.name, swiftIconSize(props.size, emit), emit)}`,
      `${pad}    .foregroundStyle(${tone})`,
      // With a label the icon is an image of that name; without one it stays decoration, and
      // its id is only for test runs.
      ...(props.label ? [`${pad}    .mavisIconLabel(${emit.value(props.label)})`] : []),
      ...(props.id
        ? [
            `${pad}    .${props.label ? 'accessibilityIdentifier' : 'mavisIdentifier'}(${emit.value(props.id)})`,
          ]
        : []),
      `${pad}    .mavisItem(shrink: 0)`,
    ].join('\n')
  },
  swiftRuntime:
    () => `/// The Lucide font Mavis icons are drawn with. The app carries lucide.ttf in its resources, and
/// the font is registered for this process the first time an icon needs it.
enum MavisIconFont {
    static let name: String = {
        let files = FileManager.default
        // A build folder can be a link, which a directory listing does not follow.
        let roots = [Bundle.main.resourceURL, Bundle.main.bundleURL, Bundle.main.executableURL?.deletingLastPathComponent()].compactMap { $0?.resolvingSymlinksInPath() }
        var folders: [URL] = []
        for root in roots {
            folders.append(root)
            // A Swift package keeps its resources in a bundle beside the executable.
            for entry in (try? files.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)) ?? [] where entry.pathExtension == "bundle" {
                folders.append(entry)
                folders.append(entry.appendingPathComponent("Contents/Resources"))
            }
        }
        let fonts = folders.flatMap { [$0.appendingPathComponent("Fonts/lucide.ttf"), $0.appendingPathComponent("lucide.ttf")] }
        if let font = fonts.first(where: { files.fileExists(atPath: $0.path) }) {
            CTFontManagerRegisterFontsForURL(font as CFURL, .process, nil)
        }
        return "lucide"
    }()
}

/// The glyph of each icon name, from the Mavis core's table, and the points of a named size.
enum MavisIcons {
    private static let glyphs: [String: String] = {
        let parts = "${iconNames.map((name) => `${name} ${iconGlyphs[name].toString(16)}`).join(' ')}".split(separator: " ")
        var table: [String: String] = [:]
        for index in stride(from: 0, to: parts.count - 1, by: 2) {
            if let code = UInt32(parts[index + 1], radix: 16), let scalar = Unicode.Scalar(code) {
                table[String(parts[index])] = String(Character(scalar))
            }
        }
        return table
    }()

    static func glyph(_ name: String) -> String { glyphs[name] ?? "" }

    static func size(_ name: String) -> Double {
        switch name {
${Object.entries(iconSizes)
  .filter(([name]) => name !== 'md')
  .map(([name, points]) => `        case "${name}": return ${points}`)
  .join('\n')}
        default: return ${iconSizes.md}
        }
    }
}

/// One icon, size by size points, in the foreground style around it. It is decoration unless
/// mavisIconLabel names it.
struct MavisIcon: View {
    let glyph: String
    var size: Double = ${iconSizes.md}

    init(_ name: String, size: Double = ${iconSizes.md}) {
        self.glyph = MavisIcons.glyph(name)
        self.size = size
    }

    init(glyph: String, size: Double = ${iconSizes.md}) {
        self.glyph = glyph
        self.size = size
    }

    var body: some View {
        Text(verbatim: glyph)
            .font(.custom(MavisIconFont.name, fixedSize: max(0, size)))
            .lineLimit(1)
            .fixedSize()
            .frame(width: max(0, size), height: max(0, size))
            .accessibilityHidden(true)
    }
}

extension View {
    /// An icon's name for assistive technology: an image of that name. Without a name it stays hidden.
    @ViewBuilder func mavisIconLabel(_ label: String) -> some View {
        if label.isEmpty {
            self
        } else {
            self.accessibilityElement().accessibilityLabel(Text(verbatim: label)).accessibilityAddTraits(.isImage)
        }
    }
}`,
}
