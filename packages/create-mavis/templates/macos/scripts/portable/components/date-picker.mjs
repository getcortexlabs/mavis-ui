import { expression, handlerJs, js } from '../js-text.mjs'
import { swiftString } from '../swift-text.mjs'
import { event, swiftRecord } from './choices.mjs'
import {
  dateArguments,
  dateOptions,
  dateOptionTypes,
  dateOptionCheck,
  MCalendar,
} from './calendar.mjs'
import { reference } from './fields.mjs'
import { control, controlProps, controlTypes, layoutProps, layoutTypes } from './input-kit.mjs'
import { named } from './list-parts.mjs'
import { MSheet } from './sheet.mjs'
const labels = ['clearLabel', 'calendarLabel', 'closeLabel', 'startLabel', 'endLabel']
const common = {
  ...controlProps,
  ...layoutProps,
  ...dateOptions,
  label: 'string',
  dateFormat: 'string',
  helperText: 'string',
  error: 'string',
  clearable: 'boolean',
  clearLabel: 'string',
  calendarLabel: 'string',
  closeLabel: 'string',
  onFocus: 'handler',
  onBlur: 'handler',
  onValidityChange: event(({ record }) => [record('DateValidation')], 'DateValidation'),
  ref: reference,
}
const commonTypes = `label: string; ${dateOptionTypes}; dateFormat?: DateInputFormat; helperText?: string; error?: string; clearable?: boolean; clearLabel?: string; calendarLabel?: string; closeLabel?: string; onFocus?: () => void; onBlur?: () => void; onValidityChange?: (value: DateValidation) => void; ref?: MavisFieldRef; ${controlTypes}; ${layoutTypes}`
function rangeRecord(name) {
  return ({ value, ctx, expr, record }) => ({ expr: expr(value, ctx, record(name)) })
}
function check(context) {
  dateOptionCheck(context)
  const { props, attrs, fail } = context
  for (const name of ['label', ...labels])
    if (props[name] && 'lit' in props[name] && !props[name].lit.trim())
      fail(attrs.get(name), `${name} must not be blank.`)
}
function swift(range, node, context) {
  const { emit, indent } = context,
    props = node.props
  const optional = (name) => (props[name] ? emit.expr(props[name].expr) : 'nil')
  const value = range
    ? props.value
      ? `MavisDateRange(start: ${emit.wrap(props.value.expr)}.start, end: ${emit.wrap(props.value.expr)}.end)`
      : 'MavisDateRange()'
    : `MavisDateRange(start: ${optional('value')})`
  const draft = props.draft
    ? range
      ? `MavisDateDraft(start: ${emit.wrap(props.draft.expr)}.start, end: ${emit.wrap(props.draft.expr)}.end)`
      : `MavisDateDraft(start: ${emit.value(props.draft)})`
    : 'nil'
  const args = [
    `label: ${emit.value(props.label)}`,
    `range: ${range}`,
    `value: ${value}`,
    `draft: ${draft}`,
    'focus: $mavisFocus',
    `focusKey: ${props.ref ? swiftString(props.ref.ref) : emit.focusKey('date')}`,
    ...dateArguments(props, emit),
    ...named(props, emit, ['dateFormat', 'helperText', 'error', 'clearable', ...labels, 'id']),
  ]
  for (const [prop, label, argument] of [
    [
      'onChange',
      'onValue',
      () =>
        range
          ? swiftRecord(emit, 'DateRange', { start: 'value.start', end: 'value.end' })
          : 'value.start',
    ],
    [
      'onDraftChange',
      'onDraft',
      () =>
        range
          ? swiftRecord(emit, 'DateRangeDraft', { start: 'value.start', end: 'value.end' })
          : 'value.start',
    ],
    [
      'onValidityChange',
      'onValidity',
      () =>
        swiftRecord(emit, 'DateValidation', {
          valid: 'value.valid',
          complete: 'value.complete',
          reason: 'value.reason',
        }),
    ],
  ]) {
    if (props[prop])
      args.push(`${label}: { value in (${emit.handler(props[prop], indent + 4)})(${argument()}) }`)
  }
  for (const name of ['onFocus', 'onBlur'])
    if (props[name]) args.push(`${name}: ${emit.handler(props[name], indent + 4)}`)
  return control(node, context, 'MavisDateEntry', args)
}
const vue = (range) => ({
  rename: { value: 'modelValue', onChange: 'update:modelValue', onDraftChange: 'update:draft' },
  attribute(name, value) {
    if (name === 'value')
      return `:modelValue="${expression(range ? `{ start: (${js(value.expr)}).start ?? null, end: (${js(value.expr)}).end ?? null }` : `${js(value.expr)} ?? null`)}"`
    if (name === 'onChange' && value.params.some((p) => !p.unused))
      return `@update:modelValue="${expression(`(value) => (${handlerJs(value)})(${range ? '{ start: value.start ?? undefined, end: value.end ?? undefined }' : 'value ?? undefined'})`)}"`
    if (name === 'onValidityChange' && value.params.some((p) => !p.unused))
      return `@validityChange="${expression(`(value) => (${handlerJs(value)})({ ...value, reason: value.reason ?? undefined })`)}"`
  },
})
export const MDatePicker = {
  props: {
    ...common,
    value: 'optional-string',
    onChange: event(({ T }) => [T.optional(T.string)], 'CivilDate | null'),
    draft: 'string',
    onDraftChange: 'string-handler',
    name: 'string',
  },
  required: ['label'],
  control: true,
  uses: [MCalendar, MSheet],
  check,
  focus: () => true,
  declaration: `declare function MDatePicker(props: { value?: CivilDate | null; onChange?: (value: CivilDate | null) => void; draft?: string; onDraftChange?: (draft: string) => void; name?: string; ${commonTypes} }): JSX.Element`,
  swift: (node, context) => swift(false, node, context),
  vue: vue(false),
  swiftRuntime: ({
    theme,
    font,
    metric,
  }) => `struct MavisDateDraft: Equatable { var start = ""; var end = "" }
extension MavisDateWords {
    var choose: String { pt ? "Escolher data" : "Choose date" }
    var clear: String { pt ? "Limpar datas" : "Clear dates" }
    var close: String { pt ? "Fechar" : "Close" }
    var start: String { pt ? "Início" : "Start" }
    var end: String { pt ? "Fim" : "End" }
    func message(_ validity: MavisDateValidation, placeholder: String) -> String {
        guard !validity.valid, let reason = validity.reason else { return "" }
        switch reason {
        case "incomplete": return pt ? "Informe a data completa no formato " + placeholder + "." : "Enter a complete date as " + placeholder + "."
        case "invalid": return pt ? "Informe uma data gregoriana válida no formato " + placeholder + "." : "Enter a valid Gregorian date as " + placeholder + "."
        case "before-min": return pt ? "Esta data é anterior ao mínimo." : "This date is before the minimum."
        case "after-max": return pt ? "Esta data é posterior ao máximo." : "This date is after the maximum."
        case "unavailable": return pt ? "Esta data não está disponível." : "This date is unavailable."
        case "reversed": return pt ? "O fim deve ser igual ou posterior ao início." : "The end must be on or after the start."
        case "unavailable-range": return pt ? "Este intervalo inclui uma data indisponível." : "This range includes an unavailable date."
        default: return ""
        }
    }
}

/// The calendar action shares the input's row, so labels/messages never move the button.
struct MavisDateEditor: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let text: String
    let placeholder: String
    let action: String
    var icon = "calendar-days"
    var helperText = ""
    var error = ""
    var disabled = false
    var readonly = false
    let focus: FocusState<String?>.Binding
    let key: String
    let onEdit: (String) -> Void
    let onAction: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: ${metric('space.xs')}) {
            Text(verbatim: label).font(${font('caption')}).foregroundStyle(MavisTokens.text).accessibilityHidden(true)
            HStack(spacing: 0) {
                TextField(placeholder, text: Binding(get: { text }, set: { if !disabled && !readonly { onEdit($0) } }))
                    .textFieldStyle(.plain).font(${font('body')}).foregroundStyle(MavisTokens.text)
                    .padding(.horizontal, ${metric('space.md')}).frame(minHeight: 44)
                    .focused(focus, equals: key).disabled(disabled || readonly).accessibilityLabel(Text(verbatim: label))
                Button(action: onAction) { MavisIcon(icon, size: 20).frame(width: 44, height: 44) }
                    .buttonStyle(MavisButtonStyle(variant: .ghost, size: .md)).disabled(disabled || readonly)
                    .focused(focus, equals: key + ":action").accessibilityLabel(Text(verbatim: action))
            }
            .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.md')}))
            .overlay(RoundedRectangle(cornerRadius: ${metric('radius.md')}).strokeBorder(error.isEmpty ? MavisTokens.border : MavisTokens.danger, lineWidth: 1).allowsHitTesting(false))
            if !error.isEmpty || !helperText.isEmpty {
                Text(verbatim: error.isEmpty ? helperText : error).font(${font('caption')}).foregroundStyle(error.isEmpty ? MavisTokens.muted : MavisTokens.danger).fixedSize(horizontal: false, vertical: true).accessibilityIdentifier("mavis-message:" + label)
            }
        }.opacity(disabled ? 0.5 : 1)
    }
}

struct MavisDateEntry: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    var range = false
    var value = MavisDateRange()
    var draft: MavisDateDraft? = nil
    let focus: FocusState<String?>.Binding
    let focusKey: String
    var constraints = MavisDateConstraints()
    var locale = "en-US"
    var firstDayOfWeek: Double? = nil
    var initialMonth = "2000-01"
    var disabled = false
    var readonly = false
    var dateFormat = "iso"
    var helperText = ""
    var error = ""
    var clearable = true
    var clearLabel: String? = nil
    var calendarLabel: String? = nil
    var closeLabel: String? = nil
    var startLabel: String? = nil
    var endLabel: String? = nil
    var id = ""
    var onValue: (MavisDateRange) -> Void = { _ in }
    var onDraft: (MavisDateDraft) -> Void = { _ in }
    var onValidity: (MavisDateValidation) -> Void = { _ in }
    var onFocus: () -> Void = {}
    var onBlur: () -> Void = {}
    @State private var local: MavisDateDraft? = nil
    @State private var touched = false
    @State private var open = false
    @State private var endpoint = "start"
    @State private var active = "2000-01-01"
    @State private var attempts = 0
    @State private var requested = false
    private struct Sync: Equatable { let value: MavisDateRange; let draft: MavisDateDraft?; let attempts: Int }
    private struct Format: Equatable { let locale: String; let format: String }
    private var words: MavisDateWords { MavisDateWords(locale: locale) }
    private var blocked: Bool { disabled || readonly }
    private func formatted(_ value: String?) -> String { value.flatMap { mavisFormatDateInput($0, dateFormat, locale) } ?? "" }
    private func parse(_ text: String) -> String? { mavisParseDateInput(text, dateFormat, locale) }
    private func validate(_ text: String) -> MavisDateValidation { mavisValidateDateInput(text, constraints, dateFormat, locale) }
    private var canonical: MavisDateDraft { MavisDateDraft(start: formatted(value.start), end: range ? formatted(value.end) : "") }
    private var shown: MavisDateDraft { local ?? draft ?? canonical }
    private var validity: MavisDateValidation { range ? mavisValidateDateRange(shown.start, shown.end, constraints, dateFormat, locale) : validate(shown.start) }
    private var placeholder: String { mavisDatePattern(dateFormat, locale)!.replacingOccurrences(of: "yyyy", with: words.pt ? "AAAA" : "YYYY").replacingOccurrences(of: "dd", with: "DD") }
    private func fieldLabel(_ which: String) -> String { range ? label + " · " + (which == "start" ? (startLabel ?? words.start) : (endLabel ?? words.end)) : label }
    private func key(_ which: String) -> String { focusKey + (range && which == "end" ? ":end" : "") }
    private func propose(_ next: MavisDateDraft) {
        guard !blocked else { return }
        attempts += 1
        local = next
        onDraft(next)
        let valid = range ? mavisValidateDateRange(next.start, next.end, constraints, dateFormat, locale) : validate(next.start)
        requested = valid.valid && next != canonical
        if requested { onValue(MavisDateRange(start: parse(next.start), end: range ? parse(next.end) : nil)) }
    }
    private func edit(_ which: String, _ text: String) { var next = shown; if which == "start" { next.start = text } else { next.end = text }; propose(next) }
    private func show(_ which: String) {
        guard !blocked, !open else { return }
        endpoint = which
        active = constraints.clamp(parse(which == "start" ? shown.start : shown.end) ?? constraints.min ?? (initialMonth + "-01"))
        focus.wrappedValue = key(which) + ":action"
        open = true
    }
    private func close(_ restore: Bool = true) { open = false; if restore && !disabled { focus.wrappedValue = key(endpoint) + ":action" } }
    @ViewBuilder private func editor(_ which: String) -> some View {
        let start = validate(shown.start), end = validate(shown.end)
        let own = which == "start" ? start : end, text = which == "start" ? shown.start : shown.end
        let issue = touched || text.count >= 10 ? words.message(own, placeholder: placeholder) : ""
        let rangeIssue = start.valid && end.valid ? words.message(validity, placeholder: placeholder) : ""
        let shownError = !range ? (error.isEmpty ? issue : error) : which == "start" ? issue : (!error.isEmpty ? error : (!issue.isEmpty ? issue : rangeIssue))
        MavisDateEditor(label: fieldLabel(which), text: text, placeholder: placeholder, action: (calendarLabel ?? words.choose) + ": " + fieldLabel(which), helperText: !range || which == "end" ? helperText : "", error: shownError, disabled: disabled, readonly: readonly, focus: focus, key: key(which), onEdit: { edit(which, $0) }, onAction: { show(which) })
            .mavisIdentifier(id.isEmpty ? "" : id + (range ? "-" + which : ""))
    }
    var body: some View {
        let _ = precondition(!mavisTrim(label).isEmpty && [clearLabel, calendarLabel, closeLabel, startLabel, endLabel].compactMap { $0 }.allSatisfy { !mavisTrim($0).isEmpty } && constraints.valid && ["en-US", "pt-BR"].contains(locale) && mavisDatePattern(dateFormat, locale) != nil && mavisCivil(initialMonth + "-01") != nil && (value.start == nil || mavisCivil(value.start!) != nil) && (value.end == nil || mavisCivil(value.end!) != nil) && (firstDayOfWeek == nil || (firstDayOfWeek!.rounded(.towardZero) == firstDayOfWeek! && (0...6).contains(firstDayOfWeek!))))
        VStack(alignment: .leading, spacing: ${metric('space.sm')}) {
            editor("start")
            if range { editor("end") }
            if clearable {
                Button(clearLabel ?? (words.clear + ": " + label)) { touched = false; propose(MavisDateDraft()) }.buttonStyle(MavisButtonStyle(variant: .ghost, size: .sm)).disabled(blocked || (shown.start.isEmpty && shown.end.isEmpty))
            }
            MavisSheet(open: open, title: fieldLabel(endpoint), closeLabel: closeLabel ?? words.close, onUpdateOpen: { if !$0 { close() } }) {
                MavisCalendarGrid(active: active, selected: parse(endpoint == "start" ? shown.start : shown.end), selection: range ? MavisDateRange(start: parse(shown.start), end: parse(shown.end)) : MavisDateRange(), constraints: constraints, locale: locale, firstDayOfWeek: firstDayOfWeek, onActive: { active = $0 }, onSelect: { date in
                    if open && !blocked && constraints.reason(date) == nil { touched = true; edit(endpoint, formatted(date)); close() }
                })
            }
        }
        .onChange(of: Sync(value: value, draft: draft, attempts: attempts)) { previous, next in
            if previous.value != next.value || previous.draft != next.draft || draft != nil || requested { local = nil }
            requested = false
        }
        .onChange(of: Format(locale: locale, format: dateFormat)) { previous, _ in
            guard draft == nil else { return }
            var next = shown
            for which in ["start", "end"] { let text = which == "start" ? next.start : next.end; if let parsed = mavisParseDateInput(text, previous.format, previous.locale) { if which == "start" { next.start = formatted(parsed) } else { next.end = formatted(parsed) } } }
            local = next
        }
        .onChange(of: validity) { _, next in onValidity(next) }
        .onChange(of: blocked) { _, blocked in if blocked { close(false) } }
        .onChange(of: focus.wrappedValue) { before, next in
            let keys = [key("start"), key("end")]
            if let before, keys.contains(before), before != next { touched = true; onBlur() }
            if let next, keys.contains(next), before != next { onFocus() }
        }
        .onDisappear { open = false; requested = false }
    }
}`,
}
export const MDateRangePicker = {
  props: {
    ...common,
    value: rangeRecord('DateRange'),
    onChange: event(({ record }) => [record('DateRange')], 'DateRange'),
    draft: rangeRecord('DateRangeDraft'),
    onDraftChange: event(({ record }) => [record('DateRangeDraft')], 'DateRangeDraft'),
    startLabel: 'string',
    endLabel: 'string',
    startName: 'string',
    endName: 'string',
  },
  required: ['label'],
  control: true,
  uses: [MDatePicker],
  check,
  focus: () => true,
  declaration: `declare function MDateRangePicker(props: { value?: DateRange; onChange?: (value: DateRange) => void; draft?: DateRangeDraft; onDraftChange?: (draft: DateRangeDraft) => void; startLabel?: string; endLabel?: string; startName?: string; endName?: string; ${commonTypes} }): JSX.Element`,
  swift: (node, context) => swift(true, node, context),
  vue: vue(true),
}
