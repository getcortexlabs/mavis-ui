// MInput, MCheckbox and MSelect: controlled fields that share a label and a message on the Mac.
import { expression, handlerJs, js } from '../js-text.mjs'
import { swiftString } from '../swift-text.mjs'
import { iconSizes, swiftGlyphOf } from './icon.mjs'
import { accessibility } from './shared.mjs'

function reference({ value, attribute, ctx, fail, ts }) {
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

const options = ({ value, ctx, expr, record, T }) => ({
  expr: expr(value, ctx, T.array(record('SelectOption'))),
})

// Arguments in the helper's declaration order; Swift requires it for defaulted parameters.
function control(node, { emit, indent }, name, order, extra = []) {
  const pad = ' '.repeat(indent)
  const args = []
  for (const [prop, label] of order) {
    const value = node.props[prop]
    if (!value) continue
    if ('body' in value) args.push(`${label}: ${emit.handler(value, indent + 4)}`)
    else if (prop === 'options')
      args.push(
        `${label}: ${emit.wrap(value.expr)}.map { option in MavisChoice(value: option.value, label: option.label, disabled: option.disabled ?? false) }`,
      )
    else args.push(`${label}: ${emit.value(value)}`)
  }
  args.push(...extra)
  // The control puts the identifier on its editor, checkbox or menu, where the Web puts the id.
  if (node.props.id) args.push(`id: ${emit.value(node.props.id)}`)
  return [
    `${pad}${name}(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
    ...accessibility({ accessibilityHidden: node.props.accessibilityHidden }, { emit, indent }),
  ].join('\n')
}

// The contracts of the three fields share these: the label is the accessible name.
const fieldProps = { id: 'string', accessibilityHidden: 'boolean' }
const fieldTypes = 'id?: string; accessibilityHidden?: boolean'

const same = (names) => names.map((name) => [name, name])

export const MInput = {
  props: {
    ...fieldProps,
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
    onSubmit: 'handler',
    onEscape: 'handler',
    ref: reference,
  },
  required: ['label', 'value', 'onChange'],
  control: true,
  types:
    () => `/** A field you can move focus to from an action: const titleRef = useRef<MavisFieldRef>(null). */
interface MavisFieldRef { focus(): void; blur(): void }`,
  declaration: `declare function MInput(props: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helperText?: string; error?: string; type?: 'text' | 'email' | 'password'; multiline?: boolean; rows?: number; maxLength?: number; disabled?: boolean; readonly?: boolean; icon?: MavisIconName; trailingIcon?: MavisIconName; onSubmit?: () => void; onEscape?: () => void; ref?: MavisFieldRef; ${fieldTypes} }): JSX.Element`,
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
      ...(type === 'email' ? ['email: true'] : []),
      ...['icon', 'trailingIcon']
        .filter((prop) => node.props[prop])
        .map((prop) => `${prop}: ${swiftGlyphOf(node.props[prop], emit)}`),
      ...['multiline', 'rows', 'maxLength', 'disabled', 'readonly', 'onSubmit', 'onEscape']
        .filter((prop) => node.props[prop])
        .map((prop) =>
          'body' in node.props[prop]
            ? `${prop}: ${emit.handler(node.props[prop], indent + 4)}`
            : `${prop}: ${emit.value(node.props[prop])}`,
        ),
    ])
  },
  swiftRuntime({ theme, font }) {
    const input = theme.components.input
    const radius = theme.radius[input.radius] ?? theme.radius.md
    const body = theme.typography.body
    const caption = theme.typography.caption
    return `/// One MSelect option, without the shared record type so every project can use it.
struct MavisChoice: Hashable {
    let value: String
    let label: String
    let disabled: Bool
}

private struct MavisFieldLabel: View {
    let text: String
    var body: some View {
        // The control carries the label for assistive technology.
        Text(verbatim: text)
            .font(.system(size: ${caption.fontSize}, weight: .semibold))
            .foregroundStyle(MavisTokens.text)
            .accessibilityHidden(true)
    }
}

private struct MavisFieldMessage: View {
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
    let multiline: Bool
    let rows: Double
    let maxLength: Double?
    let disabled: Bool
    let readonly: Bool
    let onSubmit: (() -> Void)?
    let onEscape: (() -> Void)?
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
        multiline: Bool = false,
        rows: Double = 3,
        maxLength: Double? = nil,
        disabled: Bool = false,
        readonly: Bool = false,
        onSubmit: (() -> Void)? = nil,
        onEscape: (() -> Void)? = nil,
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
        self.multiline = multiline
        self.rows = rows
        self.maxLength = maxLength
        self.disabled = disabled
        self.readonly = readonly
        self.onSubmit = onSubmit
        self.onEscape = onEscape
        self.id = id
        _draft = State(initialValue: value)
    }

    private var focused: Bool { focus.wrappedValue == focusKey }
    private var message: String { error.isEmpty ? helperText : error }
    private var border: MavisColor {
        !error.isEmpty ? MavisTokens.danger : focused ? MavisTokens.primary : MavisTokens.border
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.sm}) {
            MavisFieldLabel(text: label)
            editor
                // An icon sits inside the box, at the padding, and the text starts after it.
                .padding(.leading, icon.isEmpty ? 0 : ${iconSizes.md + 10})
                .padding(.trailing, trailingIcon.isEmpty ? 0 : ${iconSizes.md + 10})
                .overlay(alignment: multiline ? .topLeading : .leading) { adornment(icon) }
                .overlay(alignment: multiline ? .topTrailing : .trailing) { adornment(trailingIcon) }
                .font(${font('body')})
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
                .frame(minHeight: rows * ${body.fontSize * input.lineHeight})
                .padding(.horizontal, ${input.paddingX - 5})
                .padding(.vertical, ${input.paddingY - 4})
                .overlay(alignment: .topLeading) {
                    if draft.isEmpty && !placeholder.isEmpty {
                        Text(verbatim: placeholder)
                            .foregroundStyle(MavisTokens.muted)
                            .padding(.horizontal, ${input.paddingX})
                            .padding(.vertical, ${input.paddingY})
                            .allowsHitTesting(false)
                            .accessibilityHidden(true)
                    }
                }
        } else if secure {
            SecureField(text: $draft, prompt: prompt) { Text(verbatim: label) }
                .textFieldStyle(.plain)
                .labelsHidden()
                .onSubmit { onSubmit?() }
                .padding(.horizontal, ${input.paddingX})
                .padding(.vertical, ${input.paddingY})
        } else {
            TextField(text: $draft, prompt: prompt) { Text(verbatim: label) }
                .textFieldStyle(.plain)
                .labelsHidden()
                .autocorrectionDisabled(email)
                .onSubmit { onSubmit?() }
                .padding(.horizontal, ${input.paddingX})
                .padding(.vertical, ${input.paddingY})
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
                .padding(.horizontal, ${input.paddingX})
                .padding(.top, multiline ? ${input.paddingY} : 0)
                .allowsHitTesting(false)
        }
    }
}`
  },
  vue: {
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
  swiftRuntime({ theme }) {
    const body = theme.typography.body
    return `/// MCheckbox: the system checkbox. A mixed checkbox turns on when clicked, as on the Web.
