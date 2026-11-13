// MInput, MCheckbox and MSelect: controlled fields that share a label and a message on the Mac.
import { expression, handlerJs, js } from '../js-text.mjs'
import { swiftString } from '../swift-text.mjs'
import { iconSizes, swiftGlyphOf } from './icon.mjs'
import { accessibility, flexItem, flexProps } from './shared.mjs'

/** ref on a field: the reference an action moves focus with. */
export function reference({ value, attribute, ctx, fail, ts }) {
  if (!ts.isIdentifier(value) || ctx.members.get(value.text) !== 'Ref')
    fail(attribute, 'ref takes a field reference declared with useRef.')
  if (ctx.inFor) fail(attribute, 'Repeated rows cannot share one field reference.')
  const field = ctx.component.refs.find((ref) => ref.name === value.text)
  if (field.kind)
    fail(attribute, `${value.text} is a list reference; a field takes a field reference.`)
  if (field.field) fail(attribute, `${value.text} already belongs to another field.`)
  field.field = true
  return { ref: value.text }
}

/** options of a select, a radio group or a segmented control: a list of SelectOption. */
export const options = ({ value, ctx, expr, record, T }) => ({
  expr: expr(value, ctx, T.array(record('SelectOption'))),
})

/** The options as the Swift controls take them. */
export const choices = (prop, emit) =>
  `${emit.wrap(prop.expr)}.map { option in MavisChoice(value: option.value, label: option.label, disabled: option.disabled ?? false, helperText: option.helperText ?? "") }`

