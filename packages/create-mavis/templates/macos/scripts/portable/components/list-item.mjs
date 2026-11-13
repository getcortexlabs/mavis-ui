import { expression, handlerJs } from '../js-text.mjs'
import { flexRuntime } from './flex.mjs'
import { accessibility, flexItem, flexProps, viewProps } from './shared.mjs'
import { content, listRuntime, slotOf } from './list-parts.mjs'

// listItemProps: a title and a description between a leading and a trailing slot, on the
// theme's surface. onClick makes the whole row one button (interactive in the contract), named
// by its title and description or by accessibilityLabel, with an arrow where trailing would be.
export const MListItem = {
  props: {
    ...viewProps,
    ...flexProps,
    width: 'dimension',
    title: 'string',
    description: 'string',
    onClick: 'handler',
    disabled: 'boolean',
  },
  required: ['title'],
  slots: ['leading', 'trailing'],
  uses: [flexRuntime, listRuntime],
  declaration:
    'declare function MListItem(props: MavisView & MavisFlexItem & { width?: MavisDimension; title: string; description?: string; onClick?: () => void; disabled?: boolean; slotLeading?: JSX.Element; slotTrailing?: JSX.Element }): JSX.Element',
  check({ props, attrs, fail }) {
    if ('lit' in props.title && !props.title.lit.trim())
      fail(attrs.get('title'), 'MListItem needs a title that is not empty.')
  },
  checkChildren({ element, tag, reader, ctx }) {
    if (!element.props.onClick) return
    // The whole row is one button; controls inside it could not be reached.
    for (const each of element.slots ?? [])
      reader.withoutControls(
        each.body,
        ctx.component,
        tag,
        `An MListItem with an action is one button, so its ${each.name} slot shows content only; put buttons and fields in a row without an action.`,
      )
  },
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    const action = props.onClick
    const inner = action ? indent + 4 : indent
    const pad = ' '.repeat(inner)
    const slot = (name) => content(slotOf(node, name)?.body ?? [], { ...context, indent: inner })
    const row = [
      `${pad}MavisListItem(`,
      [
        `${pad}    title: ${emit.value(props.title)}`,
        ...(props.description ? [`${pad}    description: ${emit.value(props.description)}`] : []),
        ...(action ? [`${pad}    arrow: true`] : []),
        `${pad}    leading: {\n${slot('leading')}\n${pad}    }`,
        `${pad}    trailing: {\n${slot('trailing')}\n${pad}    }`,
      ].join(',\n'),
      `${pad})`,
    ]
    if (!action)
      return [
        ...row,
        ...accessibility({ ...props, accessibilityLabel: undefined }, context, { container: true }),
        ...flexItem(props, context),
      ].join('\n')
    const outer = ' '.repeat(indent)
    const label = `mavisListItemLabel(${emit.value(props.title)}, ${props.description ? emit.value(props.description) : '""'}, ${props.accessibilityLabel ? emit.value(props.accessibilityLabel) : '""'})`
    return [
      `${outer}Button(action: ${emit.handler(action, indent)}) {`,
      ...row,
      `${outer}}`,
      `${outer}    .buttonStyle(MavisRowButtonStyle())`,
      ...(props.disabled ? [`${outer}    .disabled(${emit.value(props.disabled)})`] : []),
      `${outer}    .accessibilityLabel(Text(verbatim: ${label}))`,
      // Without an id of its own, a test finds the row among the cards that are buttons.
      ...accessibility(
        {
          id: props.id ?? { lit: 'mavis-card' },
          accessibilityHidden: props.accessibilityHidden,
        },
        context,
      ),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
    metric,
  }) => `/// MListItem: a title and a description between a leading and a trailing slot, on the theme's
/// surface. arrow is the disclosure arrow of a row that is a button and has no trailing content.
struct MavisListItem<Leading: View, Trailing: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let title: String
    var description: String = ""
    var arrow: Bool = false
    @ViewBuilder var leading: () -> Leading
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        MavisRow(spacing: ${metric('space.md')}) {
            if Leading.self != EmptyView.self {
                MavisColumn { leading() }
                    .accessibilityElement(children: .contain)
                    .mavisItem(shrink: 0)
            }
            MavisColumn(spacing: ${metric('space.xs')}) {
                Text(verbatim: title)
                    .font(${font('body')})
                    .fontWeight(.semibold)
                    .foregroundStyle(MavisTokens.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if !description.isEmpty {
                    Text(verbatim: description)
                        .font(${font('caption')})
                        .foregroundStyle(MavisTokens.muted)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            // Read as one group each, in the order of the row, whatever their heights.
            .accessibilityElement(children: .contain)
            .mavisItem(grow: 1, width: .points(0))
            if Trailing.self != EmptyView.self {
                MavisColumn(align: .end) { trailing() }
                    .accessibilityElement(children: .contain)
                    .mavisItem(shrink: 1)
            } else if arrow {
                MavisIcon("chevron-right", size: 16)
                    .foregroundStyle(MavisTokens.muted)
            }
        }
        .padding(${metric('space.md')})
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.md')}))
    }
}

/// listItemLabel in the Mavis core: the row's own label, or its title and description.
func mavisListItemLabel(_ title: String, _ description: String, _ label: String) -> String {
    let own = mavisTrim(label)
    if !own.isEmpty { return own }
    return [mavisTrim(title), mavisTrim(description)].filter { !$0.isEmpty }.joined(separator: ". ")
}`,
  vue: {
    source: { flags: { onClick: 'interactive' } },
    attribute(name, value) {
      if (name === 'onClick') return `interactive @click="${expression(handlerJs(value))}"`
    },
  },
}
