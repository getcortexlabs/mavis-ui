import { expression, handlerJs, js } from '../js-text.mjs'
import { nameProblem } from '../model.mjs'
import { flexRuntime } from './flex.mjs'
import { swiftIcon } from './icon.mjs'
import { accessibility, flexItem } from './shared.mjs'
import { bounded, choiceRuntime, event, swiftCall, swiftRecord } from './choices.mjs'

const labels = [
  'placeholder',
  'clearLabel',
  'closeLabel',
  'loadingText',
  'emptyText',
  'searchErrorText',
  'retryLabel',
  'idleText',
  'limitedText',
]

const waits =
  'A search that waits for a service needs asynchronous functions on the Mac (#340); until then write it in place over values of the screen, for example async (query) => state.cities.filter((city) => city.label.toLowerCase().includes(query.toLowerCase())).'

// search: the function the field asks for the options of a query. The contract's is asynchronous
// and takes a context to cancel a request; the Mac takes the one a screen can answer at once:
// an arrow function of the query, written in place, whose result is the options.
function search({ attribute, value, ctx, expr, fail, record, T, ts }) {
  if (!ts.isArrowFunction(value)) fail(attribute, `search is a function of the query. ${waits}`)
  if (value.parameters.length > 1)
    fail(
      value.parameters[1],
      `search takes the query on the Mac: the context of a request belongs to a search that waits. ${waits}`,
    )
  const [parameter] = value.parameters
  if (
    parameter &&
    (!ts.isIdentifier(parameter.name) || parameter.initializer || parameter.dotDotDotToken)
  )
    fail(parameter, 'Name the query with a simple parameter: (query) => ….')
  if (parameter && nameProblem(parameter.name.text))
    fail(parameter, `Parameter ${parameter.name.text} ${nameProblem(parameter.name.text)}`)
  const isAsync = value.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)
  let result = value.body
  while (ts.isParenthesizedExpression(result)) result = result.expression
  if (ts.isBlock(result))
    fail(
      result,
      `search returns the options as one expression: (query) => …, without braces. ${waits}`,
    )
  if (ts.isAwaitExpression(result)) fail(result, waits)
  if (!isAsync) {
    const resolved =
      ts.isCallExpression(result) &&
      result.expression.getText() === 'Promise.resolve' &&
      result.arguments.length === 1
    if (!resolved)
      fail(
        value,
        'search answers with a promise: write async (query) => options, or (query) => Promise.resolve(options).',
      )
    result = result.arguments[0]
  }
  const inner = { ...ctx, mode: 'pure', locals: new Map(ctx.locals) }
  if (parameter) inner.locals.set(parameter.name.text, T.string)
  return {
    expr: expr(result, inner, T.array(record('SelectOption'))),
    param: parameter?.name.text ?? null,
  }
}

const absent = ({ value, ctx, expr, T }) => ({ expr: expr(value, ctx, T.optional(T.string)) })
const option = ({ value, ctx, expr, record, T }) => ({
  expr: expr(value, ctx, T.optional(record('SelectOption'))),
})
const snapshot = ({ value, ctx, expr, record }) => ({
  expr: expr(value, ctx, record('ComboboxSnapshot')),
})
const whole = (key, least, most) =>
  bounded(
    key,
    (value) => Number.isInteger(value) && value >= least && value <= most,
    `is a whole number from ${least} to ${most}.`,
  )

// A SelectOption of the source from one of the control's choices, whatever fields the record has.
const swiftOption = (emit) =>
  swiftRecord(emit, 'SelectOption', {
    value: '$0.value',
    label: '$0.label',
    disabled: '$0.disabled',
  })

