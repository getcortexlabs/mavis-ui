import { expression, handlerJs } from '../js-text.mjs'
import { flexRuntime } from './flex.mjs'
import { accessibility, flexItem } from './shared.mjs'
import {
  bounded,
  choiceRuntime,
  options,
  strings,
  stringsEvent,
  swiftArguments,
  swiftCall,
} from './choices.mjs'

const labels = ['placeholder', 'searchLabel', 'closeLabel', 'emptyLabel', 'removeLabel']

// multiSelectProps: several of the options at once. The value is the chosen values in the order
// they were chosen and belongs to the source: the field asks for the next list. It shows them as
// chips that take one out, and opens the options with a filter; maxSelected stops at that many.
export const MMultiSelect = {
  props: {
    id: 'string',
    label: 'string',
    value: strings,
    options,
    onChange: stringsEvent,
    maxSelected: bounded(
      'maxSelected',
      (value) => Number.isInteger(value) && value >= 1,
      'is a whole number, one or more.',
    ),
    ...Object.fromEntries(labels.map((key) => [key, 'string'])),
    helperText: 'string',
    error: 'string',
    disabled: 'boolean',
    readonly: 'boolean',
    width: 'dimension',
    grow: 'factor',
    shrink: 'factor',
    accessibilityHidden: 'boolean',
  },
  required: ['label', 'value', 'options', 'onChange'],
  control: true,
  uses: [flexRuntime, choiceRuntime],
  declaration: `declare function MMultiSelect(props: MavisFlexItem & { id?: string; label: string; value: readonly string[]; options: readonly SelectOption[]; onChange: (value: string[]) => void; maxSelected?: number; ${labels.map((key) => `${key}?: string`).join('; ')}; helperText?: string; error?: string; disabled?: boolean; readonly?: boolean; width?: MavisDimension; accessibilityHidden?: boolean }): JSX.Element`,
  swift(node, context) {
    const { indent } = context
    const args = swiftArguments(node, context, [
      ['label'],
      ['value', 'values'],
      ['options'],
      ['onChange'],
      ['maxSelected'],
      ...labels.map((key) => [key]),
      ['helperText'],
      ['error'],
      ['disabled'],
      ['readonly'],
      ['id', 'identifier'],
    ])
    return [
      swiftCall('MavisMultiSelect', args, indent),
      ...accessibility({ accessibilityHidden: node.props.accessibilityHidden }, context),
      ...flexItem(node.props, context),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    metric,
  }) => `/// MMultiSelect: the chosen values as chips under a button that opens the options, each a
/// checkbox, with a filter. The value belongs to the source: a click asks for the next list, as
/// toggleMultiSelection in the Mavis core decides it.
struct MavisMultiSelect: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let values: [String]
    let options: [MavisChoice]
    let onChange: ([String]) -> Void
    var maxSelected: Double? = nil
    var placeholder = "Choose options"
    var searchLabel = "Search options"
    var closeLabel = "Done"
    var emptyLabel = "No matching options"
    var removeLabel = "Remove"
    var helperText = ""
    var error = ""
    var disabled = false
    var readonly = false
    var identifier = ""
    @State private var open = false
    @State private var query = ""
    @FocusState private var focus: String?

    private var blocked: Bool { disabled || readonly }
    private var chosen: [MavisChoice] {
        values.compactMap { value in options.first { $0.value == value } }
    }
    private var full: Bool { maxSelected.map { Double(values.count) >= $0 } ?? false }

    private func toggle(_ value: String) {
        guard !blocked, let option = options.first(where: { $0.value == value }), !option.disabled else { return }
        if values.contains(value) {
            onChange(values.filter { $0 != value })
        } else if !full {
            onChange(values + [value])
        }
    }

    var body: some View {
        let chosen = chosen
        let shown = options.filter { mavisSelectionMatches($0.label, query) }
        MavisColumn(spacing: ${metric('space.sm')}) {
            MavisSelectionLabel(text: label)
            Button(action: {
                query = ""
                open.toggle()
            }) {
                Text(verbatim: chosen.isEmpty ? placeholder : label + " · " + mavisString(Double(chosen.count)))
            }
            .buttonStyle(MavisButtonStyle(variant: .secondary))
            .disabled(blocked)
            .accessibilityLabel(Text(verbatim: label + ": " + (chosen.isEmpty ? placeholder : chosen.map(\\.label).joined(separator: ", "))))
            .accessibilityIdentifier(identifier)
            if !chosen.isEmpty {
                MavisRow(spacing: ${metric('space.sm')}, align: .start, wrap: true) {
                    ForEach(chosen, id: \\.value) { option in
                        MavisSelectionChip(label: option.label, removeLabel: removeLabel + ": " + option.label, disabled: blocked || option.disabled) {
                            toggle(option.value)
                        }
                        // On each chip, not on the row: Jolt's window probe behind the bare row
                        // would answer the accessibility hit test for the chips' buttons.
                        .joltLayout(value: values, transition: .spring(.smooth))
                    }
                }
            }
            MavisSelectionMessage(helperText: helperText, error: error)
            MavisSelectionPanel(title: label, open: open && !blocked) {
                MavisTextInput(label: searchLabel, value: query, onChange: { query = $0 }, focus: $focus, focusKey: "search")
                ForEach(shown, id: \\.value) { option in
                    MavisCheckbox(
                        label: option.label,
                        checked: values.contains(option.value),
                        onChange: { _ in toggle(option.value) },
                        helperText: option.helperText,
                        disabled: blocked || option.disabled || (!values.contains(option.value) && full)
                    )
                }
                if shown.isEmpty {
                    Text(verbatim: emptyLabel)
                        .font(.system(size: ${metric('typography.body.fontSize')}))
                        .foregroundStyle(MavisTokens.muted)
                }
                Button(action: { open = false }) {
                    Text(verbatim: closeLabel)
                }
                .buttonStyle(MavisButtonStyle())
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onChange(of: blocked) { _, next in if next { open = false } }
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    attribute(name, value) {
      // MMultiSelect reports string or number choices; these options are strings.
      if (name === 'onChange' && value.params.some((param) => !param.unused))
        return `@update:modelValue="${expression(`(choices) => (${handlerJs(value)})(choices.map(String))`)}"`
    },
  },
}
