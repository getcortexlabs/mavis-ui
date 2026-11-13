// MSteps and MPagination: where a flow or a list of results is, as rows of Mavis buttons.
import { choiceValue, choiceValueEvent } from './choices.mjs'
import { flexRuntime } from './flex.mjs'
import {
  bounded,
  call,
  choice,
  emptyText,
  flag,
  handlers,
  items,
  mapped,
  model,
  settings,
  text,
} from './items.mjs'
import { choiceModel } from './tabs.mjs'

const step = { value: choice, label: text, disabled: flag, status: emptyText }
const whole = (value) => Number.isSafeInteger(value)

// stepsProps: one button for each step, numbered, with what state it is in under it. value is
// the current step and belongs to the source: a step asks for it with onChange. The source
// owns the panels and whether a step may be reached.
export const MSteps = {
  props: {
    label: 'string',
    steps: items(
      step,
      'MSteps takes steps with a value and a label, a string/number value and a textual label, such as StepOption[]: { value: string | number; label: string; disabled?: boolean; status?: "pending" | "complete" | "error" }.',
    ),
    value: choiceValue,
    onChange: choiceValueEvent,
    disabled: 'boolean',
    loading: 'boolean',
    currentLabel: 'string',
    completeLabel: 'string',
    errorLabel: 'string',
  },
  required: ['label', 'steps', 'value'],
  control: true,
  uses: [flexRuntime],
  types: () => `type MavisStepStatus = 'pending' | 'complete' | 'error'
/** One step of MSteps. Its value identifies it; its label can change with the language. */
type StepOption = { value: string | number; label: string; helperText?: string; disabled?: boolean; status?: MavisStepStatus }`,
  records: { StepOption: 'the Mavis step type' },
  declaration:
    'declare function MSteps(props: { label: string; steps: readonly { readonly value: string | number; readonly label: string; readonly disabled?: boolean; readonly status?: MavisStepStatus }[]; value: string | number | null | undefined; onChange?: (value: string | number) => void; disabled?: boolean; loading?: boolean; currentLabel?: string; completeLabel?: string; errorLabel?: string }): JSX.Element',
  swift(node, { emit, indent }) {
    const props = node.props
    return call(
      'MavisSteps',
      [
        `label: ${emit.value(props.label)}`,
        `steps: ${mapped(props.steps, step, 'MavisStep', emit)}`,
        `value: ${emit.expr(props.value.expr)}`,
        ...handlers(props, ['onChange'], emit, indent),
        ...settings(
          props,
          ['disabled', 'loading', 'currentLabel', 'completeLabel', 'errorLabel'],
          emit,
        ),
      ],
      indent,
    ).join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
    metric,
  }) => `/// One step of MSteps, without the shared record type so every project can use it.
struct MavisStep: Hashable {
    let value: MavisChoiceValue
    let label: String
    var disabled = false
    var status = ""
}

/// MSteps: a wrapping row of numbered buttons, named by label, the current step in the theme's
/// primary color. Under each button is what state the step is in. While loading, the current
/// step shows it and the others wait.
struct MavisSteps: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let steps: [MavisStep]
    let value: MavisChoiceValue?
    var onChange: (MavisChoiceValue) -> Void = { _ in }
    var disabled = false
    var loading = false
    var currentLabel = "Current"
    var completeLabel = "Complete"
    var errorLabel = "Needs attention"

    private func status(_ step: MavisStep) -> String {
        [step.value == value ? currentLabel : "", step.status == "error" ? errorLabel : step.status == "complete" ? completeLabel : ""]
            .filter { !$0.isEmpty }
            .joined(separator: " · ")
    }

    var body: some View {
        let _ = mavisValidateChoices(steps.map { MavisChoice(value: $0.value, label: $0.label, disabled: $0.disabled) }, value: value)
        let _ = precondition(!steps.isEmpty && (value == nil || steps.contains { $0.value == value }), "The current step must exist in steps")
        MavisRow(spacing: ${metric('space.sm')}, wrap: true) {
            ForEach(Array(steps.enumerated()), id: \\.element.value) { entry in
                let step = entry.element
                let current = step.value == value
                let state = status(step)
                let name = mavisString(Double(entry.offset + 1)) + ". " + step.label
                MavisColumn(spacing: ${metric('space.xs')}) {
                    Button(action: {
                        if !disabled, !loading, !step.disabled, !current { onChange(step.value) }
                    }) {
                        MavisButtonLabel(text: name, loading: loading && current, variant: current ? .primary : .secondary)
                    }
                    .buttonStyle(MavisButtonStyle(variant: current ? .primary : .secondary, loading: loading && current))
                    .disabled(disabled || step.disabled || loading)
                    .accessibilityLabel(Text(verbatim: state.isEmpty ? name : name + ". " + state))
                    .accessibilityAddTraits(current ? .isSelected : [])
                    if !state.isEmpty {
                        Text(verbatim: state)
                            .font(${font('caption')})
                            .foregroundStyle(step.status == "error" ? MavisTokens.danger : MavisTokens.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .mavisItem(grow: 1)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: { ...choiceModel, types: ['StepOption'] },
}

// paginationProps: previous, the pages around the current one and next. value is the page, from
// 1, and belongs to the source: a button asks for another with onChange. The pages shown are
// the ones pagination in the Mavis core lists, whatever the total.
export const MPagination = {
  props: {
    value: bounded('value', (value) => whole(value) && value >= 1, 'is a whole page, from 1.'),
    onChange: 'number-handler',
    total: bounded(
      'total',
      (value) => whole(value) && value >= 0,
      'is a whole number, zero or more.',
    ),
    pageSize: bounded(
      'pageSize',
      (value) => whole(value) && value >= 1,
      'is a whole number, 1 or more.',
    ),
    siblingCount: bounded('siblingCount', (value) => [0, 1, 2].includes(value), 'is 0, 1 or 2.'),
    label: 'string',
    previousLabel: 'string',
    nextLabel: 'string',
    pageLabel: 'string',
    currentLabel: 'string',
    statusText: 'string',
    emptyLabel: 'string',
    invalidPageLabel: 'string',
    loading: 'boolean',
    disabled: 'boolean',
  },
  required: ['total'],
  control: true,
  uses: [flexRuntime],
  declaration:
    'declare function MPagination(props: { value?: number; onChange?: (page: number) => void; total: number; pageSize?: number; siblingCount?: 0 | 1 | 2; label?: string; previousLabel?: string; nextLabel?: string; pageLabel?: string; currentLabel?: string; statusText?: string; emptyLabel?: string; invalidPageLabel?: string; loading?: boolean; disabled?: boolean }): JSX.Element',
  swift(node, { emit, indent }) {
    const props = node.props
    return call(
      'MavisPagination',
      [
        `total: ${emit.expr(props.total.expr)}`,
        ...(props.value ? [`value: ${emit.expr(props.value.expr)}`] : []),
        ...handlers(props, ['onChange'], emit, indent),
        ...['pageSize', 'siblingCount'].flatMap((key) =>
          props[key] ? [`${key}: ${emit.expr(props[key].expr)}`] : [],
        ),
        ...settings(
          props,
          [
            'label',
            'previousLabel',
            'nextLabel',
            'pageLabel',
            'statusText',
            'emptyLabel',
            'invalidPageLabel',
            'loading',
            'disabled',
          ],
          emit,
        ),
      ],
      indent,
    ).join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
    metric,
  }) => `/// pagination in the Mavis core: the pages to show around the current one, from 1, with a gap
