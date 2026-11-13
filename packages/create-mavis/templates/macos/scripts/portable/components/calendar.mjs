import { expression, handlerJs, js } from '../js-text.mjs'
import { swiftRecord, strings } from './choices.mjs'
import { dateRuntime } from './date-policy.mjs'
import { flexRuntime } from './flex.mjs'
import { layerRuntime } from './layers.mjs'
import { bounded, content, event, named, slotOf } from './list-parts.mjs'

export const dateTypes = `type DateLocale = 'en-US' | 'pt-BR'
type DateRange = { start: CivilDate | null; end: CivilDate | null }
type DateRangeDraft = { start: string; end: string }
type DateInputFormat = 'iso' | 'locale' | 'yyyy-MM-dd' | 'dd/MM/yyyy' | 'MM/dd/yyyy'
type DateValidation = { valid: boolean; complete: boolean; reason: 'empty' | 'partial' | 'incomplete' | 'invalid' | 'before-min' | 'after-max' | 'unavailable' | 'reversed' | 'unavailable-range' | null }`

function calendarValue({ value, ctx, expr, record, fail, attribute }) {
  record('DateRange')
  const result = expr(value, ctx)
  const base = result.type.k === 'optional' ? result.type.of : result.type
  if (base.k !== 'string' && !(base.k === 'record' && base.name === 'DateRange'))
    fail(attribute, 'MCalendar takes a CivilDate or a DateRange with nullable start/end endpoints.')
  return { expr: result, range: base.k === 'record' }
}
export const dateOptions = {
  min: 'string',
  max: 'string',
  unavailableDates: strings,
  locale: 'string',
  firstDayOfWeek: bounded(
    'firstDayOfWeek',
    (value) => Number.isInteger(value) && value >= 0 && value <= 6,
    'must be an integer from 0 to 6.',
  ),
  initialMonth: 'string',
  disabled: 'boolean',
  readonly: 'boolean',
}
export const dateOptionTypes =
  'min?: CivilDate; max?: CivilDate; unavailableDates?: readonly CivilDate[]; locale?: DateLocale; firstDayOfWeek?: number; initialMonth?: string; disabled?: boolean; readonly?: boolean'
export function dateOptionCheck({ props, attrs, fail }) {
  if (props.initialMonth?.lit && !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(props.initialMonth.lit))
    fail(attrs.get('initialMonth'), 'initialMonth must be YYYY-MM.')
  if (props.initialMonth?.lit?.startsWith('0000-'))
    fail(attrs.get('initialMonth'), 'initialMonth must be in years 0001–9999.')
}
export function dateArguments(props, emit) {
  return [
    `constraints: MavisDateConstraints(min: ${props.min ? emit.value(props.min) : 'nil'}, max: ${props.max ? emit.value(props.max) : 'nil'}, unavailable: ${props.unavailableDates ? emit.expr(props.unavailableDates.expr) : '[]'})`,
    ...named(props, emit, ['locale', 'firstDayOfWeek', 'initialMonth', 'disabled', 'readonly']),
  ]
}