// Arguments in the helper's declaration order; Swift requires it for defaulted parameters.
function control(node, { emit, indent }, name, order, extra = []) {
  const pad = ' '.repeat(indent)
  const args = []
  for (const [prop, label] of order) {
    const value = node.props[prop]
    if (!value) continue
    if ('body' in value) args.push(`${label}: ${emit.handler(value, indent + 4)}`)
    else if (prop === 'options') args.push(`${label}: ${choices(value, emit)}`)
    else args.push(`${label}: ${emit.value(value)}`)
  }
  args.push(...extra)
  // The control puts the identifier on its editor, checkbox or menu, where the Web puts the id.
  if (node.props.id) args.push(`id: ${emit.value(node.props.id)}`)
  return [
    `${pad}${name}(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
    ...accessibility({ accessibilityHidden: node.props.accessibilityHidden }, { emit, indent }),
    ...flexItem(node.props, { emit, indent }),
  ].join('\n')
}

// The contracts of the three fields share these: the label is the accessible name.
const fieldProps = { id: 'string', accessibilityHidden: 'boolean' }
const fieldTypes = 'id?: string; accessibilityHidden?: boolean'

const same = (names) => names.map((name) => [name, name])

export const MInput = {
  props: {
    ...fieldProps,
    ...flexProps,
    width: 'dimension',
    label: 'string',
    value: 'string',
    onChange: 'string-handler',
    placeholder: 'string',
    helperText: 'string',
    error: 'string',
    type: 'string',
    multiline: 'boolean',
    rows: 'number',
    maxLength: 'number',
    disabled: 'boolean',
    readonly: 'boolean',
    icon: 'string',
    trailingIcon: 'string',
    trailingAction: ({ value, ctx, expr, record }) => ({
      expr: expr(value, ctx, record('InputAction')),
    }),
    onAction: 'handler',
    onSubmit: 'handler',
    onEscape: 'handler',
    ref: reference,
  },
  required: ['label', 'value', 'onChange'],
  control: true,
  types:
    () => `/** A field you can move focus to from an action: const titleRef = useRef<MavisFieldRef>(null). */
interface MavisFieldRef { focus(): void; blur(): void }
type InputAction = { icon: MavisIconName; label: string; disabled?: boolean }`,
  records: { InputAction: 'the Mavis input action' },
  declaration: `declare function MInput(props: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helperText?: string; error?: string; type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'tel'; multiline?: boolean; rows?: number; maxLength?: number; disabled?: boolean; readonly?: boolean; icon?: MavisIconName; trailingIcon?: MavisIconName; trailingAction?: InputAction; onAction?: () => void; onSubmit?: () => void; onEscape?: () => void; ref?: MavisFieldRef; width?: MavisDimension; grow?: number; shrink?: number; ${fieldTypes} }): JSX.Element`,
  check({ props, attrs, fail, isLiteral }) {
    // These choose the platform control, so they are fixed in the source.
    for (const fixed of ['type', 'multiline'])
      if (props[fixed] && !('lit' in props[fixed]) && !isLiteral(attrs.get(fixed)))
        fail(attrs.get(fixed), `${fixed} must be written as a literal value.`)
    const multiline = props.multiline && props.multiline.expr.value === true
    if (multiline && props.type && props.type.lit !== 'text')
      fail(attrs.get('type'), 'A multiline MInput is always type="text".')
    if (multiline && props.onSubmit)
      fail(
        attrs.get('onSubmit'),
        'Return adds a line in a multiline MInput; onSubmit needs a single-line field.',
      )
    if (props.rows && !multiline) fail(attrs.get('rows'), 'rows needs multiline.')
    if (props.trailingAction && props.trailingIcon)
      fail(attrs.get('trailingAction'), 'Use either trailingIcon or trailingAction on an input.')
  },
  focus: () => true,
  swift(node, context) {
    const { emit, indent } = context
    const ref = node.props.ref?.ref
    // Every field has a focus key: refs move focus to it, the focus border reads it.
    const key = ref ? swiftString(ref) : emit.focusKey('field')
    const type = node.props.type?.lit ?? 'text'
    return control(node, context, 'MavisTextInput', same(['label', 'value', 'onChange']), [
      `focus: $mavisFocus`,
      `focusKey: ${key}`,
      ...['placeholder', 'helperText', 'error']
        .filter((prop) => node.props[prop])
        .map((prop) => `${prop}: ${emit.value(node.props[prop])}`),
      ...(type === 'password' ? ['secure: true'] : []),
      ...(['email', 'url', 'tel'].includes(type) ? ['email: true'] : []),
      ...['icon', 'trailingIcon']
        .filter((prop) => node.props[prop])
        .map((prop) => `${prop}: ${swiftGlyphOf(node.props[prop], emit)}`),
      ...(node.props.trailingAction
        ? [
            `trailingAction: ({ (action: InputAction) in MavisInputAccessory(icon: action.icon, label: action.label, disabled: action.disabled ?? false) })(${emit.expr(node.props.trailingAction.expr)})`,
          ]
        : []),
      ...[
        'multiline',
        'rows',
        'maxLength',
        'disabled',
        'readonly',
        'onSubmit',
        'onEscape',
        'onAction',
      ]
        .filter((prop) => node.props[prop])
        .map((prop) =>
          'body' in node.props[prop]
            ? `${prop}: ${emit.handler(node.props[prop], indent + 4)}`
            : `${prop}: ${emit.value(node.props[prop])}`,
        ),
    ])
  },
  swiftRuntime({ theme, font, metric, scoped }) {
    const input = theme.components.input
    const radius = scoped
      ? 'mavisTheme.palette.metrics.input.radius'
      : typeof input.radius === 'number'
        ? input.radius
        : (theme.radius[input.radius] ?? theme.radius.md)
    const body = theme.typography.body
    const caption = theme.typography.caption
    return `/// One option of a select, a radio group or a segmented control, without the shared record
/// type so every project can use it.
struct MavisChoice: Hashable {
    let value: MavisChoiceValue
    let label: String
    let disabled: Bool
    var helperText: String = ""
}

func mavisValidateChoices(_ options: [MavisChoice], value: MavisChoiceValue? = nil) {
    precondition(value?.finite ?? true, "Choice values must be finite numbers or strings")
    var seen = Set<MavisChoiceValue>()
    for option in options {
        precondition(option.value.finite && !mavisTrim(option.label).isEmpty, "Each choice needs a finite value and nonempty label")
        precondition(seen.insert(option.value).inserted, "Choice values must be unique")
    }
}

extension MavisChoice {
    init(value: String, label: String, disabled: Bool = false, helperText: String = "") {
        self.init(value: .text(value), label: label, disabled: disabled, helperText: helperText)
    }
    init(value: Double, label: String, disabled: Bool = false, helperText: String = "") {
        self.init(value: .number(value), label: label, disabled: disabled, helperText: helperText)
    }
}

struct MavisInputAccessory {
    let icon: String
    let label: String
    let disabled: Bool
    init(icon: String, label: String, disabled: Bool) {
        precondition(!MavisIcons.glyph(icon).isEmpty && !label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, "An input action needs a valid icon and nonempty label")
        self.icon = icon
        self.label = label
        self.disabled = disabled
    }
}

private struct MavisFieldLabel: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let text: String
    var body: some View {
        // The control carries the label for assistive technology.
        Text(verbatim: text)
            .font(${font('caption')}.weight(.semibold))
            .foregroundStyle(MavisTokens.text)
            .accessibilityHidden(true)
    }
}

