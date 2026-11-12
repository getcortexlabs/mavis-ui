// What the choice fields share (MMultiSelect, MCombobox, MTransferList, MTreeSelect, MComposer,
// MColorPicker, MFilePicker): how their properties are read and the SwiftUI pieces they draw with.
import { swiftIcon } from './icon.mjs'

/**
 * A listener for an event no shared handler kind names: params is ({ T, record }) => the types
 * the event passes, and ts what a Vue file's own listener beside v-model is checked against.
 */
export function event(params, ts = 'string') {
  const read = ({ value, ctx, handler, record, T }) => handler(value, params({ T, record }), ctx)
  read.event = params
  read.ts = ts
  return read
}

/** A list of strings: the selected values, the expanded nodes. */
export const strings = ({ value, ctx, expr, T }) => ({ expr: expr(value, ctx, T.array(T.string)) })
export const stringsEvent = event(({ T }) => [T.array(T.string)], 'string[]')

/** options: the choices, as the record MSelect takes. */
export const options = ({ value, ctx, expr, record, T }) => ({
  expr: expr(value, ctx, T.array(record('SelectOption'))),
})

// A literal is checked while generating, as the Web checks it while rendering.
export const bounded =
  (key, test, message) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !test(number.value)) fail(attribute, `${key} ${message}`)
    return { expr: number }
  }

/** The choices of a Swift control, from the source's SelectOption records. */
export const swiftChoices = (prop, emit) =>
  `${emit.wrap(prop.expr)}.map { option in MavisChoice(value: option.value, label: option.label, disabled: option.disabled ?? false) }`

/** name: value arguments for the properties a node sets, in the helper's declaration order. */
export function swiftArguments(node, { emit, indent }, order) {
  const args = []
  for (const [prop, label = prop] of order) {
    const value = node.props[prop]
    if (!value) continue
    if ('body' in value) args.push(`${label}: ${emit.handler(value, indent + 4)}`)
    else if (prop === 'options') args.push(`${label}: ${swiftChoices(value, emit)}`)
    else args.push(`${label}: ${emit.value(value)}`)
  }
  return args
}

/** A helper call with one argument on each line. */
export const swiftCall = (name, args, indent) => {
  const pad = ' '.repeat(indent)
  return `${pad}${name}(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
}

/** Swift helpers the choice fields share; written once, before the first of them. */
export const choiceRuntime = {
  swiftRuntime({ theme, font }) {
    const caption = theme.typography.caption
    return `/// The name above a choice field, read as text like the Web's.
struct MavisSelectionLabel: View {
    let text: String
    var body: some View {
        Text(verbatim: text)
            .font(.system(size: ${caption.fontSize}, weight: .semibold))
            .foregroundStyle(MavisTokens.text)
            .fixedSize(horizontal: false, vertical: true)
    }
}

/// The line under a choice field: its error, or its helper text.
struct MavisSelectionMessage: View {
    var helperText = ""
    var error = ""
    var body: some View {
        if !error.isEmpty || !helperText.isEmpty {
            Text(verbatim: error.isEmpty ? helperText : error)
                .font(${font('caption')})
                .foregroundStyle(error.isEmpty ? MavisTokens.muted : MavisTokens.danger)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

/// A capsule drawn as a path. SwiftUI's own Capsule becomes a layer with a corner radius, which
/// an offscreen render (a snapshot, a print) draws with stray edges.
struct MavisSelectionPill: InsettableShape {
    var inset: CGFloat = 0
    func path(in rect: CGRect) -> Path {
        let box = rect.insetBy(dx: inset, dy: inset)
        return Path(roundedRect: box, cornerRadius: min(box.width, box.height) / 2, style: .circular)
    }
    func inset(by amount: CGFloat) -> MavisSelectionPill { MavisSelectionPill(inset: inset + amount) }
}

/// One chosen value: its label, and a button that takes it out. The chip is named by its label
/// and the button by removeLabel, as MChip is on the Web.
struct MavisSelectionChip: View {
    let label: String
    let removeLabel: String
    var disabled = false
    let remove: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            Text(verbatim: label)
                .font(.system(size: ${caption.fontSize}, weight: .semibold))
                .foregroundStyle(MavisTokens.text)
                .padding(.leading, 14)
                .padding(.vertical, 10)
                .accessibilityHidden(true)
            Button(action: remove) {
                ${swiftIcon('x', 16)}
                    .frame(width: 46, height: 46)
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
            .foregroundStyle(MavisTokens.text)
            .accessibilityLabel(Text(verbatim: removeLabel))
        }
        .frame(minHeight: 46)
        .background(MavisTokens.surface, in: MavisSelectionPill())
        .overlay(MavisSelectionPill().strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
        .opacity(disabled ? 0.45 : 1)
        .disabled(disabled)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}

/// Where the choices of a field open on the Mac: a panel in place, under the field, where the
/// Web and NativeScript open a sheet or a popover. Jolt brings it in and out; Reduce Motion
/// settles it.
struct MavisSelectionPanel<Content: View>: View {
    let title: String
    let open: Bool
    var spacing: Double = ${theme.space.md}
    var padding: Double = ${theme.space.md}
    @ViewBuilder var content: () -> Content

    var body: some View {
        JoltPresence(open) {
            MavisColumn(spacing: spacing) { content() }
                .padding(padding)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.md}))
                .overlay(RoundedRectangle(cornerRadius: ${theme.radius.md}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
                .accessibilityElement(children: .contain)
                .accessibilityLabel(Text(verbatim: title))
        }
    }
}

/// String#toLowerCase and includes for a filter: every choice matches an empty one.
func mavisSelectionMatches(_ label: String, _ query: String) -> Bool {
    let filter = mavisTrim(query).lowercased()
    return filter.isEmpty || label.lowercased().contains(filter)
}`
  },
}
