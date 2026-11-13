import { motionSurfaceReference, motionSurfaceRuntime } from './motion-surface.mjs'
import { expression, handlerJs, js } from '../js-text.mjs'
import { swiftNumber, swiftString } from '../swift-text.mjs'
import { flexRuntime } from './flex.mjs'
import { checkLink, followAction, linkProps, navigateAttribute } from './link.mjs'
import {
  accessibility,
  accessibleName,
  boxProps,
  flexItem,
  radius,
  spacing,
  union,
} from './shared.mjs'

// A shadow color of the theme: transparent, #RRGGBB or rgba(r, g, b, a).
function shadowColor(css) {
  if (css === 'transparent') return 'Color.clear'
  const hex = /^#([0-9a-f]{6})$/i.exec(css)
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(css)
  const channels = hex
    ? [0, 2, 4].map((at) => Number.parseInt(hex[1].slice(at, at + 2), 16))
    : rgba?.slice(1, 4).map(Number)
  if (!channels) throw new Error(`Unsupported shadow color ${css}.`)
  const [red, green, blue] = channels.map((channel) => channel / 255)
  return `Color(red: ${red}, green: ${green}, blue: ${blue}, opacity: ${Number(rgba?.[4] ?? 1)})`
}

// cardProps: a column of content on the theme's card surface. Its own tone picks the surface
// from the palette. Its interactive surface never wraps the controls in its content.
export const MCard = {
  props: {
    motionSurface: motionSurfaceReference,
    ...boxProps,
    gap: 'space',
    elevation: 'string',
    tone: 'string',
    label: 'string',
    onClick: 'handler',
    disabled: 'boolean',
    ...linkProps,
  },
  children: 'elements',
  reveals: true,
  uses: [flexRuntime, motionSurfaceRuntime],
  types: (theme) => `type MavisElevation = ${union(Object.keys(theme.elevation))}`,
  declaration:
    'declare function MCard(props: MavisBox & { motionSurface?: unknown; gap?: MavisSpacing; elevation?: MavisElevation; tone?: MavisTone; label?: string; onClick?: () => void; disabled?: boolean; children?: unknown } & MavisLinkProps): JSX.Element',
  check(source) {
    const { props, attrs, tag, fail } = source
    const name = accessibleName(source)
    checkLink(source)
    if (props.onClick && !name)
      fail(tag, 'A card with onClick needs a label: it is announced as one button.')
    if (props.href && !name)
      fail(tag, 'A card with an href needs a label: it is announced as one link.')
    if (props.tone && props.backgroundColor)
      fail(attrs.get('backgroundColor'), 'tone and backgroundColor both paint the card; use one.')
    if (props.disabled && !props.onClick && !props.href)
      fail(attrs.get('disabled'), 'disabled is for a card with onClick.')
  },
  checkChildren({ element, tag, fail, hasControl }) {
    // Preserve the single-button path for plain content, and separate the action layer when
    // children (including shared components and slots) may contain their own controls.
    element.cardControls = Boolean(element.props.onClick && element.children.some(hasControl))
    if (element.props.href && element.children.some(hasControl))
      fail(
        tag,
        'A card with an href is one link and shows text only; put buttons and fields outside it.',
      )
  },
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const body =
      node.children.map((childNode) => emit.view(childNode, indent + 4, tokens)).join('\n') ||
      `${pad}    EmptyView()`
    const tone = props.backgroundColor
      ? `mavisColor(${emit.value(props.backgroundColor)})`
      : !props.tone
        ? 'MavisTokens.surface'
        : 'lit' in props.tone
          ? tokens.color(props.tone.lit)
          : `MavisTokens.tone(${emit.expr(props.tone.expr)})`
    const paddingX = props.paddingX ?? props.padding
    const paddingY = props.paddingY ?? props.padding
    const args = [
      `tone: AnyShapeStyle(${tone})`,
      ...(paddingX ? [`paddingX: ${spacing(paddingX, context)}`] : []),
      ...(paddingY ? [`paddingY: ${spacing(paddingY, context)}`] : []),
      ...(props.radius ? [`radius: ${radius(props.radius, context)}`] : []),
      `spacing: ${spacing(props.gap, context, 'none')}`,
      ...(props.elevation ? [`elevation: ${emit.value(props.elevation)}`] : []),
    ]
    const card = [`MavisCard(${args.join(', ')}) {`, body, `${pad}}`]
    const name = props.label ?? props.accessibilityLabel
    if (!props.onClick && !props.href)
      return [
        `${pad}${card[0]}`,
        ...card.slice(1),
        ...accessibility(props, context, { container: true, name }),
        ...flexItem(props, context),
        ...(props.motionSurface
          ? [`${pad}    .mavisMotionSurface(self.${props.motionSurface.ref})`]
          : []),
      ].join('\n')
    if (node.cardControls)
      return [
        `${pad}MavisCardActions(name: ${emit.value(name)}, disabled: ${props.disabled ? emit.value(props.disabled) : 'false'}, action: ${emit.handler(props.onClick, indent)}) {`,
        `${pad}    ${card[0]}`,
        ...card.slice(1).map((line) => `    ${line}`),
        `${pad}}`,
        ...flexItem(props, context),
        ...accessibility(
          { id: props.id, accessibilityHidden: props.accessibilityHidden },
          context,
          { container: true },
        ),
        ...(props.motionSurface
          ? [`${pad}    .mavisMotionSurface(self.${props.motionSurface.ref})`]
          : []),
      ].join('\n')
    // One button for assistive technology, like the Web card with role="button"; with an href
    // one link, like the Web's anchor.
    return [
      `${pad}Button(action: ${props.href ? followAction(props, context) : emit.handler(props.onClick, indent)}) {`,
      `${pad}    ${card[0]}`,
      body
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n'),
      `${pad}    }`,
      `${pad}}`,
      `${pad}    .buttonStyle(MavisCardButtonStyle())`,
      ...(props.disabled ? [`${pad}    .disabled(${emit.value(props.disabled)})`] : []),
      ...(props.href ? [`${pad}    .mavisLinkRole()`] : []),
      ...accessibility(
        props.href ? props : { ...props, id: props.id ?? { lit: 'mavis-card' } },
        context,
        { name },
      ),
      ...flexItem(props, context),
      ...(props.motionSurface
        ? [`${pad}    .mavisMotionSurface(self.${props.motionSurface.ref})`]
        : []),
    ].join('\n')
  },
  swiftRuntime({ theme, scoped }) {
    const card = theme.components.card
    const cardPadding = typeof card.padding === 'number' ? card.padding : theme.space[card.padding]
    const cardRadius = typeof card.radius === 'number' ? card.radius : theme.radius[card.radius]
    const shadows = Object.entries(scoped ? {} : theme.elevation)
      .filter(([, shadow]) => shadow.color !== 'transparent')
      .map(
        ([name, shadow]) =>
          `        case ${swiftString(name)}: return (${shadowColor(shadow.color)}, ${swiftNumber(shadow.blur / 2)}, ${swiftNumber(shadow.x)}, ${swiftNumber(shadow.y)})`,
      )
    return `/// MCard: the theme's card surface around a column of content.
struct MavisCard<Content: View>: View {
    var tone = AnyShapeStyle(MavisTokens.surface)
    var paddingX: Double${scoped ? '?' : ''} = ${scoped ? 'nil' : cardPadding}
    var paddingY: Double${scoped ? '?' : ''} = ${scoped ? 'nil' : cardPadding}
    var radius: Double${scoped ? '?' : ''} = ${scoped ? 'nil' : cardRadius}
    var spacing: Double = 0
    var elevation: String${scoped ? '?' : ''} = ${scoped ? 'nil' : swiftString(card.elevation)}
    @ViewBuilder var content: () -> Content
${scoped ? '    @Environment(\\.mavisTheme) private var mavisTheme' : ''}

    private var shadow: (color: Color, radius: Double, x: Double, y: Double) {
        switch elevation {
${shadows.join('\n')}
        default: return (.clear, 0, 0, 0)
        }
    }

    var body: some View {
${
  scoped
    ? `        let metrics = mavisTheme.palette.metrics
        let paddingX = self.paddingX ?? metrics.card.padding
        let paddingY = self.paddingY ?? metrics.card.padding
        let radius = self.radius ?? metrics.card.radius`
    : ''
}
        MavisColumn(spacing: spacing) { content() }
            // The border takes one unit of the card's box, as on the Web.
            .padding(.horizontal, paddingX + 1)
            .padding(.vertical, paddingY + 1)
            .background { RoundedRectangle(cornerRadius: radius).fill(tone).allowsHitTesting(false) }
            .overlay(RoundedRectangle(cornerRadius: radius).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
            ${scoped ? '.mavisElevation(elevation ?? metrics.card.elevation, radius: radius)' : '.shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)'}
    }
}

/// Interactive content and the card's activation surface are siblings: a child button or
/// field consumes its own input without activating the card or becoming a nested Button.
struct MavisCardActions<Content: View>: View {
    let name: String
    var disabled = false
    let action: () -> Void
    @ViewBuilder var content: () -> Content
    @State private var pressed = false
    @Environment(\\.mavisTheme) private var theme
    var body: some View {
        content()
            .background {
                Button(action: action) { Color.clear.contentShape(Rectangle()) }
                    .buttonStyle(MavisCardActionStyle(pressed: $pressed))
                    .disabled(disabled)
                    .accessibilityLabel(Text(verbatim: name))
            }
            .opacity(disabled ? 0.45 : 1)
            .joltMotion(to: pressed && !disabled ? try! JoltPose(scale: ${scoped ? 'theme.palette.metrics.motion.pressScale' : theme.motion.pressScale}) : .identity,
                        transition: ${scoped ? 'theme.palette.metrics.motion.press(pressed && !disabled)' : '.spring(.snappy)'})
    }
}
private struct MavisCardActionStyle: ButtonStyle {
    @Binding var pressed: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .onChange(of: configuration.isPressed) { _, value in pressed = value }
            .onDisappear { pressed = false }
    }
}

/// A card with onClick: the whole surface presses, through Jolt.
struct MavisCardButtonStyle: ButtonStyle {
    @Environment(\\.isEnabled) private var isEnabled
${scoped ? '    @Environment(\\.mavisTheme) private var mavisTheme' : ''}
    private static let pressed = try! JoltPose(scale: ${theme.motion.pressScale})
    func makeBody(configuration: Configuration) -> some View {
${
  scoped
    ? `        let metrics = mavisTheme.palette.metrics
        let pressed = configuration.isPressed && isEnabled`
    : ''
}
        configuration.label
            .contentShape(RoundedRectangle(cornerRadius: ${scoped ? 'metrics.card.radius' : cardRadius}))
            .opacity(isEnabled ? 1 : 0.45)
            .joltMotion(to: ${scoped ? 'pressed ? try! JoltPose(scale: metrics.motion.pressScale) : .identity, transition: metrics.motion.press(pressed)' : 'configuration.isPressed && isEnabled ? Self.pressed : .identity, transition: .spring(.snappy)'})
    }
}`
  },
  vue: {
    rename: { label: 'accessibilityLabel' },
    source: {
      hidden: ['label', 'tone'],
      flags: { onClick: 'interactive' },
      // The whole card is announced as one button.
      names: { onClick: 'accessibilityLabel', href: 'accessibilityLabel' },
    },
    attribute(name, value) {
      if (name === 'motionSurface') return `:motionSurface="${value.ref}"`
      if (name === 'navigate') return navigateAttribute(name, value)
      // tone paints the card with a theme color.
      if (name === 'tone')
        return `:backgroundColor="${expression('lit' in value ? `mavisTheme.colors.${value.lit}` : `mavisTheme.colors[${js(value.expr)} as keyof typeof mavisTheme.colors]`)}"`
      if (name === 'onClick') return `interactive @click="${expression(handlerJs(value))}"`
    },
    script: (nodes) =>
      nodes.some((node) => node.props.tone)
        ? { core: ['useMavisTheme'], setup: ['const { theme: mavisTheme } = useMavisTheme()'] }
        : {},
  },
}
