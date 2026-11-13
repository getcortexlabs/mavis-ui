// A bounded union used by choice controls. Identity is JavaScript identity: 1 differs from
// '1', strings compare UTF-16 code units, and signed zero is one numeric choice.
export const choiceValueRuntime = `
enum MavisChoiceValue: Hashable {
    case text(String)
    case number(Double)
    static func == (left: Self, right: Self) -> Bool {
        switch (left, right) {
        case let (.text(a), .text(b)): return a.utf16.elementsEqual(b.utf16)
        case let (.number(a), .number(b)): return a == b
        default: return false
        }
    }
    func hash(into hasher: inout Hasher) {
        switch self {
        case .text(let value): hasher.combine(0); for unit in value.utf16 { hasher.combine(unit) }
        case .number(let value): hasher.combine(1); hasher.combine(value == 0 ? 0 : value)
        }
    }
    var stringValue: String {
        switch self { case .text(let value): return value; case .number(let value): return mavisString(value) }
    }
    var finite: Bool {
        switch self { case .text: return true; case .number(let value): return value.isFinite }
    }
}
func mavisChoice(_ value: String) -> MavisChoiceValue { .text(value) }
func mavisChoice(_ value: Double) -> MavisChoiceValue { .number(value) }
func mavisChoice(_ value: MavisChoiceValue) -> MavisChoiceValue { value }

func mavisNumber(_ value: MavisChoiceValue) -> Double {
    switch value { case .text(let text): return mavisNumber(text); case .number(let number): return number }
}
func mavisCollectionEqual(_ left: MavisChoiceValue, _ right: MavisChoiceValue) -> Bool {
    if case .number(let a) = left, case .number(let b) = right { return a == b || (a.isNaN && b.isNaN) }
    return left == right
}
func mavisCollectionKey(_ value: MavisChoiceValue) -> MavisChoiceValue {
    if case .number(let number) = value, number == 0 { return .number(0) }; return value
}
`