/// where pages are left out. Values the Web refuses while rendering show no pages here.
struct MavisPages {
    enum Item: Hashable {
        case page(Int)
        case gap(String)
    }

    var count = 0
    var items: [Item] = []
    var outOfRange = false
    var previous: Int? = nil
    var next: Int? = nil

    init(total: Double, pageSize: Double, page: Double, siblingCount: Double) {
        let safe = 9_007_199_254_740_991.0
        func whole(_ value: Double, from least: Double) -> Bool { value >= least && value <= safe && value == value.rounded() }
        guard whole(total, from: 0), whole(pageSize, from: 1), whole(page, from: 1), [0, 1, 2].contains(siblingCount) else { return }
        let count = Int((total / pageSize).rounded(.up))
        let page = Int(page)
        let siblings = Int(siblingCount)
        var pages = Set<Int>()
        if count > 0 {
            pages.insert(1)
            pages.insert(count)
        }
        let anchor = Swift.min(page, count)
        let first = Swift.max(1, anchor - siblings)
        let last = Swift.min(count, anchor + siblings)
        if first <= last { pages.formUnion(first...last) }
        var before = 0
        for value in pages.sorted() {
            if before != 0, value - before == 2 {
                items.append(.page(before + 1))
            } else if before != 0, value - before > 2 {
                items.append(.gap("\\(before)-\\(value)"))
            }
            items.append(.page(value))
            before = value
        }
        self.count = count
        outOfRange = page > Swift.max(1, count)
        previous = count > 0 && page > 1 ? Swift.min(page - 1, count) : nil
        next = page < count ? page + 1 : nil
    }
}

