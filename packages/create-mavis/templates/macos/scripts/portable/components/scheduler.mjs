import { event, field, named, records, bounded } from './list-parts.mjs'
import { swiftRecord } from './choices.mjs'
import { MCalendar } from './calendar.mjs'
import { schedulerRuntime } from './scheduler-policy.mjs'
const events = records(
  'MScheduler',
  'events',
  {
    id: 'string',
    title: 'string',
    start: 'number',
    end: 'number',
    color: 'string?',
    disabled: 'boolean?',
  },
  '{ id: string; title: string; start: number; end: number }[]',
)
const labels = [
  'previousLabel',
  'nextLabel',
  'moveLabel',
  'resizeLabel',
  'earlierLabel',
  'laterLabel',
  'previousDayLabel',
  'nextDayLabel',
  'shorterLabel',
  'longerLabel',
  'emptyLabel',
]
export const MScheduler = {
  props: {
    id: 'string',
    label: 'string',
    value: events,
    onValueChange: Object.assign(
      event(({ type }) => [type('value')]),
      { ts: 'SchedulerEvent[]' },
    ),
    date: 'string',
    onDateChange: 'string-handler',
    timeZone: 'string',
    days: bounded('days', (v) => [1, 7].includes(v), 'must be 1 or 7.'),
    startHour: bounded(
      'startHour',
      (v) => Number.isInteger(v) && v >= 0 && v <= 23,
      'must be a whole hour from 0 to 23.',
    ),
    endHour: bounded(
      'endHour',
      (v) => Number.isInteger(v) && v >= 1 && v <= 24,
      'must be a whole hour from 1 to 24.',
    ),
    slotMinutes: bounded(
      'slotMinutes',
      (v) => Number.isInteger(v) && v >= 5 && v <= 60 && 60 % v === 0,
      'must be a 5–60 minute divisor of an hour.',
    ),
    hourHeight: bounded(
      'hourHeight',
      (v) => Number.isFinite(v) && v >= 48 && v <= 180,
      'must be between 48 and 180.',
    ),
    dayWidth: bounded(
      'dayWidth',
      (v) => Number.isFinite(v) && v >= 140 && v <= 500,
      'must be between 140 and 500.',
    ),
    animated: 'boolean',
    disabled: 'boolean',
    disambiguation: 'string',
    ...Object.fromEntries(labels.map((n) => [n, 'string'])),
    onChange: Object.assign(
      event(({ record }) => [record('SchedulerChange')]),
      { ts: 'SchedulerChange' },
    ),
    onError: 'string-handler',
    onSelect: 'string-handler',
  },
  required: ['label', 'value', 'date', 'timeZone'],
  control: true,
  uses: [MCalendar, schedulerRuntime],
  types: () =>
    "type SchedulerEvent = { id: string; title: string; start: number; end: number; color?: string; disabled?: boolean }\ntype SchedulerChange = { id: string; start: number; end: number; kind: 'move' | 'resize' }\ntype SchedulerDisambiguation = 'reject' | 'earlier' | 'later'",
  records: { SchedulerEvent: 'scheduler event', SchedulerChange: 'scheduler change' },
  declaration: `declare function MScheduler<T extends SchedulerEvent>(props: { id?: string; label: string; value: readonly T[]; onValueChange?: (value: T[]) => void; date: CivilDate; onDateChange?: (date: CivilDate) => void; timeZone: string; days?: 1 | 7; startHour?: number; endHour?: number; slotMinutes?: number; hourHeight?: number; dayWidth?: number; animated?: boolean; disabled?: boolean; disambiguation?: SchedulerDisambiguation; ${labels.map((n) => n + '?: string').join('; ')}; onChange?: (value: SchedulerChange) => void; onError?: (message: string) => void; onSelect?: (id: string) => void }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context,
      props = node.props,
      rows = props.value,
      pad = ' '.repeat(indent)
    const args = [
      `label: ${emit.value(props.label)}`,
      `events: ${emit.expr(rows.expr)}`,
      `date: ${emit.value(props.date)}`,
      `timeZone: ${emit.value(props.timeZone)}`,
      `data: { MavisSchedulerEvent(id: $0.id, title: $0.title, start: $0.start, end: $0.end, color: ${field(rows.has, 'color', 'nil')}, disabled: ${field(rows.has, 'disabled', 'false')}) }`,
      'setTime: { event, change in var next = event; next.start = change.start; next.end = change.end; return next }',
    ]
    args.push(
      ...named(props, emit, [
        'days',
        'startHour',
        'endHour',
        'slotMinutes',
        'hourHeight',
        'dayWidth',
        'animated',
        'disabled',
        'disambiguation',
        ...labels,
      ]),
    )
    for (const name of ['onValueChange', 'onDateChange', 'onError', 'onSelect'])
      if (props[name]) args.push(`${name}: ${emit.handler(props[name], indent + 4)}`)
    if (props.onChange)
      args.push(
        `onChange: { value in (${emit.handler(props.onChange, indent + 4)})(${swiftRecord(emit, 'SchedulerChange', { id: 'value.id', start: 'value.start', end: 'value.end', kind: 'value.kind' })}) }`,
      )
    return `${pad}MavisScheduler(\n${args.map((arg) => pad + '    ' + arg).join(',\n')}\n${pad})${props.id ? `\n${pad}    .mavisIdentifier(${emit.value(props.id)})` : ''}`
  },
  swiftRuntime: ({
    theme,
    font,
    metric,
  }) => `@MainActor func mavisSchedulerDrag() -> JoltDragModel {
    try! JoltDragModel(bounds: JoltDragBounds(x: -10000...10000, y: -10000...10000), snaps: [])
}
struct MavisSchedulerHandle: View {
    let label: String
    let icon: String
    let disabled: Bool
    let onBegin: () -> Void
    let onMove: (CGSize) -> Void
    let onEnd: () -> Void
    let onCancel: () -> Void
    let onStep: (Double, Double) -> Void
    @StateObject private var drag = mavisSchedulerDrag()
    @GestureState private var active = false
    var body: some View {
        MavisIcon(icon, size: 16).frame(maxWidth: .infinity).frame(height: 24).contentShape(Rectangle())
            .opacity(disabled ? 0.4 : 1).focusable(!disabled, interactions: .edit)
            .accessibilityLabel(Text(verbatim: label))
            .gesture(DragGesture(minimumDistance: 4, coordinateSpace: .global)
                .updating($active) { _, state, _ in state = true }
                .onChanged { value in
                    guard !disabled else { return }
                    if !drag.dragging { drag.move(to: .zero, reducedMotion: true); drag.begin(); onBegin() }
                    drag.update(translation: value.translation)
                    onMove(CGSize(width: drag.position.x, height: drag.position.y))
                }
                .onEnded { _ in guard drag.dragging else { return }; drag.end(cancelled: true); onEnd() })
            .onKeyPress(.upArrow) { if !disabled { onStep(0, -1) }; return .handled }
            .onKeyPress(.downArrow) { if !disabled { onStep(0, 1) }; return .handled }
            .onKeyPress(.leftArrow) { if !disabled { onStep(-1, 0) }; return .handled }
            .onKeyPress(.rightArrow) { if !disabled { onStep(1, 0) }; return .handled }
            .onChange(of: active) { _, active in if !active && drag.dragging { drag.end(cancelled: true); onCancel() } }
            .onChange(of: disabled) { _, disabled in if disabled { drag.end(cancelled: true); onCancel() } }
            .onAppear { drag.resume() }
            .onDisappear { drag.end(cancelled: true); drag.suspend(); onCancel() }
    }
}
struct MavisScheduler<Item: Equatable>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let events: [Item]
    let date: String
    let timeZone: String
    let data: (Item) -> MavisSchedulerEvent
    let setTime: (Item, MavisSchedulerChange) -> Item
    var days: Double = 7
    var startHour: Double = 8
    var endHour: Double = 19
    var slotMinutes: Double = 15
    var hourHeight: Double = 80
    var dayWidth: Double = 180
    var animated = true
    var disabled = false
    var disambiguation = "reject"
    var previousLabel = "Previous"
    var nextLabel = "Next"
    var moveLabel = "Move event"
    var resizeLabel = "Resize event"
    var earlierLabel = "Earlier"
    var laterLabel = "Later"
    var previousDayLabel = "Previous day"
    var nextDayLabel = "Next day"
    var shorterLabel = "Shorter"
    var longerLabel = "Longer"
    var emptyLabel = "No events"
    var onValueChange: ([Item]) -> Void = { _ in }
    var onDateChange: (String) -> Void = { _ in }
    var onError: (String) -> Void = { _ in }
    var onSelect: (String) -> Void = { _ in }
    var onChange: (MavisSchedulerChange) -> Void = { _ in }
    @State private var selected: String?
    @State private var original: MavisSchedulerEvent?
    @State private var operation = "move"
    @State private var draft: MavisSchedulerChange?
    @State private var failure = ""
    @FocusState private var earlierFocused: Bool
    private struct Sync: Equatable {
        let events: [MavisSchedulerEvent]; let date: String; let zone: String; let days: Double; let start: Double; let end: Double; let slot: Double; let hour: Double; let width: Double; let disabled: Bool; let disambiguation: String
    }
    private var source: [MavisSchedulerEvent] { events.map(data) }
    private var sync: Sync { Sync(events: source, date: date, zone: timeZone, days: days, start: startHour, end: endHour, slot: slotMinutes, hour: hourHeight, width: dayWidth, disabled: disabled, disambiguation: disambiguation) }
    private var shown: [MavisSchedulerEvent] { draft.flatMap { try? mavisChangeScheduler(source, $0) } ?? source }
    private func time(_ minute: Int) -> String { String(format: "%02d:%02d", minute / 60, minute % 60) }
    private func describe(_ event: MavisSchedulerEvent) -> String {
        guard let start = try? mavisSchedulerParts(event.start, timeZone), let end = try? mavisSchedulerParts(event.end, timeZone), let offset = try? mavisSchedulerOffset(event.start, timeZone), let finish = try? mavisSchedulerOffset(event.end, timeZone) else { return event.title }
        return event.title + " · " + start.date + " " + time(start.minute) + "–" + time(end.minute) + " · " + timeZone + " " + offset + " → " + finish
    }
    private func cancel() { original = nil; draft = nil }
    private func select(_ event: MavisSchedulerEvent) { guard !disabled && !event.disabled else { return }; selected = event.id; onSelect(event.id); earlierFocused = true }
    private func commit(_ change: MavisSchedulerChange) throws {
        guard !disabled, source.contains(where: { $0.id == change.id && !$0.disabled }) else { return }
        let _ = try mavisChangeScheduler(source, change)
        onValueChange(events.map { data($0).id == change.id ? setTime($0, change) : $0 })
        onChange(change)
    }
    private func change(_ event: MavisSchedulerEvent, minutes: Double, day: Double = 0, kind: String = "move") {
        guard !disabled && !event.disabled else { return }
        failure = ""
        do { try commit(mavisProposeScheduler(event, minutes: minutes, days: day, operation: kind, zone: timeZone, disambiguation: disambiguation)) }
        catch { failure = error.localizedDescription; onError(failure) }
    }
    private func preview(_ translation: CGSize) {
        guard let original, !disabled else { return }
        let minutes = floor(translation.height / hourHeight * 60 / slotMinutes + 0.5) * slotMinutes
        let delta = operation == "move" ? floor(translation.width / dayWidth + 0.5) : 0
        do {
            let proposal = try mavisProposeScheduler(original, minutes: minutes, days: delta, operation: operation, zone: timeZone, disambiguation: disambiguation)
            let _ = try mavisChangeScheduler(source, proposal)
            let start = try mavisSchedulerParts(proposal.start, timeZone), end = try mavisSchedulerParts(proposal.end, timeZone)
            guard let last = mavisAddCivilDays(date, days - 1), start.date >= date, start.date <= last, Double(start.minute) >= startHour * 60, end.date == start.date, Double(end.minute) <= endHour * 60, end.minute > start.minute else { draft = nil; return }
            draft = proposal
        } catch { draft = nil; failure = error.localizedDescription }
    }
    private func end() {
        let pending = draft; cancel()
        do { if let pending { try commit(pending) } else if !failure.isEmpty { onError(failure) } }
        catch { failure = error.localizedDescription; onError(failure) }
    }
    private func handle(_ event: MavisSchedulerEvent, kind: String) -> some View {
        MavisSchedulerHandle(label: (kind == "move" ? moveLabel : resizeLabel) + ": " + event.title, icon: kind == "move" ? "grip" : "minus", disabled: disabled || event.disabled,
            onBegin: { original = event; operation = kind; failure = "" }, onMove: preview, onEnd: end, onCancel: cancel,
            onStep: { x, y in change(event, minutes: (kind == "move" ? y : (y != 0 ? y : x)) * slotMinutes, day: kind == "move" ? x : 0, kind: kind) })
    }
    private func box(_ segment: MavisSchedulerSegment) -> some View {
        let event = segment.event
        let duration = original?.id == event.id ? (original!.end - original!.start) / 60000 : segment.bottom - segment.top
        let full = segment.startsHere && segment.endsHere && duration / 60 * hourHeight >= 100
        return VStack(spacing: 0) {
            if full { handle(event, kind: "move") }
            Button { select(event) } label: { Text(verbatim: event.title).font(${font('caption')}).frame(maxWidth: .infinity, maxHeight: .infinity).padding(4) }
                .buttonStyle(MavisButtonStyle(variant: selected == event.id ? .secondary : .ghost, size: .sm)).disabled(disabled || event.disabled).accessibilityLabel(Text(verbatim: describe(event)))
            if full { handle(event, kind: "resize") }
        }
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.sm')}))
        .overlay(RoundedRectangle(cornerRadius: ${metric('radius.sm')}).strokeBorder(event.color.flatMap { $0.isEmpty ? nil : AnyShapeStyle(mavisColor($0)) } ?? AnyShapeStyle(MavisTokens.primary), lineWidth: 2).allowsHitTesting(false))
        .clipShape(RoundedRectangle(cornerRadius: ${metric('radius.sm')}))
    }
    private func grid(_ days: [MavisSchedulerDay]) -> some View {
        let width = 64 + self.days * dayWidth, height = 44 + (endHour - startHour) * hourHeight
        return ScrollView([.horizontal, .vertical]) {
            ZStack(alignment: .topLeading) {
                ForEach(Array(Int(startHour)..<Int(endHour)), id: \\.self) { hour in
                    HStack(alignment: .top, spacing: 0) {
                        Text(verbatim: time(hour * 60)).font(${font('caption')}).foregroundStyle(MavisTokens.muted).frame(width: 60, alignment: .leading)
                        Rectangle().fill(MavisTokens.border).frame(height: 1)
                    }.frame(width: width, height: hourHeight, alignment: .topLeading).offset(y: 44 + Double(hour - Int(startHour)) * hourHeight).accessibilityHidden(true)
                }
                ForEach(Array(days.enumerated()), id: \\.element.date) { day, value in
                    Text(verbatim: value.date).font(${font('body')}).foregroundStyle(MavisTokens.text).frame(width: dayWidth, height: 40).offset(x: 64 + Double(day) * dayWidth)
                }
                ForEach(days.flatMap(\\.segments)) { segment in
                    box(segment)
                        .frame(width: dayWidth / Double(segment.lanes) - 6, height: Swift.max(28, (segment.bottom - segment.top) / 60 * hourHeight - 3))
                        .offset(x: 64 + Double(segment.day) * dayWidth + Double(segment.lane) * dayWidth / Double(segment.lanes) + 3, y: 44 + (segment.top - startHour * 60) / 60 * hourHeight)
                        .joltLayout(value: segment, transition: animated && original == nil ? .spring(.snappy) : (try! JoltTransition.tween(milliseconds: 0)))
                }
            }.frame(width: width, height: height)
        }.frame(maxHeight: Swift.min(height, 520))
    }
    private func details(_ event: MavisSchedulerEvent) -> some View {
        VStack(alignment: .leading, spacing: ${metric('space.sm')}) {
            Text(verbatim: describe(event)).font(${font('body')}).foregroundStyle(MavisTokens.text)
            MavisStack(spacing: ${metric('space.xs')}, breakpoints: [MavisBreakpoint(at: 600, axis: .horizontal)]) {
                Button(earlierLabel) { change(event, minutes: -slotMinutes) }.buttonStyle(MavisButtonStyle(variant: .secondary)).focused($earlierFocused)
                Button(laterLabel) { change(event, minutes: slotMinutes) }.buttonStyle(MavisButtonStyle(variant: .secondary))
                Button(previousDayLabel) { change(event, minutes: 0, day: -1) }.buttonStyle(MavisButtonStyle(variant: .ghost))
                Button(nextDayLabel) { change(event, minutes: 0, day: 1) }.buttonStyle(MavisButtonStyle(variant: .ghost))
                Button(shorterLabel) { change(event, minutes: -slotMinutes, kind: "resize") }.buttonStyle(MavisButtonStyle(variant: .ghost)).disabled(event.end - event.start <= slotMinutes * 60000)
                Button(longerLabel) { change(event, minutes: slotMinutes, kind: "resize") }.buttonStyle(MavisButtonStyle(variant: .ghost))
            }.disabled(disabled || event.disabled)
        }.padding(${metric('space.md')}).background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${metric('radius.md')}))
    }
    var body: some View {
        let _ = precondition(hourHeight.isFinite && (48...180).contains(hourHeight) && dayWidth.isFinite && (140...500).contains(dayWidth) && slotMinutes.rounded(.towardZero) == slotMinutes && (5...60).contains(slotMinutes) && 60.0.truncatingRemainder(dividingBy: slotMinutes) == 0, "Invalid scheduler geometry or interval.")
        let layout = Result { try mavisSchedulerLayout(shown, date, days, timeZone, startHour, endHour) }
        VStack(alignment: .leading, spacing: ${metric('space.md')}) {
            Text(verbatim: label).font(${font('heading')}).foregroundStyle(MavisTokens.text)
            Text(verbatim: date + " · " + timeZone).font(${font('caption')}).foregroundStyle(MavisTokens.muted)
            HStack(spacing: ${metric('space.sm')}) {
                Button(previousLabel) { if let next = mavisAddCivilDays(date, -days) { onDateChange(next) } }.buttonStyle(MavisButtonStyle(variant: .secondary)).disabled(disabled)
                Button(nextLabel) { if let next = mavisAddCivilDays(date, days) { onDateChange(next) } }.buttonStyle(MavisButtonStyle(variant: .secondary)).disabled(disabled)
            }
            switch layout {
            case .success(let days): grid(days); if days.allSatisfy({ $0.segments.isEmpty }) { Text(verbatim: emptyLabel).font(${font('body')}).foregroundStyle(MavisTokens.muted) }
            case .failure(let error): Text(verbatim: error.localizedDescription).foregroundStyle(MavisTokens.danger)
            }
            if !failure.isEmpty { Text(verbatim: failure).font(${font('body')}).foregroundStyle(MavisTokens.danger) }
            ForEach(source, id: \\.id) { event in
                Button { select(event) } label: { Text(verbatim: describe(event)).frame(maxWidth: .infinity, alignment: .leading) }.buttonStyle(MavisButtonStyle(variant: selected == event.id ? .secondary : .ghost)).disabled(disabled || event.disabled)
            }
            if let event = source.first(where: { $0.id == selected }) { details(event) }
        }
        .onChange(of: sync) { _, _ in cancel() }
        .onExitCommand { cancel() }
        .onDisappear { cancel() }
    }
}`,
  vue: {
    rename: {
      value: 'modelValue',
      onValueChange: 'update:modelValue',
      onDateChange: 'update:date',
    },
    types: ['SchedulerEvent', 'SchedulerChange', 'SchedulerDisambiguation'],
  },
}