private struct MavisFieldMessage: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let text: String
    let error: Bool
    var body: some View {
        Text(verbatim: text)
            .font(${font('caption')})
            .foregroundStyle(error ? MavisTokens.danger : MavisTokens.muted)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("mavis-message:" + label)
    }
}

/// MInput: the value stays with the source; the field keeps a draft so maxLength and
/// readonly hold while typing, like the Web input.
struct MavisTextInput: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let value: String
    let onChange: (String) -> Void
    let focus: FocusState<String?>.Binding
    let focusKey: String
    let placeholder: String
    let helperText: String
    let error: String
    let secure: Bool
    let email: Bool
    let icon: String
    let trailingIcon: String
    let trailingAction: MavisInputAccessory?
    let multiline: Bool
    let rows: Double
    let maxLength: Double?
    let disabled: Bool
    let readonly: Bool
    let onSubmit: (() -> Void)?
    let onEscape: (() -> Void)?
    let onAction: (() -> Void)?
    let id: String
    @State private var draft: String
    // Values sent to the source that have not come back yet. Typing can run ahead of them.
    @State private var pending: [String] = []

    init(
        label: String,
        value: String,
        onChange: @escaping (String) -> Void,
        focus: FocusState<String?>.Binding,
        focusKey: String,
        placeholder: String = "",
        helperText: String = "",
        error: String = "",
        secure: Bool = false,
        email: Bool = false,
        icon: String = "",
        trailingIcon: String = "",
        trailingAction: MavisInputAccessory? = nil,
        multiline: Bool = false,
        rows: Double = 3,
        maxLength: Double? = nil,
        disabled: Bool = false,
        readonly: Bool = false,
        onSubmit: (() -> Void)? = nil,
        onEscape: (() -> Void)? = nil,
        onAction: (() -> Void)? = nil,
        id: String = ""
    ) {
        self.label = label
        self.value = value
        self.onChange = onChange
        self.focus = focus
        self.focusKey = focusKey
        self.placeholder = placeholder
        self.helperText = helperText
        self.error = error
        self.secure = secure
        self.email = email
        self.icon = icon
        self.trailingIcon = trailingIcon
        self.trailingAction = trailingAction
        self.multiline = multiline
        self.rows = rows
        self.maxLength = maxLength
        self.disabled = disabled
        self.readonly = readonly
        self.onSubmit = onSubmit
        self.onEscape = onEscape
        self.onAction = onAction
        self.id = id
        _draft = State(initialValue: value)
    }

    private var focused: Bool { focus.wrappedValue == focusKey }
    private var message: String { error.isEmpty ? helperText : error }
    private var border: MavisColor {
        !error.isEmpty ? MavisTokens.danger : focused ? MavisTokens.primary : MavisTokens.border
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${metric('space.sm')}) {
            MavisFieldLabel(text: label)
            editor
                // An icon sits inside the box, at the padding, and the text starts after it.
                .padding(.leading, icon.isEmpty ? 0 : ${iconSizes.md + 10})
                .padding(.trailing, trailingAction != nil ? 52 : trailingIcon.isEmpty ? 0 : ${iconSizes.md + 10})
                .overlay(alignment: multiline ? .topLeading : .leading) { adornment(icon) }
                .overlay(alignment: multiline ? .topTrailing : .trailing) {
                    if let action = trailingAction {
                        Button {
                            guard !disabled && !readonly && !action.disabled else { return }
                            onAction?()
                        } label: {
                            MavisIcon(action.icon, size: ${iconSizes.md})
                        }
                        .buttonStyle(MavisButtonStyle(variant: .ghost, iconOnly: true))
                        .frame(width: 48, height: 48)
                        .accessibilityLabel(Text(verbatim: action.label))
                        .disabled(disabled || readonly || action.disabled)
                        .padding(.trailing, 4)
                        .padding(.top, multiline ? 4 : 0)
                    } else { adornment(trailingIcon) }
                }
                .font(${scoped ? 'mavisTheme.palette.metrics.input.font' : font('body')})
${scoped ? '                .frame(minHeight: multiline ? nil : mavisTheme.palette.metrics.size("md").height)' : ''}
                .foregroundStyle(MavisTokens.text)
                .background(readonly ? MavisTokens.elevated : MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${radius}))
                // The border only draws. Left hit-testable, it takes clicks on the field's middle line.
                .overlay(RoundedRectangle(cornerRadius: ${radius}).strokeBorder(border, lineWidth: focused ? 2 : 1).allowsHitTesting(false))
                .focused(focus, equals: focusKey)
                .accessibilityLabel(Text(verbatim: label))
                .accessibilityIdentifier(id)
                .onKeyPress(.escape) {
                    guard let onEscape else { return .ignored }
                    onEscape()
                    return .handled
                }
            if !message.isEmpty {
                MavisFieldMessage(label: label, text: message, error: !error.isEmpty)
            }
        }
        .disabled(disabled)
        .opacity(disabled ? 0.5 : 1)
        .mavisColorScheme()
        .onChange(of: value) { _, next in
            if let index = pending.firstIndex(of: next) {
                pending.removeFirst(index + 1)
            } else {
                // Changed by the source itself: show its value.
                pending = []
                if next != draft { draft = next }
            }
        }
        .onChange(of: draft) { _, next in
            let allowed = readonly ? value : mavisLimit(next, maxLength)
            if allowed != next {
                draft = allowed
            } else if next != value && pending.last != next {
                pending.append(next)
                onChange(next)
            }
        }
    }

    @ViewBuilder private var editor: some View {
        if multiline {
            TextEditor(text: $draft)
                .scrollContentBackground(.hidden)
                .frame(minHeight: rows * ${scoped ? '(mavisTheme.palette.metrics.input.fontSize * mavisTheme.palette.metrics.input.lineHeight)' : body.fontSize * input.lineHeight})
                .padding(.horizontal, ${scoped ? '(mavisTheme.palette.metrics.input.paddingX - 5)' : input.paddingX - 5})
                .padding(.vertical, ${scoped ? '(mavisTheme.palette.metrics.input.paddingY - 4)' : input.paddingY - 4})
                .overlay(alignment: .topLeading) {
                    if draft.isEmpty && !placeholder.isEmpty {
                        Text(verbatim: placeholder)
                            .foregroundStyle(MavisTokens.muted)
                            .padding(.horizontal, ${scoped ? 'mavisTheme.palette.metrics.input.paddingX' : input.paddingX})
                            .padding(.vertical, ${scoped ? 'mavisTheme.palette.metrics.input.paddingY' : input.paddingY})
                            .allowsHitTesting(false)
                            .accessibilityHidden(true)
                    }
                }
        } else if secure {
            SecureField(text: $draft, prompt: prompt) { Text(verbatim: label) }
                .textFieldStyle(.plain)
                .labelsHidden()
                .onSubmit { onSubmit?() }
                .padding(.horizontal, ${scoped ? 'mavisTheme.palette.metrics.input.paddingX' : input.paddingX})
                .padding(.vertical, ${scoped ? 'mavisTheme.palette.metrics.input.paddingY' : input.paddingY})
        } else {
            TextField(text: $draft, prompt: prompt) { Text(verbatim: label) }
                .textFieldStyle(.plain)
                .labelsHidden()
                .autocorrectionDisabled(email)
                .onSubmit { onSubmit?() }
                .padding(.horizontal, ${scoped ? 'mavisTheme.palette.metrics.input.paddingX' : input.paddingX})
                .padding(.vertical, ${scoped ? 'mavisTheme.palette.metrics.input.paddingY' : input.paddingY})
        }
    }

    private var prompt: Text? {
        placeholder.isEmpty ? nil : Text(verbatim: placeholder).foregroundStyle(MavisTokens.muted)
    }

    /// icon and trailingIcon: decoration in the muted tone, or the danger tone with an error.
    @ViewBuilder private func adornment(_ glyph: String) -> some View {
        if !glyph.isEmpty {
            MavisIcon(glyph: glyph, size: ${iconSizes.md})
                .foregroundStyle(error.isEmpty ? MavisTokens.muted : MavisTokens.danger)
                .padding(.horizontal, ${scoped ? 'mavisTheme.palette.metrics.input.paddingX' : input.paddingX})
                .padding(.top, multiline ? ${scoped ? 'mavisTheme.palette.metrics.input.paddingY' : input.paddingY} : 0)
                .allowsHitTesting(false)
        }
    }
}`
  },
  vue: {
    types: ['InputAction'],
    rename: { value: 'modelValue', onChange: 'update:modelValue', onEscape: 'keydown.esc' },
    // Hardware keys only exist in the Web flavor.
    webOnly: ['onEscape'],
    // A Vue file runs on NativeScript as written, where a key modifier does not exist.
    source: { hidden: ['onEscape'] },
  },
}

export const MCheckbox = {
  props: {
    ...fieldProps,
    label: 'string',
    checked: 'boolean',
    onChange: 'boolean-handler',
    indeterminate: 'boolean',
    helperText: 'string',
    disabled: 'boolean',
  },
  required: ['label', 'checked', 'onChange'],
  control: true,
  declaration: `declare function MCheckbox(props: { label: string; checked: boolean; onChange: (checked: boolean) => void; indeterminate?: boolean; helperText?: string; disabled?: boolean; ${fieldTypes} }): JSX.Element`,
  swift: (node, context) =>
    control(
      node,
      context,
      'MavisCheckbox',
      same(['label', 'checked', 'onChange', 'indeterminate', 'helperText', 'disabled']),
    ),
  swiftRuntime({ theme, metric, font }) {
    const body = theme.typography.body
    return `/// MCheckbox: the system checkbox. A mixed checkbox turns on when clicked, as on the Web.
