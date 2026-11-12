import { handlerJs, js, jsString } from '../js-text.mjs'
import { swiftString } from '../swift-text.mjs'
import { iconSizes, swiftGlyphOf } from './icon.mjs'
import { accessibility, choice, flexItem, flexProps, union, viewProps } from './shared.mjs'

const letters = [...'abcdefghijklmnopqrstuvwxyz']
const digits = [...'0123456789']
const functionKeys = Array.from({ length: 12 }, (_, index) => `F${index + 1}`)
const variants = ['primary', 'secondary', 'ghost']
const sizes = ['sm', 'md', 'lg']
const indicators = ['none', 'dots', 'bars', 'ring']
// An icon on a button of each size, from Mavis core; a loading indicator is as large.
const indicatorSizes = iconSizes

/** mod+k, mod+1, mod+Enter, F5 or mod+F5 as its key and whether it needs Command or Control. */
const parseShortcut = (text) => ({
  key: text.replace(/^mod\+/, ''),
  mod: text.startsWith('mod+'),
})

function shortcut({ value, attribute, ctx, fail, ts }) {
  if (!ts.isStringLiteral(value))
    fail(attribute, 'shortcut is written as a literal, for example shortcut="mod+k".')
  if (ctx.inFor) fail(attribute, 'Repeated rows cannot share one shortcut.')
  if (ctx.inSlot)
    fail(
      attribute,
      'A button with a shortcut stays on screen; keep it out of content passed to a component.',
    )
  // The shortcut exists while its button does; a hidden button would differ by target.
  if (ctx.inShow)
    fail(attribute, 'A button with a shortcut stays on screen; use disabled, not Show.')
  const taken = (ctx.component.shortcuts ??= new Set())
  if (taken.has(value.text)) fail(attribute, `${value.text} is already used in this file.`)
  taken.add(value.text)
  return { lit: value.text }
}

function swiftShortcut(text) {
  const { key, mod } = parseShortcut(text)
  const equivalent =
    key === 'Enter'
      ? '.return'
      : key.length === 1
        ? `KeyEquivalent(${swiftString(key)})`
        : `mavisFunctionKey(${key.slice(1)})`
  return `.keyboardShortcut(${equivalent}, modifiers: ${mod ? '.command' : '[]'})`
}

