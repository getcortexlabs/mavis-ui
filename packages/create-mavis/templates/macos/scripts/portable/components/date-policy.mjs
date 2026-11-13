// Gregorian arithmetic shared by the calendar and editors. No Date/Calendar or local clock.
export const datePolicy = `struct MavisCivilParts: Equatable { let year: Int; let month: Int; let day: Int }
struct MavisDateValidation: Equatable { let valid: Bool; let complete: Bool; let reason: String? }
struct MavisDateRange: Equatable { var start: String? = nil; var end: String? = nil }
struct MavisDateConstraints: Equatable {
    var min: String? = nil
    var max: String? = nil
    var unavailable: [String] = []
    var valid: Bool {
        (min == nil || mavisCivil(min!) != nil) && (max == nil || mavisCivil(max!) != nil) &&
        (min == nil || max == nil || min! <= max!) && unavailable.allSatisfy { mavisCivil($0) != nil }
    }
    func reason(_ date: String) -> String? {
        if let min, date < min { return "before-min" }
        if let max, date > max { return "after-max" }
        return unavailable.contains(date) ? "unavailable" : nil
    }
    func clamp(_ date: String) -> String {
        if let min, date < min { return min }
        if let max, date > max { return max }
        return date
    }
}
func mavisCivilDays(_ year: Int, _ month: Int) -> Int {
    month == 2 ? (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) ? 29 : 28) : ([4, 6, 9, 11].contains(month) ? 30 : 31)
}
func mavisDateMatches(_ value: String, _ pattern: String) -> Bool {
    value.range(of: pattern, options: .regularExpression) != nil
}
func mavisCivil(_ value: String) -> MavisCivilParts? {
    guard mavisDateMatches(value, "^[0-9]{4}-[0-9]{2}-[0-9]{2}$") else { return nil }
    let pieces = value.split(separator: "-").compactMap { Int($0) }
    guard pieces.count == 3, (1...9999).contains(pieces[0]), (1...12).contains(pieces[1]), (1...mavisCivilDays(pieces[0], pieces[1])).contains(pieces[2]) else { return nil }
    return MavisCivilParts(year: pieces[0], month: pieces[1], day: pieces[2])
}
func mavisCivilString(_ year: Int, _ month: Int, _ day: Int) -> String { String(format: "%04d-%02d-%02d", year, month, day) }
func mavisDateDaysBeforeYear(_ year: Int) -> Int { let n = year - 1; return 365 * n + n / 4 - n / 100 + n / 400 }
func mavisDateOrdinal(_ value: String) -> Int? {
    guard let p = mavisCivil(value) else { return nil }
    return mavisDateDaysBeforeYear(p.year) + (1..<p.month).reduce(0) { $0 + mavisCivilDays(p.year, $1) } + p.day - 1
}
func mavisCivilWeekday(_ value: String) -> Int { (mavisDateOrdinal(value)! + 1) % 7 }
func mavisAddCivilDays(_ value: String, _ amount: Double) -> String? {
    guard let ordinal = mavisDateOrdinal(value), amount.isFinite, amount.rounded(.towardZero) == amount, abs(amount) <= 9007199254740991 else { return nil }
    let target = Int(Swift.max(0, Swift.min(Double(mavisDateDaysBeforeYear(10000) - 1), Double(ordinal) + amount)))
    var low = 1, high = 9999
    while low < high { let middle = (low + high + 1) / 2; if mavisDateDaysBeforeYear(middle) <= target { low = middle } else { high = middle - 1 } }
    var day = target - mavisDateDaysBeforeYear(low) + 1, month = 1
    while day > mavisCivilDays(low, month) { day -= mavisCivilDays(low, month); month += 1 }
    return mavisCivilString(low, month, day)
}
func mavisAddCivilMonths(_ value: String, _ amount: Double) -> String? {
    guard let p = mavisCivil(value), amount.isFinite, amount.rounded(.towardZero) == amount, abs(amount) <= 9007199254740991 else { return nil }
    let target = Int(Swift.max(0, Swift.min(Double(9999 * 12 - 1), Double((p.year - 1) * 12 + p.month - 1) + amount)))
    let year = target / 12 + 1, month = target % 12 + 1
    return mavisCivilString(year, month, Swift.min(p.day, mavisCivilDays(year, month)))
}
func mavisCalendarMonth(_ value: String, _ firstDay: Double) -> [String?]? {
    guard let p = mavisCivil(value), firstDay.rounded(.towardZero) == firstDay, (0...6).contains(firstDay) else { return nil }
    let first = mavisCivilString(p.year, p.month, 1), count = mavisCivilDays(p.year, p.month)
    let offset = (mavisCivilWeekday(first) - Int(firstDay) + 7) % 7
    return (0..<((offset + count + 6) / 7 * 7)).map { index in let day = index - offset + 1; return (1...count).contains(day) ? mavisCivilString(p.year, p.month, day) : nil }
}
func mavisDatePattern(_ format: String, _ locale: String) -> String? {
    switch format {
    case "iso", "yyyy-MM-dd": return "yyyy-MM-dd"
    case "locale": return locale == "pt-BR" ? "dd/MM/yyyy" : "MM/dd/yyyy"
    case "dd/MM/yyyy", "MM/dd/yyyy": return format
    default: return nil
    }
}
func mavisFormatDateInput(_ value: String, _ format: String, _ locale: String) -> String? {
    guard let p = mavisCivil(value), let pattern = mavisDatePattern(format, locale) else { return nil }
    return pattern.replacingOccurrences(of: "yyyy", with: String(format: "%04d", p.year)).replacingOccurrences(of: "MM", with: String(format: "%02d", p.month)).replacingOccurrences(of: "dd", with: String(format: "%02d", p.day))
}
func mavisParseDateInput(_ value: String, _ format: String, _ locale: String) -> String? {
    guard let pattern = mavisDatePattern(format, locale) else { return nil }
    if pattern == "yyyy-MM-dd" { return mavisCivil(value) == nil ? nil : value }
    guard mavisDateMatches(value, "^[0-9]{2}/[0-9]{2}/[0-9]{4}$") else { return nil }
    let p = value.split(separator: "/").map(String.init)
    let iso = p[2] + "-" + (pattern == "dd/MM/yyyy" ? p[1] : p[0]) + "-" + (pattern == "dd/MM/yyyy" ? p[0] : p[1])
    return mavisCivil(iso) == nil ? nil : iso
}
func mavisValidateDateInput(_ value: String, _ constraints: MavisDateConstraints, _ format: String = "iso", _ locale: String = "en-US") -> MavisDateValidation {
    precondition(constraints.valid && mavisDatePattern(format, locale) != nil)
    if value.isEmpty { return MavisDateValidation(valid: true, complete: false, reason: "empty") }
    if let parsed = mavisParseDateInput(value, format, locale) { let reason = constraints.reason(parsed); return MavisDateValidation(valid: reason == nil, complete: true, reason: reason) }
    let pattern = mavisDatePattern(format, locale) == "yyyy-MM-dd" ? "^[0-9]{0,4}(-[0-9]{0,2}(-[0-9]{0,2})?)?$" : "^[0-9]{0,2}(/[0-9]{0,2}(/[0-9]{0,4})?)?$"
    return MavisDateValidation(valid: false, complete: false, reason: value.count < 10 && mavisDateMatches(value, pattern) ? "incomplete" : "invalid")
}
func mavisValidateDateRange(_ start: String, _ end: String, _ constraints: MavisDateConstraints, _ format: String = "iso", _ locale: String = "en-US") -> MavisDateValidation {
    let a = mavisValidateDateInput(start, constraints, format, locale), b = mavisValidateDateInput(end, constraints, format, locale), complete = a.complete && b.complete
    if !a.valid { return MavisDateValidation(valid: false, complete: complete, reason: a.reason) }
    if !b.valid { return MavisDateValidation(valid: false, complete: complete, reason: b.reason) }
    guard let first = mavisParseDateInput(start, format, locale), let last = mavisParseDateInput(end, format, locale) else { return MavisDateValidation(valid: true, complete: false, reason: start.isEmpty && end.isEmpty ? "empty" : "partial") }
    if first > last { return MavisDateValidation(valid: false, complete: true, reason: "reversed") }
    if constraints.unavailable.contains(where: { $0 >= first && $0 <= last }) { return MavisDateValidation(valid: false, complete: true, reason: "unavailable-range") }
    return MavisDateValidation(valid: true, complete: true, reason: nil)
}`

export const dateRuntime = { swiftRuntime: () => datePolicy }
