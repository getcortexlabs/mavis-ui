// MLink, MBreadcrumb and MAppBar: where the app can go from here. The app owns its routes; on the
// Mac a destination on another site opens in the browser, and one inside the app goes to the
// app's navigation (MavisWayfinding) or to the function the source passes.
import { expression, handlerJs } from '../js-text.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'
import { bounded, items, mapped, oneOf, optionalText, text } from './items.mjs'
import { accessibility, flexItem, flexProps, viewProps } from './shared.mjs'

const crumb = { key: text, label: text, href: optionalText }

/** isAppDestination in the Mavis core: a destination with no scheme and no host of its own. */
const inApp = (href) => !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) && !href.includes('\\')

// A function the source hands a component, such as MLink's navigate: an arrow written in
// place, or a function of the component by its name.
export const callback =
  (key, params) =>
  ({ attribute, value, ctx, handler, fail, ts, T }) => {
    const types = params.map((param) => T[param])
    if (!ts.isIdentifier(value)) return handler(value, types, ctx)
    const action = ctx.component.actions.find((each) => each.name === value.text)
    if (ctx.members.get(value.text) !== 'Action' || !action)
      fail(attribute, `${key} takes a function of this component.`)
    if (
      action.params.length > types.length ||
      action.params.some((param, index) => param.type.k !== types[index].k)
    )
      fail(
        attribute,
        `${key} calls ${value.text} with ${types.length ? params.join(', ') : 'no arguments'}; it takes ${action.params.map((param) => param.type.k).join(', ')}.`,
      )
    return {
      params: types.map((type, index) =>
        index < action.params.length
          ? { name: action.params[index].name, type }
          : { name: '_', type, unused: true },
      ),
      body: [
        {
          s: 'action',
          name: value.text,
          args: action.params.map((param, index) => ({
            e: 'local',
            name: param.name,
            type: types[index],
          })),
        },
      ],
    }
  }

const settings = (props, keys, emit) =>
  keys.flatMap((key) => (props[key] ? [`${key}: ${emit.value(props[key])}`] : []))
const handlers = (props, keys, emit, indent) =>
  keys.flatMap((key) => (props[key] ? [`${key}: ${emit.handler(props[key], indent + 4)}`] : []))

function call(name, args, indent) {
  const pad = ' '.repeat(indent)
  return [`${pad}${name}(`, args.map((arg) => `${pad}    ${arg}`).join(',\n'), `${pad})`]
}

/** What the navigation components share on the Mac: the app's navigation, links and their parts. */
export const wayfindingRuntime = {
  swiftRuntime: ({ theme, font }) => {
    const button = theme.components.button
    const corner = typeof button.radius === 'number' ? button.radius : theme.radius[button.radius]
    return `/// Where MLink, MBreadcrumb, MTabBar and MNavigationRail send a destination inside the app. An app
/// with navigation installs its own: .environment(\\.mavisWayfinding, MavisWayfinding { href in … }).
struct MavisWayfinding {
    /// Takes a destination inside the app; false when nothing in the app could.
    var open: (String) -> Bool = { _ in false }

    /// linkDestination and isAppDestination in the Mavis core. Another site opens in the browser;
    /// what is not a destination, or one the app has no navigation for, is a failure.
    @MainActor func follow(_ href: String, with openURL: OpenURLAction) -> Bool {
        let destination = mavisTrim(href)
        guard !destination.isEmpty, !destination.unicodeScalars.contains(where: { $0.value < 0x20 || $0.value == 0x7F }) else { return false }
        if let scheme = destination.range(of: "^[A-Za-z][A-Za-z0-9+.-]*:", options: .regularExpression) {
            let name = destination[scheme].dropLast().lowercased()
            guard !["javascript", "data", "vbscript"].contains(name), let url = URL(string: destination) else { return false }
            openURL(url)
            return true
        }
        guard !destination.hasPrefix("//"), !destination.contains("\\\\") else { return false }
        return open(destination)
    }
}

private struct MavisWayfindingKey: EnvironmentKey {
    static let defaultValue = MavisWayfinding()
}

extension EnvironmentValues {
    var mavisWayfinding: MavisWayfinding {
        get { self[MavisWayfindingKey.self] }
        set { self[MavisWayfindingKey.self] = newValue }
    }
}

/// MLink's look: underlined text in the theme's primary color, at least a control tall and
/// centered in the width it is given. An inline link is as tall as its text and starts where it is.
struct MavisLinkStyle: ButtonStyle {
    var inline = false
    @Environment(\\.isEnabled) private var isEnabled
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(${font('body')})
            .underline()
            .foregroundStyle(MavisTokens.primary)
            .multilineTextAlignment(inline ? .leading : .center)
            .frame(maxWidth: .infinity, minHeight: inline ? nil : 44, alignment: inline ? .leading : .center)
            .contentShape(Rectangle())
            .opacity(isEnabled ? 1 : 0.45)
    }
}

/// A button that is only an icon, as wide as it is tall, named for the pointer and assistive
/// technology. Jolt presses it like any Mavis button.
struct MavisWayIconButton: View {
    let glyph: String
    let label: String
    var size: MavisButtonSize = .md
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            MavisIcon(glyph: glyph, size: size.indicator)
        }
        .buttonStyle(MavisWayIconStyle(size: size))
        .accessibilityLabel(Text(verbatim: label))
        .help(label)
    }
}

private struct MavisWayIconStyle: ButtonStyle {
    let size: MavisButtonSize
    @Environment(\\.isEnabled) private var isEnabled
    private static let pressed = try! JoltPose(scale: ${theme.motion.pressScale})
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(MavisTokens.text)
            .frame(width: size.height, height: size.height)
            .contentShape(RoundedRectangle(cornerRadius: ${corner}))
            .opacity(isEnabled ? 1 : 0.45)
            .joltMotion(to: configuration.isPressed && isEnabled ? Self.pressed : .identity, transition: .spring(.snappy))
    }
}`
  },
}