export const MCalendar = {
  props: {
    id: 'string',
    label: 'string',
    mode: 'string',
    value: calendarValue,
    onChange: event(({ type, T }) => [type('value')?.k === 'record' ? type('value') : T.string]),
    onInvalid: 'handler',
    ...dateOptions,
    invalidRangeLabel: 'string',
  },
  required: ['label'],
  slots: ['footer'],
  control: true,
  uses: [flexRuntime, layerRuntime, dateRuntime],
  types: () => dateTypes,
  records: {
    DateRange: 'a civil date range',
    DateRangeDraft: 'date editor text',
    DateValidation: 'date validity',
  },
  declaration: `declare function MCalendar(props: { id?: string; label: string; ${dateOptionTypes}; onInvalid?: () => void; invalidRangeLabel?: string; slotFooter?: JSX.Element } & ({ mode?: 'single'; value?: CivilDate | null; onChange?: (value: CivilDate) => void } | { mode: 'range'; value: DateRange; onChange?: (value: DateRange) => void })): JSX.Element`,
  check(context) {
    dateOptionCheck(context)
    const { props, attrs, tag, fail } = context
    if (props.mode && !('lit' in props.mode))
      fail(
        attrs.get('mode'),
        'MCalendar mode is written as single or range; each mode has a different value shape.',
      )
    if (props.mode?.lit === 'range' && !props.value?.range)
      fail(attrs.get('value') ?? tag, 'A range MCalendar takes value as DateRange.')
    if (props.mode?.lit !== 'range' && props.value?.range)
      fail(
        attrs.get('value'),
        'A single MCalendar takes a civil date; use mode="range" for DateRange.',
      )
  },
  swift(node, context) {
    const { emit, indent } = context,
      props = node.props,
      pad = ' '.repeat(indent),
      range = props.mode?.lit === 'range'
    const value = props.value ? emit.expr(props.value.expr) : 'nil'
    const args = [
      `label: ${emit.value(props.label)}`,
      `range: ${range}`,
      `selected: ${range ? 'nil' : value}`,
      `selection: ${range ? `MavisDateRange(start: ${emit.wrap(props.value.expr)}.start, end: ${emit.wrap(props.value.expr)}.end)` : 'MavisDateRange()'}`,
      ...dateArguments(props, emit),
      ...named(props, emit, ['invalidRangeLabel']),
    ]
    if (props.onChange)
      args.push(
        range
          ? `onRange: { value in (${emit.handler(props.onChange, indent + 4)})(${swiftRecord(emit, 'DateRange', { start: 'value.start', end: 'value.end' })}) }`
          : `onSelect: ${emit.handler(props.onChange, indent + 4)}`,
      )
    if (props.onInvalid) args.push(`onInvalid: ${emit.handler(props.onInvalid, indent + 4)}`)
    args.push(`footer: {\n${content(slotOf(node, 'footer')?.body ?? [], context)}\n${pad}    }`)
    return `${pad}MavisCalendar(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})${props.id ? `\n${pad}    .mavisIdentifier(${emit.value(props.id)})` : ''}`
  },
  swiftRuntime: ({ theme, font, metric }) => `struct MavisDateWords {
    let locale: String
    var pt: Bool { locale == "pt-BR" }
    var months: [String] { pt ? ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] }
    var weekdays: [String] { pt ? ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"] : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] }
    var short: [String] { pt ? ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sá"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] }
    var previous: String { pt ? "Mês anterior" : "Previous month" }
    var next: String { pt ? "Próximo mês" : "Next month" }
    func title(_ date: String) -> String { let p = mavisCivil(date)!; return months[p.month - 1] + " " + String(format: "%04d", p.year) }
    func day(_ date: String) -> String { let p = mavisCivil(date)!; return "\\(weekdays[mavisCivilWeekday(date)]), \\(p.day) \\(months[p.month - 1]) \\(p.year)" }
}
@MainActor func mavisCalendarMotion() -> JoltMotionValue { try! JoltMotionValue(1) }

struct MavisCalendarGrid: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let active: String
    var selected: String? = nil
    var selection = MavisDateRange()
    var constraints = MavisDateConstraints()
    var locale = "en-US"
    var firstDayOfWeek: Double? = nil
    var disabled = false
    var readonly = false
    let onActive: (String) -> Void
    let onSelect: (String) -> Void
    @StateObject private var motion = mavisCalendarMotion()
    @State private var direction = 1.0
    @State private var window = MavisWindowBox()
    @FocusState private var focused: String?
    @Environment(\\.layoutDirection) private var layoutDirection
    @Environment(\\.accessibilityReduceMotion) private var reduced
    private var words: MavisDateWords { MavisDateWords(locale: locale) }
    private var first: Int { Int(firstDayOfWeek ?? 0) }
    private var cells: [String?] { mavisCalendarMonth(active, Double(first))! }
    private func move(_ value: String) { guard !disabled else { return }; let date = constraints.clamp(value); onActive(date); focused = date }
    private func canPage(_ amount: Double) -> Bool {
        guard let next = mavisAddCivilMonths(active, amount), next.prefix(7) != active.prefix(7) else { return false }
        return (constraints.min == nil || next.prefix(7) >= constraints.min!.prefix(7)) && (constraints.max == nil || next.prefix(7) <= constraints.max!.prefix(7))
    }
    private func page(_ amount: Double) { if !disabled && canPage(amount), let next = mavisAddCivilMonths(active, amount) { onActive(constraints.clamp(next)) } }
    private func key(_ key: KeyPress) -> KeyPress.Result {
        guard !disabled, !key.modifiers.contains(.command), !key.modifiers.contains(.option), !key.modifiers.contains(.control) else { return .ignored }
        let offset = (mavisCivilWeekday(active) - first + 7) % 7
        switch key.key {
        case .leftArrow: move(mavisAddCivilDays(active, layoutDirection == .rightToLeft ? 1 : -1)!)
        case .rightArrow: move(mavisAddCivilDays(active, layoutDirection == .rightToLeft ? -1 : 1)!)
        case .upArrow: move(mavisAddCivilDays(active, -7)!)
        case .downArrow: move(mavisAddCivilDays(active, 7)!)
        case .home: move(mavisAddCivilDays(active, -Double(offset))!)
        case .end: move(mavisAddCivilDays(active, Double(6 - offset))!)
        case .pageUp: move(mavisAddCivilMonths(active, key.modifiers.contains(.shift) ? -12 : -1)!)
        case .pageDown: move(mavisAddCivilMonths(active, key.modifiers.contains(.shift) ? 12 : 1)!)
        default: return .ignored
        }
        return .handled
    }
    @ViewBuilder private func day(_ date: String) -> some View {
        let chosen = selected == date || selection.start == date || selection.end == date
        let between = selection.start != nil && selection.end != nil && date >= selection.start! && date <= selection.end!
        let available = !disabled && !readonly && constraints.reason(date) == nil
        Button { if available { onSelect(date) } } label: {
            Text(verbatim: String(mavisCivil(date)!.day)).font(${font('body')}).fontWeight(chosen ? .bold : .regular)
                .foregroundStyle(available ? MavisTokens.text : MavisTokens.muted)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(RoundedRectangle(cornerRadius: ${metric('radius.sm')}).fill(MavisTokens.primarySoft)
                    .joltMotion(to: try! JoltPose(scale: chosen || between ? 1 : 0.8, opacity: chosen || between ? 1 : 0), transition: .spring(.snappy)))
                .overlay(RoundedRectangle(cornerRadius: ${metric('radius.sm')}).strokeBorder(chosen ? MavisTokens.primary : MavisTokens.border, lineWidth: chosen ? 2 : 0).allowsHitTesting(false))
                .opacity(available ? 1 : 0.55)
        }.buttonStyle(.plain).focused($focused, equals: date).accessibilityLabel(Text(verbatim: words.day(date)))
    }
    var body: some View {
        let _ = precondition(constraints.valid && ["en-US", "pt-BR"].contains(locale) && mavisCalendarMonth(active, firstDayOfWeek ?? 0) != nil)
        VStack(spacing: ${metric('space.sm')}) {
            HStack {
                Button { page(-1) } label: { MavisIcon("chevron-left", size: 20) }.buttonStyle(MavisButtonStyle(variant: .ghost, size: .md)).disabled(disabled || !canPage(-1)).accessibilityLabel(Text(verbatim: words.previous))
                Spacer()
                Text(verbatim: words.title(active)).font(${font('body')}).foregroundStyle(MavisTokens.text)
                Spacer()
                Button { page(1) } label: { MavisIcon("chevron-right", size: 20) }.buttonStyle(MavisButtonStyle(variant: .ghost, size: .md)).disabled(disabled || !canPage(1)).accessibilityLabel(Text(verbatim: words.next))
            }
            Grid(horizontalSpacing: 4, verticalSpacing: 4) {
                GridRow { ForEach(0..<7, id: \\.self) { index in Text(verbatim: words.short[(first + index) % 7]).font(${font('caption')}).foregroundStyle(MavisTokens.muted).frame(maxWidth: .infinity).padding(.vertical, 8) } }
                ForEach(0..<(cells.count / 7), id: \\.self) { row in
                    GridRow { ForEach(0..<7, id: \\.self) { column in if let date = cells[row * 7 + column] { day(date) } else { Color.clear.frame(height: 44) } } }
                }
            }
            .offset(x: direction * (1 - motion.value) * ${theme.motion.enterOffset * 2})
            .opacity(0.65 + 0.35 * motion.value)
            .onKeyPress(phases: .down, action: key)
        }
        .background(MavisWindowReader(box: window))
        .onChange(of: active) { before, next in
            if before.prefix(7) != next.prefix(7) { direction = next > before ? 1 : -1; try? motion.set(0); try? motion.animate(to: 1, transition: .spring(.snappy), reducedMotion: reduced || !window.onScreen) }
        }
        .onDisappear { motion.cancel(); try? motion.set(1) }
    }
}

struct MavisCalendar<Footer: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    var range = false
    var selected: String? = nil
    var selection = MavisDateRange()
    var constraints = MavisDateConstraints()
    var locale = "en-US"
    var firstDayOfWeek: Double? = nil
    var initialMonth = "2000-01"
    var disabled = false
    var readonly = false
    var invalidRangeLabel = "This range includes an unavailable date."
    var onSelect: (String) -> Void = { _ in }
    var onRange: (MavisDateRange) -> Void = { _ in }
    var onInvalid: () -> Void = {}
    @ViewBuilder let footer: () -> Footer
    @State private var active: String? = nil
    @State private var invalid = false
    private var first: String { constraints.clamp(selected ?? selection.start ?? constraints.min ?? (initialMonth + "-01")) }
    private func select(_ date: String) {
        guard !disabled, !readonly, constraints.reason(date) == nil else { return }
        invalid = false
        if !range { onSelect(date); return }
        guard let start = selection.start, selection.end == nil else { onRange(MavisDateRange(start: date)); return }
        let next = MavisDateRange(start: Swift.min(start, date), end: Swift.max(start, date))
        if !mavisValidateDateRange(next.start!, next.end!, constraints).valid { invalid = true; onInvalid() } else { onRange(next) }
    }
    var body: some View {
        let _ = precondition(constraints.valid && mavisCivil(initialMonth + "-01") != nil && (selected == nil || mavisCivil(selected!) != nil) && (selection.start == nil || mavisCivil(selection.start!) != nil) && (selection.end == nil || mavisCivil(selection.end!) != nil))
        VStack(alignment: .leading, spacing: ${metric('space.md')}) {
            Text(verbatim: label).font(${font('heading')}).foregroundStyle(MavisTokens.text)
            MavisCalendarGrid(active: active ?? first, selected: selected, selection: selection, constraints: constraints, locale: locale, firstDayOfWeek: firstDayOfWeek, disabled: disabled, readonly: readonly, onActive: { active = $0 }, onSelect: select)
            if invalid { Text(verbatim: invalidRangeLabel).font(${font('body')}).foregroundStyle(MavisTokens.danger) }
            footer()
        }.padding(${metric('space.sm')}).background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.lg')}))
        .onChange(of: selected) { _, _ in active = first; invalid = false }
        .onChange(of: selection) { _, next in active = constraints.clamp(next.end ?? next.start ?? first); invalid = false }
        .onChange(of: initialMonth) { _, _ in active = first; invalid = false }
        .onChange(of: constraints) { _, _ in active = constraints.clamp(active ?? first) }
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['DateLocale', 'DateRange', 'DateRangeDraft', 'DateInputFormat', 'DateValidation'],
    attribute(name, value) {
      if (name === 'value' && value.range)
        return `:modelValue="${expression(`{ start: (${js(value.expr)}).start ?? null, end: (${js(value.expr)}).end ?? null }`)}"`
      if (name === 'onChange' && value.params?.[0]?.type?.k === 'record')
        return `@update:modelValue="${expression(`(value) => (${handlerJs(value)})({ start: value.start ?? undefined, end: value.end ?? undefined })`)}"`
    },
  },
}
