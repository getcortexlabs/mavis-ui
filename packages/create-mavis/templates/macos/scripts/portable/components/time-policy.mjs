export const timePolicy = `struct MavisTimeValidation: Equatable { let status: String; let value: String? }
struct MavisTimeOptions: Equatable {
    var min: String? = nil
    var max: String? = nil
    var minuteStep: Double = 1
    var locale = "en-US"
    var hourCycle: String? = nil
}
struct MavisResolvedTime { let min: Int; let max: Int; let step: Int; let cycle: String }
func mavisTimeMinutes(_ value: String) -> Int? {
    guard value.range(of: "^([01][0-9]|2[0-3]):[0-5][0-9]$", options: .regularExpression) != nil else { return nil }
    let parts = value.split(separator: ":").compactMap { Int($0) }
    return parts.count == 2 ? parts[0] * 60 + parts[1] : nil
}
func mavisLocalTime(_ minutes: Int) -> String { String(format: "%02d:%02d", minutes / 60, minutes % 60) }
func mavisTimeOptions(_ options: MavisTimeOptions) -> MavisResolvedTime? {
    let minimum = options.min.flatMap(mavisTimeMinutes) ?? 0, maximum = options.max.flatMap(mavisTimeMinutes) ?? 1439, step = options.minuteStep
    let cycle = options.hourCycle ?? (options.locale == "pt-BR" ? "h23" : "h12")
    guard (options.min == nil || mavisTimeMinutes(options.min!) != nil), (options.max == nil || mavisTimeMinutes(options.max!) != nil), minimum <= maximum,
        step.isFinite, step.rounded(.towardZero) == step, (1...30).contains(step), 60 % Int(step) == 0,
        ["en-US", "pt-BR"].contains(options.locale), ["h12", "h23"].contains(cycle),
        ((minimum + Int(step) - 1) / Int(step)) * Int(step) <= maximum else { return nil }
    return MavisResolvedTime(min: minimum, max: maximum, step: Int(step), cycle: cycle)
}
func mavisValidateTime(_ value: String?, _ options: MavisTimeOptions) -> MavisTimeValidation {
    guard let options = mavisTimeOptions(options) else { preconditionFailure("Invalid time options") }
    guard let value else { return MavisTimeValidation(status: "empty", value: nil) }
    guard let minutes = mavisTimeMinutes(value) else { return MavisTimeValidation(status: "invalid", value: nil) }
    if minutes < options.min || minutes > options.max { return MavisTimeValidation(status: "range", value: nil) }
    if minutes % options.step != 0 { return MavisTimeValidation(status: "step", value: nil) }
    return MavisTimeValidation(status: "valid", value: value)
}
func mavisFormatTime(_ value: String?, _ options: MavisTimeOptions) -> String? {
    guard let options = mavisTimeOptions(options) else { return nil }
    guard let value else { return "" }
    guard let minutes = mavisTimeMinutes(value) else { return nil }
    if options.cycle == "h23" { return value }
    let hour = minutes / 60
    return "\\(hour % 12 == 0 ? 12 : hour % 12):" + String(format: "%02d", minutes % 60) + (hour < 12 ? " AM" : " PM")
}
func mavisParseTime(_ draft: String, _ options: MavisTimeOptions) -> MavisTimeValidation {
    guard let resolved = mavisTimeOptions(options) else { preconditionFailure("Invalid time options") }
    let text = draft.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    if text.isEmpty { return MavisTimeValidation(status: "empty", value: nil) }
    let pattern = resolved.cycle == "h23" ? "^([0-9]{1,2}):([0-9]{2})$" : "^([0-9]{1,2}):([0-9]{2})[[:space:]]*(AM|PM)$"
    let regex = try! NSRegularExpression(pattern: pattern)
    guard let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) else {
        let incomplete = text.range(of: "^[0-9]{0,2}(:[0-9]{0,2})?[[:space:]]*[APM]{0,2}$", options: .regularExpression) != nil
        return MavisTimeValidation(status: incomplete ? "incomplete" : "invalid", value: nil)
    }
    let source = text as NSString
    var hour = Int(source.substring(with: match.range(at: 1)))!
    let minute = Int(source.substring(with: match.range(at: 2)))!
    guard minute <= 59 else { return MavisTimeValidation(status: "invalid", value: nil) }
    if resolved.cycle == "h12" {
        guard (1...12).contains(hour) else { return MavisTimeValidation(status: "invalid", value: nil) }
        hour = hour % 12 + (source.substring(with: match.range(at: 3)) == "PM" ? 12 : 0)
    } else if hour > 23 { return MavisTimeValidation(status: "invalid", value: nil) }
    return mavisValidateTime(mavisLocalTime(hour * 60 + minute), options)
}`
export const timeRuntime = { swiftRuntime: () => timePolicy }