// linkProps: text that goes somewhere. With navigate the source takes the destination; without
// it another site opens in the browser. A destination inside the app with no navigate needs the
// app's navigation, which the Mac does not have yet.
export const MLink = {
  props: {
    ...viewProps,
    ...flexProps,
    href: 'string',
    text: 'string',
    navigate: callback('navigate', ['string']),
    target: oneOf('target', ['_self', '_blank']),
    rel: 'string',
    disabled: 'boolean',
    inline: 'boolean',
    onClick: 'handler',
    onError: 'handler',
  },
  required: ['href', 'text'],
  control: true,
  uses: [flexRuntime, wayfindingRuntime],
  declaration:
    "declare function MLink(props: MavisView & MavisFlexItem & { href: string; text: string; navigate?: (href: string) => void; target?: '_self' | '_blank'; rel?: string; disabled?: boolean; inline?: boolean; onClick?: () => void; onError?: () => void }): JSX.Element",
  check({ props, attrs, fail }) {
    if (!('lit' in props.href)) return
    const href = props.href.lit.trim()
    if (!href || /[\u0000-\u001f\u007f]/.test(href))
      fail(attrs.get('href'), 'href is where the link goes: it cannot be empty.')
    if (/^(?:javascript|data|vbscript):/i.test(href))
      fail(
        attrs.get('href'),
        'A link goes to a place, not to code: href cannot be a script or data.',
      )
    if (!props.navigate && inApp(href))
      fail(
        attrs.get('href'),
        `${href} is a place inside the app, and the Mac has no navigation to take a link there yet (#341). Pass navigate to take the destination yourself; a link to another site, such as https://example.com, opens in the browser.`,
      )
  },
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    const blank = props.target && ('lit' in props.target ? props.target.lit === '_blank' : null)
    return [
      ...call(
        'MavisLink',
        [
          `text: ${emit.value(props.text)}`,
          `href: ${emit.value(props.href)}`,
          ...handlers(props, ['navigate'], emit, indent),
          ...(blank === null
            ? [`blank: ${emit.expr(props.target.expr)} == "_blank"`]
            : blank
              ? ['blank: true']
              : []),
          ...settings(props, ['disabled', 'inline'], emit),
          ...handlers(props, ['onClick', 'onError'], emit, indent),
        ],
        indent,
      ),
      ...accessibility(props, context),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime:
    () => `/// MLink: text that goes somewhere. navigate takes the destination when the source passes it,
/// unless the link opens a new window on the Web; otherwise another site opens in the browser and
/// the app's navigation takes a place inside the app. What nothing takes is reported as an error.
struct MavisLink: View {
    let text: String
    let href: String
    var navigate: ((String) -> Void)? = nil
    var blank = false
    var disabled = false
    var inline = false
    var onClick: () -> Void = {}
    var onError: () -> Void = {}
    @Environment(\\.mavisWayfinding) private var wayfinding
    @Environment(\\.openURL) private var openURL

    var body: some View {
        Button(action: {
            onClick()
            if let navigate, !blank {
                navigate(mavisTrim(href))
            } else if !wayfinding.follow(href, with: openURL) {
                onError()
            }
        }) {
            Text(verbatim: text)
        }
        .buttonStyle(MavisLinkStyle(inline: inline))
        .disabled(disabled)
        .accessibilityAddTraits(.isLink)
        .accessibilityRemoveTraits(.isButton)
    }
}`,
  vue: {
    source: { slot: 'text' },
    attribute(name, value) {
      if (name === 'navigate') return `:navigate="${expression(handlerJs(value))}"`
    },
  },
}

// breadcrumbProps: the path to the current page. Every item but the last is a link; with more
// than maxItems the middle ones wait behind a button that shows the whole path.
export const MBreadcrumb = {
  props: {
    id: 'string',
    label: 'string',
    items: items(
      crumb,
      'MBreadcrumb takes items with a key and a label, both strings, such as BreadcrumbItem[]: { key: string; label: string; href?: string }.',
    ),
    maxItems: bounded(
      'maxItems',
      (value) => Number.isInteger(value) && value >= 2,
      'is a whole number, 2 or more.',
    ),
    expandLabel: 'string',
    onError: 'handler',
  },
  required: ['items'],
  control: true,
  uses: [flexRuntime, wayfindingRuntime],
  types:
    () => `/** One place on the path of MBreadcrumb. Every place but the last, the current page, has an href. */
type BreadcrumbItem = { key: string; label: string; href?: string }
type __MavisBreadcrumbItem = BreadcrumbItem
declare module '@getcortexlabs/mavis-core' {
  export type BreadcrumbItem = __MavisBreadcrumbItem
}`,
  records: { BreadcrumbItem: 'the Mavis breadcrumb type' },
  declaration:
    'declare function MBreadcrumb(props: { id?: string; label?: string; items: readonly { readonly key: string; readonly label: string; readonly href?: string }[]; maxItems?: number; expandLabel?: string; onError?: () => void }): JSX.Element',
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    return [
      ...call(
        'MavisBreadcrumb',
        [
          `items: ${mapped(props.items, crumb, 'MavisCrumb', emit)}`,
          ...settings(props, ['label'], emit),
          ...(props.maxItems ? [`maxItems: ${emit.expr(props.maxItems.expr)}`] : []),
          ...settings(props, ['expandLabel'], emit),
          ...handlers(props, ['onError'], emit, indent),
        ],
        indent,
      ),
      ...accessibility({ id: props.id }, context, { container: true }),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
  }) => `/// One place on the path of MBreadcrumb, without the shared record type.
struct MavisCrumb: Hashable {
    let key: String
    let label: String
    var href: String? = nil
}

/// MBreadcrumb: the path as a wrapping row, named by label. Every place but the last is a link;
/// the last is the current page. breadcrumbParts in the Mavis core decides what waits behind
/// the button that shows the whole path, and a path of other places starts collapsed again.
struct MavisBreadcrumb: View {
    let items: [MavisCrumb]
    var label = "Breadcrumb"
    var maxItems: Double = 4
    var expandLabel = "Show full path"
    var onError: () -> Void = {}
    @State private var expanded = false
    @Environment(\\.mavisWayfinding) private var wayfinding
    @Environment(\\.openURL) private var openURL

    private var entries: [MavisCrumb?] {
        let most = Int(Swift.max(2, maxItems.rounded(.down)))
        guard !expanded, items.count > most else { return items }
        return [items[0], nil] + items[(items.count - most + 1)...].map { Optional($0) }
    }

    var body: some View {
        let shown = entries
        MavisRow(spacing: ${theme.space.xs}, wrap: true) {
            ForEach(Array(shown.enumerated()), id: \\.offset) { entry in
                if entry.offset > 0 {
                    MavisIcon(glyph: ${swiftGlyph('chevron-right')}, size: 14)
                        .foregroundStyle(MavisTokens.muted)
                }
                if let item = entry.element {
                    if entry.offset == shown.count - 1 {
                        Text(verbatim: item.label)
                            .font(.system(size: ${theme.typography.body.fontSize}, weight: .semibold))
                            .foregroundStyle(MavisTokens.text)
                            .fixedSize(horizontal: false, vertical: true)
                            .mavisItem(shrink: 1)
                    } else {
                        Button(action: {
                            if !wayfinding.follow(item.href ?? "", with: openURL) { onError() }
                        }) {
                            Text(verbatim: item.label)
                        }
                        .buttonStyle(MavisLinkStyle())
                        .accessibilityAddTraits(.isLink)
                        .accessibilityRemoveTraits(.isButton)
                        .mavisItem(shrink: 1)
                    }
                } else {
                    MavisWayIconButton(glyph: ${swiftGlyph('ellipsis')}, label: expandLabel, size: .sm) { expanded = true }
                }
            }
        }
        .onChange(of: items.map(\\.key)) { _, _ in expanded = false }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
}

// appBarProps: the header of a screen, a row on the theme's surface with the title, a back
// button and what the source puts before and after the title. It is part of the content, where
// the source places it.
export const MAppBar = {
  props: {
    id: 'string',
    title: 'string',
    subtitle: 'string',
    back: 'boolean',
    backLabel: 'string',
    navigateBack: callback('navigateBack', []),
    onBack: 'handler',
    onError: 'handler',
  },
  required: ['title'],
  slots: ['leading', 'actions'],
  control: true,
  uses: [flexRuntime, wayfindingRuntime],
  declaration:
    'declare function MAppBar(props: { id?: string; title: string; subtitle?: string; back?: boolean; backLabel?: string; navigateBack?: () => void; onBack?: () => void; onError?: () => void; slotLeading?: JSX.Element; slotActions?: JSX.Element }): JSX.Element',
  check({ props, attrs, fail }) {
    const shown = props.back && !(props.back.expr.e === 'lit' && props.back.expr.value === false)
    if (shown && !props.navigateBack)
      fail(
        attrs.get('back'),
        "back needs navigateBack on the Mac: without it the back button asks the app's navigation, which the Mac does not have yet (#341).",
      )
  },
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const slot = (name) => {
      const body = (node.slots?.find((each) => each.name === name)?.body ?? [])
        .map((child) => emit.view(child, indent + 8, tokens))
        .join('\n')
      return `${name}: {\n${body || `${pad}        EmptyView()`}\n${pad}    }`
    }
    return [
      ...call(
        'MavisAppBar',
        [
          `title: ${emit.value(props.title)}`,
          ...settings(props, ['subtitle', 'back', 'backLabel'], emit),
          ...handlers(props, ['navigateBack', 'onBack'], emit, indent),
          slot('leading'),
          slot('actions'),
        ],
        indent,
      ),
      ...accessibility({ id: props.id }, context, { container: true }),
      `${pad}    .mavisItem(shrink: 0)`,
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// MAppBar: a row on the theme's surface, named by its title: the back button, the leading
/// content, the title over its subtitle, and the actions. The back button runs navigateBack and
/// then reports back.
struct MavisAppBar<Leading: View, Actions: View>: View {
    let title: String
    var subtitle = ""
    var back = false
    var backLabel = "Back"
    var navigateBack: () -> Void = {}
    var onBack: () -> Void = {}
    @ViewBuilder let leading: () -> Leading
    @ViewBuilder let actions: () -> Actions

    var body: some View {
        MavisRow(spacing: ${theme.space.md}) {
            if back {
                MavisWayIconButton(glyph: ${swiftGlyph('arrow-left')}, label: backLabel) {
                    navigateBack()
                    onBack()
                }
            }
            leading()
            MavisColumn(spacing: ${theme.space.xs}) {
                Text(verbatim: title)
                    .font(${font('heading')})
                    .foregroundStyle(MavisTokens.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityHeading(.h1)
                if !subtitle.isEmpty {
                    Text(verbatim: subtitle)
                        .font(${font('caption')})
                        .foregroundStyle(MavisTokens.muted)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .mavisItem(grow: 1, shrink: 1)
            actions()
        }
        .padding(${theme.space.md})
        .background(MavisTokens.surface)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: title))
    }
}`,
  vue: {
    attribute(name, value) {
      if (name === 'navigateBack') return `:navigateBack="${expression(handlerJs(value))}"`
    },
  },
}