struct MavisCheckbox: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let checked: Bool
    let onChange: (Bool) -> Void
    var indeterminate: Bool = false
    var helperText: String = ""
    var disabled: Bool = false
    var id: String = ""

    private var sources: [Binding<Bool>] {
        let source = Binding(get: { indeterminate ? false : checked }, set: { onChange($0) })
        // Two sources that disagree draw the mixed state.
        return indeterminate ? [source, .constant(true)] : [source]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${metric('space.xs')}) {
            Toggle(sources: sources, isOn: \\.self) {
                Text(verbatim: label)
                    .font(${font('body')}.weight(.semibold))
                    .foregroundStyle(MavisTokens.text)
            }
            .toggleStyle(.checkbox)
            .mavisTint(.primary)
            .accessibilityIdentifier(id)
            if !helperText.isEmpty {
                MavisFieldMessage(label: label, text: helperText, error: false)
            }
        }
        .disabled(disabled)
        .mavisColorScheme()
    }
}`
  },
  vue: { rename: { checked: 'modelValue', onChange: 'update:modelValue' } },
}

// Selection events keep the declared value type; numeric choices are never stringified.
export const selectValueType = ({ type, T }) => {
  const value = type('value')
  return value?.k === 'optional' ? value.of : (value ?? T.choice)
}
export const selectChanged = (input) =>
  input.handler(input.value, [selectValueType(input)], input.ctx)
selectChanged.event = (input) => [selectValueType(input)]
selectChanged.ts = 'string | number'

export function selectOptions(input) {
  const { value, ctx, expr, record, fields, fail, T, ts } = input
  const selected = selectValueType(input)
  const name = {
    string: 'TextSelectOption',
    number: 'NumberSelectOption',
    choice: 'MixedSelectOption',
  }[selected.k]
  if (!name) fail(value, 'A selection is a string, number, or string | number, optionally missing.')
  const result = ts.isArrayLiteralExpression(value)
    ? expr(value, ctx, T.array(record(name)))
    : expr(value, ctx)
  if (result.type.k !== 'array' || result.type.of.k !== 'record')
    fail(value, 'Select options need a list of named records with value and label.')
  const members = fields(result.type.of.name)
  const choice = members.find((field) => field.name === 'value')?.type
  if (
    !choice ||
    !['string', 'number', 'choice'].includes(choice.k) ||
    (selected.k !== 'choice' && choice.k !== selected.k)
  )
    fail(
      value,
      'Select option values must match the selected string or number type; use string | number for mixed choices.',
    )
  if (members.find((field) => field.name === 'label')?.type.k !== 'string')
    fail(value, 'Select options need label: string.')
  for (const [name, type] of [
    ['helperText', 'string'],
    ['disabled', 'boolean'],
  ]) {
    const member = members.find((field) => field.name === name)?.type
    if (member && member.k !== type && !(member.k === 'optional' && member.of.k === type))
      fail(value, `Select option ${name} has the wrong type.`)
  }
  return { expr: result, choice, members }
}

export function swiftSelectValue(value, type) {
  if (type.k === 'optional') return `${value}.map { ${swiftSelectValue('$0', type.of)} }`
  return type.k === 'choice'
    ? value
    : `MavisChoiceValue.${type.k === 'number' ? 'number' : 'text'}(${value})`
}

export const MSelect = {
  typeImports: {
    '@getcortexlabs/mavis-core': ['ChoiceValue', 'ChoiceOption'],
  },
  props: {
    ...fieldProps,
    ...flexProps,
    width: 'dimension',
    label: 'string',
    value: ({ value, ctx, expr, type, T }) => ({
      expr: expr(value, ctx, T.optional(selectValueType({ type, T }))),
    }),
    options: selectOptions,
    onChange: selectChanged,
    placeholder: 'string',
    helperText: 'string',
    error: 'string',
    disabled: 'boolean',
  },
  required: ['label', 'value', 'options', 'onChange'],
  control: true,
  types:
    () => `/** ChoiceOption of the Mavis core, with distinct string and number values: what MSelect, MRadioGroup and MSegmentedControl choose from. */
