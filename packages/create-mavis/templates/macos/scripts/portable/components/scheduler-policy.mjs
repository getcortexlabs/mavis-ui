// Epoch milliseconds at the boundary; civil arithmetic stays independent of the machine's zone.
export const schedulerPolicy = `struct MavisSchedulerError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}
struct MavisSchedulerCivil: Equatable { let date: String; let minute: Int }
struct MavisSchedulerEvent: Equatable {
    let id: String
    let title: String
    var start: Double
    var end: Double
    var color: String? = nil
    var disabled = false
}
struct MavisSchedulerChange: Equatable { let id: String; let start: Double; let end: Double; let kind: String }
struct MavisSchedulerSegment: Identifiable, Equatable {
    var event: MavisSchedulerEvent
    let day: Int
    let date: String
    let top: Double
    let bottom: Double
    var lane = 0
    var lanes = 1
    let startsHere: Bool
    let endsHere: Bool
    var id: String { "\\(event.id.utf8.count):" + event.id + (startsHere && endsHere ? ":full" : ":" + date) }
}
struct MavisSchedulerDay: Equatable { let date: String; var segments: [MavisSchedulerSegment] }
func mavisSchedulerCivilMillis(_ value: MavisSchedulerCivil) throws -> Double {
    guard let ordinal = mavisDateOrdinal(value.date), (0..<1440).contains(value.minute) else { throw MavisSchedulerError(message: "Invalid scheduler civil time.") }
    return Double(ordinal - mavisDateOrdinal("1970-01-01")!) * 86400000 + Double(value.minute) * 60000
}
func mavisSchedulerParts(_ instant: Double, _ timeZone: String) throws -> MavisSchedulerCivil {
    guard instant.isFinite, abs(instant) <= 8640000000000000, let zone = TimeZone(identifier: timeZone), !timeZone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw MavisSchedulerError(message: "Scheduler requires an explicit, valid timeZone and timestamp.") }
    var calendar = Calendar(identifier: .iso8601)
    calendar.timeZone = zone
    let parts = calendar.dateComponents([.era, .year, .month, .day, .hour, .minute], from: Date(timeIntervalSince1970: instant.rounded(.towardZero) / 1000))
    guard parts.era == 1, let year = parts.year, (1...9999).contains(year), let month = parts.month, let day = parts.day, let hour = parts.hour, let minute = parts.minute else { throw MavisSchedulerError(message: "Scheduler civil dates require years 0001–9999.") }
    return MavisSchedulerCivil(date: mavisCivilString(year, month, day), minute: hour * 60 + minute)
}
func mavisSchedulerInstant(_ value: MavisSchedulerCivil, _ timeZone: String, _ disambiguation: String = "reject") throws -> Double {
    guard ["reject", "earlier", "later"].contains(disambiguation) else { throw MavisSchedulerError(message: "Invalid scheduler disambiguation.") }
    guard !timeZone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw MavisSchedulerError(message: "Scheduler requires an explicit timeZone.") }
    let nominal = try mavisSchedulerCivilMillis(value)
    var offsets = Set<Double>()
    for hours in stride(from: -36, through: 36, by: 6) {
        let instant = nominal + Double(hours) * 3600000
        offsets.insert(try mavisSchedulerCivilMillis(mavisSchedulerParts(instant, timeZone)) - instant)
    }
    let matches = try offsets.map { nominal - $0 }.filter { try mavisSchedulerParts($0, timeZone) == value }.sorted()
    guard !matches.isEmpty else { throw MavisSchedulerError(message: "This local time does not exist in the selected time zone.") }
    if matches.count > 1 && disambiguation == "reject" { throw MavisSchedulerError(message: "This local time occurs twice. Choose earlier or later explicitly.") }
    return disambiguation == "later" ? matches.last! : matches.first!
}
func mavisSchedulerEventsValid(_ events: [MavisSchedulerEvent]) -> Bool {
    events.count <= 500 && Set(events.map(\\.id)).count == events.count && events.allSatisfy {
        !$0.id.isEmpty && !$0.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && $0.start.isFinite && $0.end.isFinite && $0.end > $0.start && $0.end - $0.start <= 31 * 86400000 && abs($0.start) <= 8640000000000000 && abs($0.end) <= 8640000000000000 && ($0.color == nil || $0.color!.isEmpty || $0.color!.range(of: "^#[0-9a-fA-F]{6}$", options: .regularExpression) != nil)
    }
}
func mavisChangeScheduler(_ events: [MavisSchedulerEvent], _ change: MavisSchedulerChange) throws -> [MavisSchedulerEvent] {
    guard mavisSchedulerEventsValid(events) else { throw MavisSchedulerError(message: "Invalid scheduler events.") }
    guard let event = events.first(where: { $0.id == change.id }), !event.disabled else { return events }
    let result = events.map { item in var next = item; if item.id == change.id { next.start = change.start; next.end = change.end }; return next }
    guard mavisSchedulerEventsValid(result) else { throw MavisSchedulerError(message: "Scheduler events require a title, ordered epoch milliseconds (duration <=31 days) and optional HEX color.") }
    return result
}
func mavisSchedulerLayout(_ events: [MavisSchedulerEvent], _ date: String, _ days: Double, _ timeZone: String, _ startHour: Double = 0, _ endHour: Double = 24) throws -> [MavisSchedulerDay] {
    let noon = try mavisSchedulerCivilMillis(MavisSchedulerCivil(date: date, minute: 720))
    let _ = try mavisSchedulerParts(noon, timeZone)
    guard mavisSchedulerEventsValid(events), [1, 7].contains(days), startHour.rounded(.towardZero) == startHour, endHour.rounded(.towardZero) == endHour, startHour >= 0, endHour <= 24, startHour < endHour else { throw MavisSchedulerError(message: "Scheduler needs a day/week and ordered whole-hour bounds.") }
    return try (0..<Int(days)).map { day in
        guard let civil = mavisAddCivilDays(date, Double(day)) else { throw MavisSchedulerError(message: "Scheduler civil dates require years 0001–9999.") }
        var segments: [MavisSchedulerSegment] = []
        for event in events {
            let start = try mavisSchedulerParts(event.start, timeZone), end = try mavisSchedulerParts(event.end, timeZone)
            if start.date > civil || end.date < civil || (end.date == civil && end.minute == 0) { continue }
            let top = Swift.max(startHour * 60, start.date < civil ? 0 : Double(start.minute)), bottom = Swift.min(endHour * 60, end.date > civil ? 1440 : Double(end.minute))
            let repeated = end.minute <= start.minute && Double(start.minute) >= startHour * 60 && Double(start.minute) < endHour * 60 && event.end > event.start && start.date == civil && end.date == civil
            let finish = repeated ? Swift.min(endHour * 60, top + (event.end - event.start) / 60000) : bottom
            if finish > top { segments.append(MavisSchedulerSegment(event: event, day: day, date: civil, top: top, bottom: finish, startsHere: start.date == civil, endsHere: end.date == civil)) }
        }
        segments.sort { a, b in
            if a.top != b.top { return a.top < b.top }
            if a.event.start != b.event.start { return a.event.start < b.event.start }
            return a.event.id.compare(b.event.id, locale: Locale(identifier: "en-US")) == .orderedAscending
        }
        var group: [Int] = [], ends: [Double] = [], groupEnd = 0.0
        func finish() { for index in group { segments[index].lanes = ends.count }; group = []; ends = [] }
        for index in segments.indices {
            if !group.isEmpty && segments[index].top >= groupEnd { finish() }
            let lane = ends.firstIndex(where: { $0 <= segments[index].top }) ?? ends.count
            if lane == ends.count { ends.append(segments[index].bottom) } else { ends[lane] = segments[index].bottom }
            segments[index].lane = lane
            group.append(index)
            groupEnd = ends.max()!
        }
        finish()
        return MavisSchedulerDay(date: civil, segments: segments)
    }
}
func mavisSchedulerOffset(_ instant: Double, _ timeZone: String) throws -> String {
    let nominal = try mavisSchedulerCivilMillis(mavisSchedulerParts(instant, timeZone))
    let minutes = Int(floor((nominal - (instant / 60000).rounded(.down) * 60000) / 60000 + 0.5))
    return "UTC" + (minutes >= 0 ? "+" : "−") + String(format: "%02d:%02d", abs(minutes) / 60, abs(minutes) % 60)
}
func mavisProposeScheduler(_ event: MavisSchedulerEvent, minutes: Double, days: Double, operation: String, zone: String, disambiguation: String) throws -> MavisSchedulerChange {
    let target = operation == "move" ? event.start : event.end, civil = try mavisSchedulerParts(target, zone)
    let nominal = try mavisSchedulerCivilMillis(MavisSchedulerCivil(date: civil.date, minute: 0)) + (Double(civil.minute) + minutes) * 60000 + days * 86400000
    let next = try mavisSchedulerParts(nominal, "UTC")
    let instant = try mavisSchedulerInstant(next, zone, disambiguation) + (target - (target / 60000).rounded(.down) * 60000)
    return MavisSchedulerChange(id: event.id, start: operation == "move" ? instant : event.start, end: operation == "move" ? instant + event.end - event.start : instant, kind: operation)
}`
export const schedulerRuntime = { swiftRuntime: () => schedulerPolicy }