struct MavisCheckbox: View {
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
        VStack(alignment: .leading, spacing: ${theme.space.xs}) {
            Toggle(sources: sources, isOn: \\.self) {
                Text(verbatim: label)
                    .font(.system(size: ${body.fontSize}, weight: .semibold))
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

export const MSelect = {
  props: {
    ...fieldProps,
    label: 'string',
    value: 'optional-string',
    options,
    onChange: 'string-handler',
    placeholder: 'string',
    helperText: 'string',
    error: 'string',
    disabled: 'boolean',
  },
  required: ['label', 'value', 'options', 'onChange'],
  control: true,
  types: () => 'type SelectOption = { value: string; label: string; disabled?: boolean }',
  records: { SelectOption: 'the Mavis option type' },
  declaration: `declare function MSelect(props: { label: string; value: string | undefined; options: SelectOption[]; onChange: (value: string) => void; placeholder?: string; helperText?: string; error?: string; disabled?: boolean; ${fieldTypes} }): JSX.Element`,
  swift: (node, context) =>
    control(
      node,
      context,
      'MavisSelect',
      same([
        'label',
        'value',
        'options',
        'onChange',
        'placeholder',
        'helperText',
        'error',
        'disabled',
      ]),
    ),
  swiftRuntime: ({
    theme,
  }) => `/// MSelect: a menu picker. With no value it shows the placeholder as an explicit empty choice.
struct MavisSelect: View {
    let label: String
    let value: String?
    let options: [MavisChoice]
    let onChange: (String) -> Void
    var placeholder: String = "Select an option"
    var helperText: String = ""
    var error: String = ""
    var disabled: Bool = false
    var id: String = ""

    private var selected: String? {
        options.contains { $0.value == value } ? value : nil
    }
    private var message: String { error.isEmpty ? helperText : error }

    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.sm}) {
            MavisFieldLabel(text: label)
            Picker(selection: Binding(get: { selected }, set: { next in
                if let next, next != value, options.contains(where: { $0.value == next && !$0.disabled }) {
                    onChange(next)
                }
            })) {
                if selected == nil {
                    Text(verbatim: placeholder).tag(String?.none)
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
            .fixedSize()
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
      // MSelect reports string or number choices; these options are strings.
      if (name === 'onChange' && value.params.some((param) => !param.unused))
        return `@update:modelValue="${expression(`(choice) => (${handlerJs(value)})(String(choice))`)}"`
      // MSelect takes null for no choice; the source writes undefined.
      if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
    },
  },
}