/// MPagination: previous, the pages pagination lists and next, named by label, over what the
/// source says about the results. A page that no longer exists says so and changes nothing.
struct MavisPagination: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let total: Double
    var value: Double = 1
    var onChange: (Double) -> Void = { _ in }
    var pageSize: Double = 20
    var siblingCount: Double = 1
    var label = "Result pages"
    var previousLabel = "Previous"
    var nextLabel = "Next"
    var pageLabel = "Page"
    var statusText = ""
    var emptyLabel = "No results"
    var invalidPageLabel = "This page is no longer available."
    var loading = false
    var disabled = false

    private func ask(_ page: Int?) {
        guard let page, Double(page) != value, !disabled, !loading else { return }
        onChange(Double(page))
    }

    private func note(_ text: String, _ color: MavisColor, caption: Bool = false) -> some View {
        Text(verbatim: text)
            .font(caption ? ${font('caption')} : ${font('body')})
            .foregroundStyle(color)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func button(_ text: String, _ variant: MavisButtonVariant, name: String? = nil, selected: Bool = false, off: Bool = false, to page: Int?) -> some View {
        Button(action: { ask(page) }) {
            MavisButtonLabel(text: text, loading: loading, loadingText: text, variant: variant)
        }
        .buttonStyle(MavisButtonStyle(variant: variant, loading: loading))
        .disabled(disabled || off || loading)
        .accessibilityLabel(Text(verbatim: name ?? text))
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    var body: some View {
        let pages = MavisPages(total: total, pageSize: pageSize, page: value, siblingCount: siblingCount)
        MavisColumn(spacing: ${metric('space.sm')}) {
            if !statusText.isEmpty { note(statusText, MavisTokens.muted, caption: true) }
            if pages.count == 0 { note(emptyLabel, MavisTokens.muted) }
            if pages.outOfRange { note(invalidPageLabel, MavisTokens.danger) }
            MavisRow(spacing: ${metric('space.sm')}, wrap: true) {
                button(previousLabel, .secondary, off: pages.previous == nil, to: pages.previous)
                ForEach(pages.items, id: \\.self) { item in
                    switch item {
                    case .gap:
                        Text(verbatim: "…")
                            .font(${font('body')})
                            .foregroundStyle(MavisTokens.text)
                            .accessibilityHidden(true)
                    case .page(let page):
                        button(mavisString(Double(page)), Double(page) == value ? .primary : .ghost, name: pageLabel + " " + mavisString(Double(page)), selected: Double(page) == value, to: page)
                    }
                }
                button(nextLabel, .secondary, off: pages.next == nil, to: pages.next)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: model,
}
