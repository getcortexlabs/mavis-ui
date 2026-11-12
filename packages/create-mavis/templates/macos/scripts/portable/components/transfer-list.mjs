import { expression, handlerJs } from '../js-text.mjs'
import { flexRuntime } from './flex.mjs'
import {
  choiceRuntime,
  options,
  strings,
  stringsEvent,
  swiftArguments,
  swiftCall,
} from './choices.mjs'

const labels = [
  'availableLabel',
  'selectedLabel',
  'searchLabel',
  'addLabel',
  'removeLabel',
  'emptyLabel',
]

// transferListProps: the options in two lists, the ones still available and the ones selected.
// value is the selected values and belongs to the source. Each list has a filter and a button
// that moves the options checked in it to the other one; what is checked is the component's own,
// and an option stays checked until its move is done.
export const MTransferList = {
  props: {
    id: 'string',
    label: 'string',
    options,
    value: strings,
    onChange: stringsEvent,
    disabled: 'boolean',
    animated: 'boolean',
    ...Object.fromEntries(labels.map((key) => [key, 'string'])),
  },
  required: ['label', 'options', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, choiceRuntime],
  declaration: `declare function MTransferList(props: { id?: string; label: string; options: readonly SelectOption[]; value: readonly string[]; onChange: (value: string[]) => void; disabled?: boolean; animated?: boolean; ${labels.map((key) => `${key}?: string`).join('; ')} }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const args = swiftArguments(node, context, [
      ['label'],
      ['options'],
      ['value', 'values'],
      ['onChange'],
      ['disabled'],
      ['animated'],
      ...labels.map((key) => [key]),
    ])
    return [
      swiftCall('MavisTransferList', args, indent),
      ...(node.props.id
        ? [`${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(node.props.id)})`]
        : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// MTransferList: two cards side by side from 620 points of width, one under the other below
/// that. Each lists its options as checkboxes under a filter, and its button moves the checked
/// ones to the other card: transferValues in the Mavis core decides the next value, which the
/// source may keep out. Jolt moves the rows that stay; Reduce Motion puts them in place.
struct MavisTransferList: View {
    let label: String
    let options: [MavisChoice]
    let values: [String]
    let onChange: ([String]) -> Void
    var disabled = false
    var animated = true
    var availableLabel = "Available"
    var selectedLabel = "Selected"
    var searchLabel = "Filter"
    var addLabel = "Add selected"
    var removeLabel = "Remove selected"
    var emptyLabel = "No matches"
    @State private var checked: [String] = []
    @State private var filters = ["", ""]
    // The options a button asked to move, and from which side, until the source answers.
    @State private var moving: [String] = []
    @State private var leaving = false
    @FocusState private var focus: String?

    private func side(_ selected: Bool) -> [MavisChoice] {
        options.filter { values.contains($0.value) == selected }
    }

    private func move(_ selected: Bool) {
        guard !disabled else { return }
        let moved = side(selected).filter { checked.contains($0.value) && !$0.disabled }.map(\\.value)
        moving = moved
        leaving = selected
        if selected {
            onChange(values.filter { !moved.contains($0) })
        } else {
            onChange(values + moved.filter { !values.contains($0) })
        }
    }

    private func check(_ option: MavisChoice, _ on: Bool) {
        guard !disabled, !option.disabled else { return }
        checked = on ? checked.filter { $0 != option.value } + [option.value] : checked.filter { $0 != option.value }
    }

    private func pane(_ selected: Bool) -> some View {
        let title = selected ? selectedLabel : availableLabel
        let index = selected ? 1 : 0
        let all = side(selected)
        let shown = all.filter { mavisSelectionMatches($0.label, filters[index]) }
        return MavisCard(paddingX: ${theme.space.md}, paddingY: ${theme.space.md}, spacing: ${theme.space.sm}) {
            Text(verbatim: title + " · " + mavisString(Double(all.count)))
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
            MavisTextInput(label: searchLabel + ": " + title, value: filters[index], onChange: { filters[index] = $0 }, focus: $focus, focusKey: selected ? "selected" : "available", disabled: disabled)
            ForEach(shown, id: \\.value) { option in
                MavisCheckbox(label: option.label, checked: checked.contains(option.value), onChange: { check(option, $0) }, disabled: disabled || option.disabled)
            }
            if shown.isEmpty {
                Text(verbatim: emptyLabel)
                    .font(${font('body')})
                    .foregroundStyle(MavisTokens.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Button(action: { move(selected) }) {
                Text(verbatim: selected ? removeLabel : addLabel)
            }
            .buttonStyle(MavisButtonStyle(variant: .secondary))
            .disabled(disabled || !all.contains { !$0.disabled && checked.contains($0.value) })
        }
        // On the card, whose surface covers Jolt's window probe: see MavisMultiSelect's chips.
        .joltLayout(value: animated ? values : [], transition: .spring(.smooth))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: title))
    }

    var body: some View {
        MavisColumn(spacing: ${theme.space.md}) {
            Text(verbatim: label)
                .font(${font('heading')})
                .foregroundStyle(MavisTokens.text)
                .fixedSize(horizontal: false, vertical: true)
            MavisStack(axis: .vertical, spacing: ${theme.space.md}, align: .stretch, breakpoints: [MavisBreakpoint(at: 620, axis: .horizontal)]) {
                pane(false).mavisItem(grow: 1, shrink: 1)
                pane(true).mavisItem(grow: 1, shrink: 1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
        .onChange(of: values) { _, next in
            // What moved is no longer checked; what the source kept in place stays checked.
            checked = checked.filter { value in
                options.contains { $0.value == value && !$0.disabled } && (!moving.contains(value) || next.contains(value) == leaving)
            }
            moving = []
        }
        .onChange(of: options) { _, next in
            checked = checked.filter { value in next.contains { $0.value == value && !$0.disabled } }
        }
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    attribute(name, value) {
      // MTransferList reports string or number choices; these options are strings.
      if (name === 'onChange' && value.params.some((param) => !param.unused))
        return `@update:modelValue="${expression(`(choices) => (${handlerJs(value)})(choices.map(String))`)}"`
    },
  },
}
