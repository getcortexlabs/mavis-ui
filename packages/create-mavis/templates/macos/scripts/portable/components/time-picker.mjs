import { expression, handlerJs, js } from '../js-text.mjs'
import { swiftString } from '../swift-text.mjs'
import { event, swiftRecord } from './choices.mjs'
import { reference } from './fields.mjs'
import { bounded, control, layoutProps, layoutTypes } from './input-kit.mjs'
import { named } from './list-parts.mjs'
import { MDatePicker } from './date-picker.mjs'
import { timeRuntime } from './time-policy.mjs'
const labels = [
  'chooseLabel',
  'confirmLabel',
  'cancelLabel',
  'clearLabel',
  'hourLabel',
  'minuteLabel',
  'periodLabel',
  'invalidLabel',
]
export const MTimePicker = {
  props: {
    id: 'string',
    ...layoutProps,
    label: 'string',
    value: 'optional-string',
    onChange: event(({ T }) => [T.optional(T.string)], 'LocalTime | null'),
    draft: 'string',
    onDraftChange: 'string-handler',
    min: 'string',
    max: 'string',
    minuteStep: bounded(
      'minuteStep',
      (v) => Number.isInteger(v) && v >= 1 && v <= 30 && 60 % v === 0,
      'must be a divisor of 60 between 1 and 30.',
    ),
    locale: 'string',
    hourCycle: 'string',
    name: 'string',
    disabled: 'boolean',
    readonly: 'boolean',
    required: 'boolean',
    helperText: 'string',
    error: 'string',
    placeholder: 'string',
    ...Object.fromEntries(labels.map((n) => [n, 'string'])),
    onValidityChange: event(({ record }) => [record('TimeValidation')], 'TimeValidation'),
    onFocus: 'handler',
    onBlur: 'handler',
    ref: reference,
  },
  required: ['label'],
  control: true,
  focus: () => true,
  uses: [MDatePicker, timeRuntime],
  types: () =>
    "type LocalTime = string\ntype TimeLocale = 'en-US' | 'pt-BR'\ntype HourCycle = 'h12' | 'h23'\ntype TimeValidation = { status: 'empty' | 'valid' | 'incomplete' | 'invalid' | 'range' | 'step'; value: LocalTime | null }",
  records: { TimeValidation: 'time validity' },
  declaration: `declare function MTimePicker(props: { id?: string; label: string; value?: LocalTime | null; onChange?: (value: LocalTime | null) => void; draft?: string; onDraftChange?: (draft: string) => void; min?: LocalTime; max?: LocalTime; minuteStep?: number; locale?: TimeLocale; hourCycle?: HourCycle; name?: string; disabled?: boolean; readonly?: boolean; required?: boolean; helperText?: string; error?: string; placeholder?: string; ${labels.map((n) => n + '?: string').join('; ')}; onValidityChange?: (value: TimeValidation) => void; onFocus?: () => void; onBlur?: () => void; ref?: MavisFieldRef; ${layoutTypes} }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context,
      props = node.props
    const val = (name, fallback) => (props[name] ? emit.value(props[name]) : fallback)
    const args = [
      `label: ${emit.value(props.label)}`,
      `value: ${val('value', 'nil')}`,
      `draft: ${val('draft', 'nil')}`,
      'focus: $mavisFocus',
      `focusKey: ${props.ref ? swiftString(props.ref.ref) : emit.focusKey('time')}`,
      `options: MavisTimeOptions(min: ${val('min', 'nil')}, max: ${val('max', 'nil')}, minuteStep: ${val('minuteStep', '1')}, locale: ${val('locale', '"en-US"')}, hourCycle: ${val('hourCycle', 'nil')})`,
      ...named(props, emit, [
        'disabled',
        'readonly',
        'required',
        'helperText',
        'error',
        'placeholder',
        ...labels,
        'id',
      ]),
    ]
    for (const name of ['onChange', 'onDraftChange', 'onFocus', 'onBlur'])
      if (props[name]) args.push(`${name}: ${emit.handler(props[name], indent + 4)}`)
    if (props.onValidityChange)
      args.push(
        `onValidity: { value in (${emit.handler(props.onValidityChange, indent + 4)})(${swiftRecord(emit, 'TimeValidation', { status: 'value.status', value: 'value.value' })}) }`,
      )
    return control(node, context, 'MavisTimeEntry', args)
  },
  swiftRuntime: ({ theme, font, metric }) => `struct MavisTimeEntry: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    var value: String? = nil
    var draft: String? = nil
    let focus: FocusState<String?>.Binding
    let focusKey: String
    var options = MavisTimeOptions()
    var disabled = false
    var readonly = false
    var required = false
    var helperText = ""
    var error = ""
    var placeholder: String? = nil
    var chooseLabel = "Choose time"
    var confirmLabel = "Apply"
    var cancelLabel = "Cancel"
    var clearLabel = "Clear time"
    var hourLabel = "Hour"
    var minuteLabel = "Minute"
    var periodLabel = "Period"
    var invalidLabel = "Enter a valid time within the allowed range and interval."
    var id = ""
    var onChange: (String?) -> Void = { _ in }
    var onDraftChange: (String) -> Void = { _ in }
    var onFocus: () -> Void = {}
    var onBlur: () -> Void = {}
    var onValidity: (MavisTimeValidation) -> Void = { _ in }
    @State private var local: String? = nil
    @State private var touched = false
    @State private var open = false
    @State private var picked = "00:00"
    @State private var attempts = 0
    @State private var requested: String?? = nil
    private struct Sync: Equatable { let value: String?; let options: MavisTimeOptions; let attempts: Int }
    private var blocked: Bool { disabled || readonly }
    private var resolved: MavisResolvedTime { mavisTimeOptions(options)! }
    private var shown: String { draft ?? local ?? mavisFormatTime(value, options)! }
    private var validation: MavisTimeValidation { mavisParseTime(shown, options) }
    private var selected: MavisTimeValidation { mavisValidateTime(picked, options) }
    private func setDraft(_ next: String) { local = next; onDraftChange(next) }
    private func publish(_ next: String?) { attempts += 1; requested = .some(next); onChange(next) }
    private func edit(_ text: String) {
        guard !blocked else { return }
        setDraft(text)
        let result = mavisParseTime(text, options)
        if ["valid", "empty"].contains(result.status) { publish(result.value) }
    }
    private func choose() {
        guard !blocked else { return }
        let current = validation.status == "valid" ? validation.value : value
        picked = mavisValidateTime(current, options).status == "valid" ? current! : mavisLocalTime(((resolved.min + resolved.step - 1) / resolved.step) * resolved.step)
        focus.wrappedValue = focusKey + ":action"
        open = true
    }
    private func close() { open = false; if !disabled { focus.wrappedValue = focusKey + ":action" } }
    private func part(_ label: String, _ values: [Int], _ read: @escaping () -> Int, _ write: @escaping (Int) -> Void) -> some View {
        VStack(alignment: .leading, spacing: ${metric('space.sm')}) {
            Text(verbatim: label).font(${font('caption')}).foregroundStyle(MavisTokens.text)
            Picker(label, selection: Binding(get: read, set: write)) { ForEach(values, id: \\.self) { Text(verbatim: String(format: "%02d", $0)).tag($0) } }.labelsHidden().pickerStyle(.menu).disabled(blocked)
        }.frame(maxWidth: .infinity)
    }
    private var picker: some View {
        let minutes = mavisTimeMinutes(picked)!, hour = minutes / 60, twelve = resolved.cycle == "h12"
        return HStack(spacing: ${metric('space.sm')}) {
            part(hourLabel, twelve ? Array(1...12) : Array(0...23), { twelve ? (hour % 12 == 0 ? 12 : hour % 12) : hour }, { next in picked = mavisLocalTime((twelve ? next % 12 + (hour >= 12 ? 12 : 0) : next) * 60 + minutes % 60) })
            part(minuteLabel, Array(stride(from: 0, to: 60, by: resolved.step)), { minutes % 60 }, { picked = mavisLocalTime(hour * 60 + $0) })
            if twelve {
                VStack(alignment: .leading, spacing: ${metric('space.sm')}) {
                    Text(verbatim: periodLabel).font(${font('caption')}).foregroundStyle(MavisTokens.text)
                    Picker(periodLabel, selection: Binding(get: { hour >= 12 }, set: { picked = mavisLocalTime((hour % 12 + ($0 ? 12 : 0)) * 60 + minutes % 60) })) { Text("AM").tag(false); Text("PM").tag(true) }.labelsHidden().pickerStyle(.menu).disabled(blocked)
                }.frame(maxWidth: .infinity)
            }
        }
    }
    var body: some View {
        let _ = precondition(!mavisTrim(label).isEmpty && mavisTimeOptions(options) != nil && mavisFormatTime(value, options) != nil)
        let issue = !["valid", "empty"].contains(validation.status) && (validation.status != "incomplete" || touched)
        VStack(spacing: ${metric('space.sm')}) {
            MavisDateEditor(label: label, text: shown, placeholder: placeholder ?? (resolved.cycle == "h23" ? "HH:mm" : "h:mm AM/PM"), action: chooseLabel, icon: "clock", helperText: helperText, error: !error.isEmpty ? error : issue ? invalidLabel : "", disabled: disabled, readonly: readonly, focus: focus, key: focusKey, onEdit: edit, onAction: choose).mavisIdentifier(id)
            MavisSheet(open: open, title: label, closeLabel: cancelLabel, onUpdateOpen: { if !$0 { close() } }) {
                picker
                if selected.status != "valid" { Text(verbatim: invalidLabel).font(${font('body')}).foregroundStyle(MavisTokens.danger) }
                HStack(spacing: ${metric('space.sm')}) {
                    Button(confirmLabel) { if !blocked && selected.status == "valid" { setDraft(mavisFormatTime(picked, options)!); publish(picked); close() } }.buttonStyle(MavisButtonStyle()).disabled(blocked || selected.status != "valid")
                    Button(clearLabel) { if !blocked && !required { setDraft(""); publish(nil); close() } }.buttonStyle(MavisButtonStyle(variant: .ghost)).disabled(blocked || required)
                }
            }
        }
        .onAppear { onValidity(validation) }
        .onChange(of: validation) { _, next in onValidity(next) }
        .onChange(of: Sync(value: value, options: options, attempts: attempts)) { before, next in
            if before.options.locale != next.options.locale || before.options.hourCycle != next.options.hourCycle || (requested != nil && requested! != next.value) || (requested == nil && before.value != next.value) { setDraft(mavisFormatTime(value, options)!) }
            requested = nil
        }
        .onChange(of: draft) { _, next in if let next { local = next } }
        .onChange(of: blocked) { _, blocked in if blocked { open = false } }
        .onChange(of: focus.wrappedValue == focusKey) { _, active in if active { onFocus() } else { touched = true; onBlur() } }
        .onDisappear { open = false; requested = nil }
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue', onDraftChange: 'update:draft' },
    types: ['LocalTime', 'TimeLocale', 'HourCycle', 'TimeValidation'],
    attribute(name, value) {
      if (name === 'value') return `:modelValue="${expression(js(value.expr) + ' ?? null')}"`
      if (name === 'onChange' && value.params.some((p) => !p.unused))
        return `@update:modelValue="${expression(`(value) => (${handlerJs(value)})(value ?? undefined)`)}"`
      if (name === 'onValidityChange' && value.params.some((p) => !p.unused))
        return `@validityChange="${expression(`(value) => (${handlerJs(value)})({ ...value, value: value.value ?? undefined })`)}"`
    },
  },
}