// comboboxProps: a field that searches as its text changes. query is the text and value the chosen
// option's value, and both belong to the source: typing asks for the next query, choosing an
// option for the next value and its label as the query. search answers each query with a page of
// options; the arrow keys move a highlight through them, Return chooses it and Escape puts the
// chosen label back.
export const MCombobox = {
  props: {
    id: 'string',
    label: 'string',
    value: absent,
    onChange: event(({ T }) => [T.optional(T.string)], 'string | null'),
    query: 'string',
    onQueryChange: 'string-handler',
    selectedOption: option,
    search,
    initialResults: snapshot,
    debounce: whole('debounce', 0, 60000),
    minQueryLength: whole('minQueryLength', 0, 1000),
    maxResults: whole('maxResults', 1, 100),
    ...Object.fromEntries(labels.map((key) => [key, 'string'])),
    helperText: 'string',
    error: 'string',
    disabled: 'boolean',
    clearable: 'boolean',
    onSelect: event(({ T, record }) => [T.optional(record('SelectOption'))], 'SelectOption | null'),
    onFocus: 'handler',
    onBlur: 'handler',
    width: 'dimension',
    grow: 'factor',
    shrink: 'factor',
    accessibilityHidden: 'boolean',
  },
  required: ['label', 'value', 'onChange', 'query', 'onQueryChange', 'search'],
  control: true,
  focus: () => true,
  uses: [flexRuntime, choiceRuntime],
  records: { ComboboxSnapshot: 'the Mavis combobox results type' },
  // T is the value's type, which says how the source writes "nothing chosen": undefined in a TSX
  // file, null in a Vue file. The listeners hear the same.
  types: () =>
    `/** The options a search already answered a query with: MCombobox starts from them. */
type ComboboxSnapshot = { query: string; options: SelectOption[] }
type MavisComboboxNone<T> = null extends T ? null : undefined`,
  declaration: `declare function MCombobox<T>(props: MavisFlexItem & { id?: string; label: string; value: T & (string | null | undefined); onChange: (value: string | MavisComboboxNone<T>) => void; query: string; onQueryChange: (query: string) => void; selectedOption?: SelectOption | null; search: (query: string, context: { readonly requestId: number; readonly limit: number; onCancel(cleanup: () => void): void }) => Promise<readonly SelectOption[]>; initialResults?: ComboboxSnapshot; debounce?: number; minQueryLength?: number; maxResults?: number; ${labels.map((key) => `${key}?: string`).join('; ')}; helperText?: string; error?: string; disabled?: boolean; clearable?: boolean; onSelect?: (option: SelectOption | MavisComboboxNone<T>) => void; onFocus?: () => void; onBlur?: () => void; width?: MavisDimension; accessibilityHidden?: boolean }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const props = node.props
    const pad = ' '.repeat(indent + 4)
    const choice = 'MavisChoice(value: $0.value, label: $0.label, disabled: $0.disabled ?? false)'
    const handler = (key) => `${key}: ${emit.handler(props[key], indent + 4)}`
    const args = [
      `label: ${emit.value(props.label)}`,
      `value: ${emit.expr(props.value.expr)}`,
      handler('onChange'),
      `query: ${emit.value(props.query)}`,
      handler('onQueryChange'),
      `search: { (${props.search.param ?? '_'}: String) -> [MavisChoice] in\n${pad}    ${emit.wrap(props.search.expr)}.map { ${choice} }\n${pad}}`,
      `focus: $mavisFocus`,
      `focusKey: ${emit.focusKey('combobox')}`,
      ...(props.selectedOption
        ? [`selectedOption: ${emit.wrap(props.selectedOption.expr)}.map { ${choice} }`]
        : []),
      ...(props.initialResults
        ? [
            `initialResults: { (mavisPage: ComboboxSnapshot) in (mavisPage.query, mavisPage.options.map { ${choice} }) }(${emit.expr(props.initialResults.expr)})`,
          ]
        : []),
      ...['debounce', 'minQueryLength', 'maxResults'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.expr(props[key].expr)}`] : [],
      ),
      ...[...labels, 'helperText', 'error', 'disabled', 'clearable'].flatMap((key) =>
        props[key] ? [`${key}: ${emit.value(props[key])}`] : [],
      ),
      ...(props.onSelect
        ? [
            `onSelect: { mavisChoice in\n${pad}    let mavisSelect = ${emit.handler(props.onSelect, indent + 8)}\n${pad}    mavisSelect(mavisChoice.map { ${swiftOption(emit)} })\n${pad}}`,
          ]
        : []),
      ...['onFocus', 'onBlur'].flatMap((key) => (props[key] ? [handler(key)] : [])),
      ...(props.id ? [`identifier: ${emit.value(props.id)}`] : []),
    ]
    return [
      swiftCall('MavisCombobox', args, indent),
      ...accessibility({ accessibilityHidden: props.accessibilityHidden }, context),
      ...flexItem(props, context),
    ].join('\n')
  },
  swiftRuntime({ theme, font }) {
    const input = theme.components.input
    const radius = theme.radius[input.radius] ?? theme.radius.md
    return `/// One page of results, as createComboboxSearch in the Mavis core publishes it.
private struct MavisComboboxPage: Equatable {
    var query = ""
    var status = "idle"
    var options: [MavisChoice] = []
    var limited = false

    init(query: String = "", status: String = "idle") {
        self.query = query
        self.status = status
    }

    /// What a search answered: at most limit options, and whether there were more.
    init(query: String, options: [MavisChoice], limit: Double) {
        let most = Int(Swift.max(1, limit))
        self.query = query
        self.status = options.isEmpty ? "empty" : "success"
        self.options = Array(options.prefix(most))
        self.limited = options.count > most
    }
}

/// MCombobox: a field whose text is the query and a list of the options search answers with, open
/// under it while it has the focus. The query and the value belong to the source. The arrow keys
/// move the highlight among the options that can be chosen, Return chooses it, Escape puts the
/// chosen label back; a click chooses too. useCombobox in the Mavis core, with a search that
/// answers at once.
struct MavisCombobox: View {
    let label: String
    let value: String?
    let onChange: (String?) -> Void
    let query: String
    let onQueryChange: (String) -> Void
    let search: (String) -> [MavisChoice]
    let focus: FocusState<String?>.Binding
    let focusKey: String
    let selectedOption: MavisChoice?
    let debounce: Double
    let minQueryLength: Double
    let maxResults: Double
    let placeholder: String
    let clearLabel: String
    let closeLabel: String
    let loadingText: String
    let emptyText: String
    let searchErrorText: String
    let retryLabel: String
    let idleText: String
    let limitedText: String
    let helperText: String
    let error: String
    let disabled: Bool
    let clearable: Bool
    let onSelect: (MavisChoice?) -> Void
    let onFocus: () -> Void
    let onBlur: () -> Void
    let identifier: String
    @State private var draft: String
    // Queries sent to the source that have not come back yet. Typing can run ahead of them.
    @State private var pending: [String] = []
    @State private var open = false
    @State private var active: String?
    @State private var page: MavisComboboxPage
    @State private var cached: MavisComboboxPage?
    @State private var retained: MavisChoice?
    @State private var chosen: MavisChoice?
    @State private var waiting: Task<Void, Never>?

    init(
        label: String,
        value: String?,
        onChange: @escaping (String?) -> Void,
        query: String,
        onQueryChange: @escaping (String) -> Void,
        search: @escaping (String) -> [MavisChoice],
        focus: FocusState<String?>.Binding,
        focusKey: String,
        selectedOption: MavisChoice? = nil,
        initialResults: (query: String, options: [MavisChoice])? = nil,
        debounce: Double = 200,
        minQueryLength: Double = 1,
        maxResults: Double = 50,
        placeholder: String = "Search options",
        clearLabel: String = "Clear selection",
        closeLabel: String = "Close results",
        loadingText: String = "Searching…",
        emptyText: String = "No results",
        searchErrorText: String = "Could not load results.",
        retryLabel: String = "Try again",
        idleText: String = "Type to search.",
        limitedText: String = "Refine your search to see more results.",
        helperText: String = "",
        error: String = "",
        disabled: Bool = false,
        clearable: Bool = true,
        onSelect: @escaping (MavisChoice?) -> Void = { _ in },
        onFocus: @escaping () -> Void = {},
        onBlur: @escaping () -> Void = {},
        identifier: String = ""
    ) {
        self.label = label
        self.value = value
        self.onChange = onChange
        self.query = query
        self.onQueryChange = onQueryChange
        self.search = search
        self.focus = focus
        self.focusKey = focusKey
        self.selectedOption = selectedOption
        self.debounce = debounce
        self.minQueryLength = minQueryLength
        self.maxResults = maxResults
        self.placeholder = placeholder
        self.clearLabel = clearLabel
        self.closeLabel = closeLabel
        self.loadingText = loadingText
        self.emptyText = emptyText
        self.searchErrorText = searchErrorText
        self.retryLabel = retryLabel
        self.idleText = idleText
        self.limitedText = limitedText
        self.helperText = helperText
        self.error = error
        self.disabled = disabled
        self.clearable = clearable
        self.onSelect = onSelect
        self.onFocus = onFocus
        self.onBlur = onBlur
        self.identifier = identifier
        _draft = State(initialValue: query)
        _retained = State(initialValue: selectedOption)
        // The page a search already answered is the first state, and the first answer it keeps.
        let first = initialResults.map { MavisComboboxPage(query: $0.query, options: $0.options, limit: maxResults) }
        _page = State(initialValue: first ?? MavisComboboxPage())
        _cached = State(initialValue: first)
    }

    private var focused: Bool { focus.wrappedValue == focusKey }
    private var message: String { error.isEmpty ? helperText : error }
    private var clears: Bool { clearable && (!query.isEmpty || value != nil) }
    private var border: MavisColor {
        !error.isEmpty ? MavisTokens.danger : focused ? MavisTokens.primary : MavisTokens.border
    }

    /// comboboxSelected in the Mavis core: the chosen option among the results, or the one the
    /// source or the last choice named for this value.
    private var selected: MavisChoice? {
        guard let value else { return nil }
        if let found = page.options.first(where: { $0.value == value }) { return found }
        for known in [selectedOption, chosen, retained] {
            if let known, known.value == value { return known }
        }
        return nil
    }

    private var status: String {
        switch page.status {
        case "loading", "debouncing": return loadingText
        case "empty": return emptyText
        case "idle": return idleText
        default: return page.limited ? limitedText : ""
        }
    }

    private func publish(_ next: MavisComboboxPage) {
        page = next
        // comboboxHighlight: the highlight stays while its option can still be chosen.
        if !next.options.contains(where: { !$0.disabled && $0.value == active }) { active = nil }
        if let found = selected { retained = found }
    }

    private func invalidate() {
        waiting?.cancel()
        waiting = nil
    }

    private func answer(_ query: String) {
        let next = MavisComboboxPage(query: query, options: search(query), limit: maxResults)
        cached = next
        publish(next)
    }

    private func request(_ query: String) {
        invalidate()
        if let cached, cached.query == query { return publish(cached) }
        guard Double(mavisTrim(query).utf16.count) >= minQueryLength else {
            return publish(MavisComboboxPage(query: query))
        }
        guard debounce > 0 else { return answer(query) }
        publish(MavisComboboxPage(query: query, status: "debouncing"))
        waiting = Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(debounce * 1_000_000))
            guard !Task.isCancelled else { return }
            waiting = nil
            answer(query)
        }
    }

    private func show() {
        guard !disabled else { return }
        open = true
        request(query)
    }

    private func close() {
        open = false
        active = nil
        invalidate()
        if page.status == "debouncing" { publish(MavisComboboxPage(query: page.query)) }
    }

    private func edit(_ text: String) {
        guard !disabled else { return }
        invalidate()
        active = nil
        open = true
        if text == query { request(text) } else { onQueryChange(text) }
    }

    private func choose(_ option: MavisChoice) {
        guard open, !disabled, let current = page.options.first(where: { $0.value == option.value }), !current.disabled else { return }
        chosen = current
        if value != current.value { onChange(current.value) }
        onQueryChange(current.label)
        onSelect(current)
        close()
    }

    private func clear() {
        guard !disabled else { return }
        close()
        onChange(nil)
        onQueryChange("")
        onSelect(nil)
        focus.wrappedValue = focusKey
    }

    private func cancel() {
        close()
        onQueryChange(selected?.label ?? "")
    }

    /// comboboxMove in the Mavis core: the next option that can be chosen, without going around.
    private func move(_ direction: Int) {
        if !open { show() }
        let available = page.options.filter { !$0.disabled }
        guard !available.isEmpty else { return active = nil }
        guard let index = available.firstIndex(where: { $0.value == active }) else {
            return active = (direction > 0 ? available.first : available.last)?.value
        }
        active = available[Swift.max(0, Swift.min(available.count - 1, index + direction))].value
    }

    private func commit() {
        if let option = page.options.first(where: { $0.value == active }) { choose(option) }
    }

    private func key(_ press: KeyPress) -> KeyPress.Result {
        guard !disabled, press.modifiers.isDisjoint(with: [.option, .control, .command]) else { return .ignored }
        switch press.key {
        case .downArrow: move(1)
        case .upArrow: move(-1)
        case .escape where open: cancel()
        default: return .ignored
        }
        return .handled
    }

    private func row(_ option: MavisChoice) -> some View {
        let highlighted = active == option.value
        return Button(action: { choose(option) }) {
            HStack(spacing: 12) {
                Text(verbatim: option.label)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if value == option.value {
                    ${swiftIcon('check', 20)}
                        .foregroundStyle(MavisTokens.primary)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
            .background(highlighted ? MavisTokens.primarySoft : MavisColor.clear, in: RoundedRectangle(cornerRadius: ${theme.radius.sm}))
            .overlay(RoundedRectangle(cornerRadius: ${theme.radius.sm}).strokeBorder(highlighted ? MavisTokens.primary : MavisColor.clear, lineWidth: 2).allowsHitTesting(false))
            .contentShape(RoundedRectangle(cornerRadius: ${theme.radius.sm}))
        }
        .buttonStyle(.plain)
        .disabled(option.disabled)
        .opacity(option.disabled ? 0.45 : 1)
        .accessibilityLabel(Text(verbatim: option.label))
        .accessibilityAddTraits(highlighted ? .isSelected : [])
    }

    var body: some View {
        let selected = selected
        MavisColumn(spacing: ${theme.space.sm}) {
            MavisFieldLabel(text: label)
            HStack(spacing: 0) {
                TextField(text: $draft, prompt: placeholder.isEmpty ? nil : Text(verbatim: placeholder).foregroundStyle(MavisTokens.muted)) { Text(verbatim: label) }
                    .textFieldStyle(.plain)
                    .labelsHidden()
                    .autocorrectionDisabled(true)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.text)
                    .focused(focus, equals: focusKey)
                    .onKeyPress(action: key)
                    .onSubmit { commit() }
                    .accessibilityLabel(Text(verbatim: label))
                    .accessibilityIdentifier(identifier)
                    .padding(.leading, ${input.paddingX})
                    .padding(.trailing, clears ? 0 : ${input.paddingX})
                    .padding(.vertical, ${input.paddingY})
                if clears {
                    Button(action: clear) {
                        ${swiftIcon('x', 20)}
                            .frame(width: 48, height: 48)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(MavisTokens.text)
                    .accessibilityLabel(Text(verbatim: clearLabel))
                    .padding(.trailing, 4)
                }
            }
            .frame(minHeight: 56)
            .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${radius}))
            .overlay(RoundedRectangle(cornerRadius: ${radius}).strokeBorder(border, lineWidth: focused ? 2 : 1).allowsHitTesting(false))
            if !message.isEmpty {
                MavisFieldMessage(label: label, text: message, error: !error.isEmpty)
            }
            if let selected, query != selected.label {
                Text(verbatim: selected.label)
                    .font(${font('caption')})
                    .foregroundStyle(MavisTokens.primary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            MavisSelectionPanel(title: label, open: open && !disabled, spacing: 0, padding: 4) {
                ForEach(page.options, id: \\.value) { option in row(option) }
                if !status.isEmpty {
                    Text(verbatim: status)
                        .font(${font('caption')})
                        .foregroundStyle(MavisTokens.muted)
                        .padding(12)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .disabled(disabled)
        .opacity(disabled ? 0.5 : 1)
        .mavisColorScheme()
        .onChange(of: query) { _, next in
            if let index = pending.firstIndex(of: next) {
                pending.removeFirst(index + 1)
            } else {
                pending = []
                if next != draft { draft = next }
            }
            if open { request(next) } else { invalidate() }
        }
        .onChange(of: draft) { _, next in
            if next != query && pending.last != next {
                pending.append(next)
                edit(next)
            }
        }
        .onChange(of: focused) { _, now in
            if now {
                show()
                onFocus()
            } else {
                close()
                onBlur()
            }
        }
        .onChange(of: value) { _, next in
            if next == nil {
                retained = nil
                chosen = nil
            }
        }
        .onChange(of: disabled) { _, next in if next { close() } }
        .onDisappear { invalidate() }
    }
}`
  },
  vue: {
    rename: {
      value: 'modelValue',
      onChange: 'update:modelValue',
      onQueryChange: 'update:query',
    },
    attribute(name, value) {
      // MCombobox takes null for no choice and reports string or number values; the source
      // writes undefined and its options are strings.
      if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
      if (name === 'selectedOption')
        return `:selectedOption="${expression(`${js(value.expr)} ?? null`)}"`
      if (name === 'onChange' && value.params.some((param) => !param.unused))
        return `@update:modelValue="${expression(`(choice) => (${handlerJs(value)})(choice === null ? undefined : String(choice))`)}"`
      if (name === 'onSelect' && value.params.some((param) => !param.unused))
        return `@select="${expression(`(option) => (${handlerJs(value)})(option === null ? undefined : { ...option, value: String(option.value) })`)}"`
      if (name === 'search')
        return `:search="${expression(`async (${value.param ?? ''}) => ${js(value.expr)}`)}"`
    },
  },
}
