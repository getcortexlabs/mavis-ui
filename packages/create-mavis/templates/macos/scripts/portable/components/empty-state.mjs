import { feedbackRuntime, named, slotBody, slotViews, textArgs } from './feedback.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'
import { accessibility, choice, flexItem, flexProps, union } from './shared.mjs'

const tones = ['primary', 'accent']
const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

// The Web renders this element, so it cannot change while the screen runs.
function titleAs({ key, attribute, value, fail, ts }) {
  if (!ts.isStringLiteral(value))
    fail(attribute, `${key} is written as a literal, for example ${key}="h3".`)
  return { lit: value.text }
}

// emptyStateProps: what a list or a page shows when it has nothing: an illustration, a title
// that is a heading, a description, and actions in a centered row. The illustration is the
// tone's circle around icon unless the illustration slot draws another; either way it is
// decoration that assistive technology and the pointer pass over.
export const MEmptyState = {
  props: {
    id: 'string',
    accessibilityHidden: 'boolean',
    ...flexProps,
    width: 'dimension',
    title: named('is what the empty state says'),
    description: 'string',
    icon: 'string',
    tone: 'string',
    compact: 'boolean',
    titleAs,
  },
  required: ['title'],
  slots: ['illustration', 'actions'],
  control: true,
  uses: [flexRuntime, feedbackRuntime],
  declaration: `declare function MEmptyState(props: MavisFlexItem & { id?: string; accessibilityHidden?: boolean; width?: MavisDimension; title: string; description?: string; icon?: MavisIconName; tone?: ${union(tones)}; compact?: boolean; titleAs?: ${union(headings)}; slotIllustration?: JSX.Element; slotActions?: JSX.Element }): JSX.Element`,
  checkChildren({ element, tag, reader, ctx }) {
    const illustration = slotBody(element, 'illustration')
    if (illustration)
      reader.withoutControls(
        illustration,
        ctx.component,
        tag,
        "MEmptyState's illustration is decoration: the Web and the Mac keep it from assistive technology and the pointer, so a button or field there could not be used. Put controls in the actions.",
      )
  },
  swift(node, context) {
    const { emit, indent } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const closure = (name) => {
      const body = slotBody(node, name)
      return body
        ? `${name}: {\n${slotViews(body, context)}\n${pad}}`
        : `${name}: { MavisAbsent() }`
    }
    const args = [
      ...textArgs(props, ['title', 'description'], emit),
      ...(props.icon
        ? [
            `glyph: ${'lit' in props.icon ? swiftGlyph(props.icon.lit) : `MavisIcons.glyph(${emit.expr(props.icon.expr)})`}`,
          ]
        : []),
      ...(props.tone ? [`tone: ${choice(props.tone, 'MavisEmptyStateTone', emit)}`] : []),
      ...textArgs(props, ['compact'], emit),
      ...(props.titleAs ? [`level: .${props.titleAs.lit}`] : []),
      closure('illustration'),
      closure('actions'),
    ]
    return [
      `${pad}MavisEmptyState(${args.join(', ')})`,
      ...accessibility(props, context, { container: true }),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime: ({ theme, font }) => `enum MavisEmptyStateTone: String {
    case ${tones.join(', ')}
    init(_ name: String) { self = MavisEmptyStateTone(rawValue: name) ?? .primary }
    var color: MavisColor { self == .primary ? MavisTokens.primary : MavisTokens.accent }
    var soft: MavisColor { self == .primary ? MavisTokens.primarySoft : MavisTokens.accentSoft }
    var dot: MavisColor { self == .primary ? MavisTokens.accent : MavisTokens.primary }
}

/// MEmptyState: an illustration, a centered title that is a heading, a description, and actions
/// in a centered row that wraps. Without an illustration of its own it draws the icon in its
/// tone's color on a soft circle with a dot of the other tone. compact makes all of it smaller.
struct MavisEmptyState<Illustration: View, Actions: View>: View {
    let title: String
    var description: String = ""
    var glyph: String = ${swiftGlyph('inbox')}
    var tone: MavisEmptyStateTone = .primary
    var compact: Bool = false
    var level: AccessibilityHeadingLevel = .h2
    @ViewBuilder var illustration: () -> Illustration
    @ViewBuilder var actions: () -> Actions

    private var size: Double { compact ? 64 : 88 }

    var body: some View {
        MavisColumn(spacing: compact ? ${theme.space.md} : ${theme.space.lg}) {
            MavisColumn(align: .center) {
                if Illustration.self == MavisAbsent.self {
                    Circle()
                        .fill(tone.soft)
                        .overlay {
                            MavisIcon(glyph: glyph, size: compact ? 28 : 36)
                                .foregroundStyle(tone.color)
                        }
                        .overlay(alignment: .topTrailing) {
                            Circle().fill(tone.dot).frame(width: 18, height: 18)
                        }
                        .frame(width: size, height: size)
                } else {
                    illustration()
                }
            }
            .accessibilityHidden(true)
            .allowsHitTesting(false)
            MavisColumn(spacing: ${theme.space.sm}) {
                Text(verbatim: title)
                    .font(compact ? ${font('heading')} : ${font('title')})
                    .foregroundStyle(MavisTokens.text)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityHeading(level)
                if !description.isEmpty {
                    Text(verbatim: description)
                        .font(${font('body')})
                        .foregroundStyle(MavisTokens.muted)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            }
            if Actions.self != MavisAbsent.self {
                MavisRow(spacing: ${theme.space.sm}, justify: .center, wrap: true) { actions() }
            }
        }
        .padding(compact ? ${theme.space.lg} : ${theme.space['2xl']})
    }
}`,
}