// buttonContract. onClick is the contract's activate event, and shortcut is the portable
// sources' own: Command on the Mac, Control or Command on the Web, nothing on touch.
export const MButton = {
  props: {
    ...viewProps,
    ...flexProps,
    text: 'string',
    variant: 'string',
    size: 'string',
    disabled: 'boolean',
    loading: 'boolean',
    loadingText: 'string',
    loadingIndicator: 'string',
    icon: 'string',
    trailingIcon: 'string',
    onClick: 'handler',
    shortcut,
  },
  required: ['onClick'],
  control: true,
  types:
    () => `/** Command on Apple keyboards, Control elsewhere, with a letter, a digit or Enter; or a function key, alone or with it. */
type MavisShortcut = ${union([...letters, ...digits, 'Enter', ...functionKeys].map((key) => `mod+${key}`))} | ${union(functionKeys)}`,
  declaration: `declare function MButton(props: MavisView & MavisFlexItem & { text?: string; variant?: ${union(variants)}; size?: ${union(sizes)}; disabled?: boolean; loading?: boolean; loadingText?: string; loadingIndicator?: ${union(indicators)}; icon?: MavisIconName; trailingIcon?: MavisIconName; onClick: () => void; shortcut?: MavisShortcut }): JSX.Element`,
  check({ props, tag, fail }) {
    if (props.text && props.text.lit !== '') return
    if (!props.icon && !props.trailingIcon) fail(tag, 'MButton needs text.')
    // The Web and NativeScript buttons refuse to render without one.
    if (!props.accessibilityLabel)
      fail(tag, 'An MButton with an icon and no text needs accessibilityLabel: its name.')
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const variant = props.variant ? choice(props.variant, 'MavisButtonVariant', emit) : '.primary'
    const size = props.size ? choice(props.size, 'MavisButtonSize', emit) : '.md'
    const loading = props.loading && emit.value(props.loading)
    const text = props.text && props.text.lit !== '' ? props.text : null
    const label =
      loading || props.icon || props.trailingIcon
        ? [
            `MavisButtonLabel(`,
            [
              `text: ${text ? emit.value(text) : '""'}`,
              ...(props.icon ? [`icon: ${swiftGlyphOf(props.icon, emit)}`] : []),
              ...(props.trailingIcon
                ? [`trailingIcon: ${swiftGlyphOf(props.trailingIcon, emit)}`]
                : []),
              ...(loading ? [`loading: ${loading}`] : []),
              ...(props.loadingText ? [`loadingText: ${emit.value(props.loadingText)}`] : []),
              ...(props.loadingIndicator
                ? [`indicator: ${choice(props.loadingIndicator, 'MavisLoadingIndicator', emit)}`]
                : []),
              `variant: ${variant}`,
              `size: ${size}`,
            ].join(', '),
            ')',
          ].join('')
        : `Text(verbatim: ${emit.value(text)})`
    const style = [
      ...(props.variant ? [`variant: ${variant}`] : []),
      ...(props.size ? [`size: ${size}`] : []),
      ...(loading ? [`loading: ${loading}`] : []),
      // Only an icon: as wide as it is tall. While it loads it shows loadingText.
      ...(text ? [] : [`iconOnly: ${loading ? `!${loading}` : 'true'}`]),
    ]
    const disabled = [
      ...(props.disabled ? [emit.value(props.disabled)] : []),
      ...(loading ? [loading] : []),
    ]
    return [
      `${pad}Button(action: ${emit.handler(props.onClick, indent)}) {`,
      `${pad}    ${label}`,
      `${pad}}`,
      `${pad}    .buttonStyle(MavisButtonStyle(${style.join(', ')}))`,
      ...(disabled.length ? [`${pad}    .disabled(${disabled.join(' || ')})`] : []),
      ...(props.shortcut ? [`${pad}    ${swiftShortcut(props.shortcut.lit)}`] : []),
      ...accessibility(props, context),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime({ theme, weight }) {
    const button = theme.components.button
    const radius = typeof button.radius === 'number' ? button.radius : theme.radius[button.radius]
    const each = (list, text) => list.map(text).join('\n')
    return `enum MavisButtonVariant: String {
    case primary, secondary, ghost
    init(_ name: String) { self = MavisButtonVariant(rawValue: name) ?? .primary }
    var foreground: MavisColor { self == .primary ? MavisTokens.onPrimary : MavisTokens.text }
    var background: MavisColor { self == .primary ? MavisTokens.primary : self == .secondary ? MavisTokens.elevated : .clear }
    func loader(_ palette: MavisPalette) -> JoltColor { JoltColor(argb: palette.argb[self == .primary ? .onPrimary : .text] ?? 0xFF000000) }
}

/// MButton size: the theme's control sizes.
enum MavisButtonSize: String {
    case sm, md, lg
    init(_ name: String) { self = MavisButtonSize(rawValue: name) ?? .md }
    var height: Double {
        switch self {
${each(sizes, (name) => `        case .${name}: return ${theme.control[name].height}`)}
        }
    }
    var fontSize: Double {
        switch self {
${each(sizes, (name) => `        case .${name}: return ${theme.control[name].fontSize}`)}
        }
    }
    var padding: Double {
        switch self {
${each(sizes, (name) => `        case .${name}: return ${theme.control[name].padding}`)}
        }
    }
    var indicator: Double {
        switch self {
${each(sizes, (name) => `        case .${name}: return ${indicatorSizes[name]}`)}
        }
    }
}

enum MavisLoadingIndicator: String {
    case none, dots, bars, ring
    init(_ name: String) { self = MavisLoadingIndicator(rawValue: name) ?? .none }
}

/// MButton: Mavis tokens for the look, Jolt for the press. Jolt settles under Reduce Motion.
/// A loading button keeps its look and takes no clicks.
struct MavisButtonStyle: ButtonStyle {
    var variant: MavisButtonVariant = .primary
    var size: MavisButtonSize = .md
    var loading: Bool = false
    var iconOnly: Bool = false
    @Environment(\\.isEnabled) private var isEnabled
    private static let pressed = try! JoltPose(scale: ${theme.motion.pressScale})
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: size.fontSize, weight: .${weight(button.fontWeight)}))
            .multilineTextAlignment(.center)
            .padding(.horizontal, iconOnly ? ((size.height - size.indicator) / 2).rounded() : size.padding).padding(.vertical, ${button.paddingY})
            // The whole space its stack gives it, like the Web button: a column stretches it.
            .frame(minWidth: 44, maxWidth: .infinity, minHeight: size.height, maxHeight: .infinity)
            .foregroundStyle(variant.foreground)
            .background(variant.background, in: RoundedRectangle(cornerRadius: ${radius}))
            .contentShape(RoundedRectangle(cornerRadius: ${radius}))
            .opacity(isEnabled || loading ? 1 : 0.45)
            .joltMotion(to: configuration.isPressed && isEnabled ? Self.pressed : .identity, transition: .spring(.snappy))
    }
}

/// The label of a button with icons, or one that can load: loadingText replaces the text, after
/// the indicator. The icons are glyphs of the Lucide font, in the size of the button's.
struct MavisButtonLabel: View {
    let text: String
    var icon: String = ""
    var trailingIcon: String = ""
    var loading: Bool = false
    var loadingText: String = "Loading…"
    var indicator: MavisLoadingIndicator = .none
    var variant: MavisButtonVariant = .primary
    var size: MavisButtonSize = .md
    @Environment(\\.mavisTheme) private var theme
    var body: some View {
        HStack(spacing: 8) {
            if loading, let style = JoltLoaderStyle(rawValue: indicator.rawValue) {
                MavisLoader(style: style, color: variant.loader(theme.palette), size: size.indicator)
            }
            if !icon.isEmpty { MavisIcon(glyph: icon, size: size.indicator) }
            if !shown.isEmpty { Text(verbatim: shown) }
            if !trailingIcon.isEmpty { MavisIcon(glyph: trailingIcon, size: size.indicator) }
        }
    }
    private var shown: String { loading ? loadingText : text }
}

/// A Jolt loader that runs while it is on screen. It is decoration: the button carries the name.
@MainActor private struct MavisLoader: View {
    @StateObject private var loader: JoltLoader
    private let size: Double
    init(style: JoltLoaderStyle, color: JoltColor, size: Double) {
        _loader = StateObject(wrappedValue: try! JoltLoader(style, color: color, size: size))
        self.size = size
    }
    var body: some View {
        JoltLoaderView(loader).frame(width: size, height: size)
    }
}

/// F1 to F12 as a keyboard shortcut.
func mavisFunctionKey(_ number: Int) -> KeyEquivalent {
    KeyEquivalent(Character(UnicodeScalar(0xF703 + UInt32(number))!))
}`
  },
  vue: {
    source: { hidden: ['shortcut'], slot: 'text' },
    // Shortcuts are registered in the script.
    attribute(name) {
      if (name === 'shortcut') return ''
    },
    script(nodes, { target }) {
      const shortcuts = target === 'web' ? nodes.filter((node) => node.props.shortcut) : []
      if (!shortcuts.length) return {}
      return {
        runtime: ['useMavisShortcuts'],
        setup: [
          'useMavisShortcuts([',
          ...shortcuts.map(({ props: button }) => {
            const { key, mod } = parseShortcut(button.shortcut.lit)
            // A loading button takes no shortcut either.
            const off = [button.disabled, button.loading]
              .filter(Boolean)
              .map((prop) => js(prop.expr))
            return `  { key: ${jsString(key)}, ${mod ? '' : 'mod: false, '}${off.length ? `disabled: () => ${off.join(' || ')}, ` : ''}run: ${handlerJs(button.onClick)} },`
          }),
          '])',
        ],
      }
    },
    runtime: {
      imports: ['onBeforeUnmount', 'onMounted'],
      source: `type Shortcut = { key: string; mod?: boolean; disabled?: () => boolean; run: () => void }

/**
 * Keys for the buttons that declare a shortcut, anywhere on the page: Control or Command with
 * a key, or a function key on its own when the shortcut says mod: false.
 */
export function useMavisShortcuts(shortcuts: Shortcut[]) {
  const listen = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat || event.altKey || event.shiftKey) return
    const mod = event.metaKey || event.ctrlKey
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    const match = shortcuts.find((shortcut) => shortcut.key === key && (shortcut.mod ?? true) === mod)
    if (!match) return
    event.preventDefault()
    if (!match.disabled?.()) match.run()
  }
  // Before the focused field sees the key, as a menu shortcut would be.
  onMounted(() => document.addEventListener('keydown', listen, true))
  onBeforeUnmount(() => document.removeEventListener('keydown', listen, true))
}`,
    },
  },
}