type SelectOption = { value: string | number; label: string; helperText?: string; disabled?: boolean }
type ChoiceOption = SelectOption
type SegmentedOption = SelectOption
type ChoiceValue = string | number
type TextSelectOption = { value: string; label: string; helperText?: string; disabled?: boolean }
type NumberSelectOption = { value: number; label: string; helperText?: string; disabled?: boolean }
type MixedSelectOption = { value: string | number; label: string; helperText?: string; disabled?: boolean }`,
  records: {
    SelectOption: 'the Mavis option type',
    TextSelectOption: 'text select options',
    NumberSelectOption: 'numeric select options',
    MixedSelectOption: 'mixed select options',
  },
  declaration: `declare function MSelect<T extends string | number>(props: { label: string; value: T | null | undefined; options: readonly { value: T; label: string; helperText?: string; disabled?: boolean }[]; onChange: (value: T) => void; placeholder?: string; helperText?: string; error?: string; disabled?: boolean; width?: MavisDimension; grow?: number; shrink?: number; ${fieldTypes} }): JSX.Element`,
  swift(node, { emit, indent }) {
    const pad = ' '.repeat(indent)
    const { value, options, onChange } = node.props
    const members = options.members
    const member = (name, fallback) => {
      const type = members.find((field) => field.name === name)?.type
      return type ? `option.${name}${type.k === 'optional' ? ` ?? ${fallback}` : ''}` : fallback
    }
    const optionsText = `${emit.wrap(options.expr)}.map { option in MavisChoice(value: ${swiftSelectValue('option.value', options.choice)}, label: option.label, disabled: ${member('disabled', 'false')}, helperText: ${member('helperText', '\"\"')}) }`
    const chosen = value.expr.type.k === 'optional' ? value.expr.type.of : value.expr.type
    const handler = emit.handler(onChange, indent + 4)
    const args = [
      `label: ${emit.value(node.props.label)}`,
      `value: ${swiftSelectValue(emit.wrap(value.expr), value.expr.type)}`,
      `options: ${optionsText}`,
      `onChange: ${chosen.k === 'choice' ? handler : `mavisSelect${chosen.k === 'number' ? 'Number' : 'Text'}(${handler})`}`,
      ...['placeholder', 'helperText', 'error', 'disabled', 'id']
        .filter((key) => node.props[key])
        .map((key) => `${key}: ${emit.value(node.props[key])}`),
    ]
    return [
      `${pad}MavisSelect(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
      ...accessibility({ accessibilityHidden: node.props.accessibilityHidden }, { emit, indent }),
      ...flexItem(node.props, { emit, indent }),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    metric,
    font,
  }) => `/// MSelect: a menu picker. With no value it shows the placeholder as an explicit empty choice.
func mavisSelectText(_ action: @escaping (String) -> Void) -> (MavisChoiceValue) -> Void {
    { choice in if case .text(let value) = choice { action(value) } }
}
func mavisSelectNumber(_ action: @escaping (Double) -> Void) -> (MavisChoiceValue) -> Void {
    { choice in if case .number(let value) = choice { action(value) } }
}
struct MavisSelect: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let value: MavisChoiceValue?
    let options: [MavisChoice]
    let onChange: (MavisChoiceValue) -> Void
    var placeholder: String = "Select an option"
    var helperText: String = ""
    var error: String = ""
    var disabled: Bool = false
    var id: String = ""

    private var selected: MavisChoiceValue? {
        options.contains { $0.value == value } ? value : nil
    }
    private var message: String { error.isEmpty ? helperText : error }

    var body: some View {
        let _ = mavisValidateChoices(options, value: value)
        VStack(alignment: .leading, spacing: ${metric('space.sm')}) {
            MavisFieldLabel(text: label)
            Picker(selection: Binding(get: { selected }, set: { next in
                if let next, next != value, options.contains(where: { $0.value == next && !$0.disabled }) {
                    onChange(next)
                }
            })) {
                if selected == nil {
                    Text(verbatim: placeholder).tag(MavisChoiceValue?.none)
                }
                ForEach(options, id: \\.value) { option in
                    Text(verbatim: option.label)
                        .tag(Optional(option.value))
                        .disabled(option.disabled)
                }
            } label: {
                Text(verbatim: label)
            }
            .pickerStyle(.menu)
            .labelsHidden()
            .mavisTint(.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityIdentifier(id)
            if !message.isEmpty {
                MavisFieldMessage(label: label, text: message, error: !error.isEmpty)
            }
        }
        .disabled(disabled)
        .mavisColorScheme()
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    attribute(name, value) {
      if (name === 'onChange' && value.params.some((param) => !param.unused)) {
        const kind = value.params[0].type.k
        const call = `(${handlerJs(value)})(choice)`
        return `@update:modelValue="${expression(`(choice: string | number) => { ${kind === 'choice' ? call : `if (typeof choice === '${kind}') ${call}`} }`)}"`
      }
      // MSelect takes null for no choice; the source writes undefined.
      if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
    },
  },
}
