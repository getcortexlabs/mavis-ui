// Swift for shared modules and for the value helpers of frontends/values.mjs. Text is counted
// and cut in UTF-16 units, as JavaScript does; numbers are read and printed by the ECMAScript
// rules.
import { moduleNames } from './model.mjs'
import { swiftType } from './swift-text.mjs'
import { choiceValueRuntime } from './choice-values.mjs'
import { collectionRuntime } from './collections-swift.mjs'

/** The expressions emit-swift.mjs leaves to this file, or undefined for one it does not know. */
export function swiftValue(emit, e) {
  switch (e.e) {
    case 'choice-optional':
    case 'choice-array':
      return `${emit.wrap(e.value)}.map { MavisChoiceValue.${e.value.type.of.k === 'number' ? 'number' : 'text'}($0) }`
    case 'choice':
      return `MavisChoiceValue.${e.value.type.k === 'number' ? 'number' : 'text'}(${emit.expr(e.value)})`
    case 'date-helper':
      return `(${e.throws ? 'try ' : ''}mavisShared${e.name[0].toUpperCase() + e.name.slice(1)}(${e.args.map((arg) => emit.expr(arg)).join(', ')}))`
    case 'collection-new':
      return e.type.k === 'set'
        ? `MavisSet(${emit.expr(e.items)}, same: mavisCollectionEqual, normalize: mavisCollectionKey)`
        : `MavisMap<${swiftType(e.type.key)}, ${swiftType(e.type.of)}>([${e.pairs.map(({ key, value }) => `(${emit.expr(key)}, ${emit.expr(value)})`).join(', ')}], same: mavisCollectionEqual, normalize: mavisCollectionKey)`
    case 'collection-call':
      return `${emit.expr(e.object)}.${e.method}(${e.args.map((arg) => emit.expr(arg)).join(', ')})`
    case 'collection-size':
      return `Double(${emit.expr(e.object)}.size)`
    case 'collection-array':
      return `${emit.expr(e.object)}.${e.method}()`
    case 'const':
      return `${moduleNames(e.module).swift}.${e.name}`
    case 'invoke':
      return `${moduleNames(e.module).swift}.${e.name}(${e.args.map((arg) => emit.expr(arg)).join(', ')})`
    case 'convert':
      if (e.type.k === 'string') return emit.text(e.arg)
      return e.arg.type.k === 'boolean'
        ? `(${emit.expr(e.arg)} ? 1.0 : 0.0)`
        : `mavisNumber(${emit.expr(e.arg)})`
    case 'check':
      return e.fn === 'isInteger'
        ? `mavisIsInteger(${emit.expr(e.arg)})`
        : `${emit.wrap(e.arg)}.${e.fn}`
    case 'spread':
      return `(${e.lists.map((list) => emit.expr(list)).join(' + ')})`
    case 'cancelled':
      return `${e.ref}.cancelled`
    case 'store':
      return `self.${e.store}.${e.name}`
  }
  return undefined
}

/** The method calls emit-swift.mjs leaves to this file. */
export function swiftValueCall(emit, e) {
  const object = emit.expr(e.object)
  const [first, second] = e.args
  if (e.object.type.k === 'string')
    switch (e.method) {
      case 'split':
        return `mavisSplit(${object}, ${emit.expr(first)})`
      case 'replace':
      case 'replaceAll':
        return `mavisReplace(${object}, ${emit.expr(first)}, ${emit.expr(second)}, all: ${e.method === 'replaceAll'})`
      case 'padStart':
      case 'padEnd':
        return `mavisPad(${object}, ${emit.expr(first)}, ${second ? emit.expr(second) : '" "'}, start: ${e.method === 'padStart'})`
      case 'indexOf':
        return `mavisIndexOf(${object}, ${emit.expr(first)})`
      case 'slice':
        return `mavisSliceText(${object}, ${emit.expr(first)}${second ? `, ${emit.expr(second)}` : ''})`
      case 'repeat':
        return `String(repeating: ${object}, count: ${first.value})`
    }
  if (e.object.type.k === 'number' && e.method === 'toFixed')
    return `mavisFixed(${object}, ${first.value})`
  if (e.object.type.k === 'array')
    switch (e.method) {
      case 'indexOf':
        return `mavisIndexOf(${object}, ${emit.expr(first)})`
      case 'toReversed':
        return `Array(${emit.wrap(e.object)}.reversed())`
      case 'reduce':
        return `${emit.wrap(e.object)}.reduce(${emit.expr(second)}, ${emit.closure(first, swiftType(e.type))})`
    }
  return undefined
}

/** One shared module as a Swift namespace: its constants and functions as static members. */
export function swiftModule(emit, module, header, namespace) {
  const pad = namespace ? '    ' : ''
  const inner = `${pad}    `
  const lines = [`// ${header}`, 'import Foundation', '']
  if (module.constants.some((constant) => constant.type.name === 'NavigationTransitionPolicy'))
    lines.push(
      '// Shared transition policy data; Mac navigation uses the plain NavigationStack fallback.',
      '',
    )
  if (namespace) lines.push(`extension ${namespace} {`)
  lines.push(`${pad}enum ${moduleNames(module.name).swift} {`)
  for (const constant of module.constants)
    lines.push(
      `${inner}static let ${constant.name}: ${swiftType(constant.type)} = ${emit.expr(constant.init)}`,
    )
  for (const fn of module.functions) {
    const params = fn.params.map((param) => `_ ${param.name}: ${swiftType(param.type)}`).join(', ')
    if (lines.at(-1) !== `${pad}enum ${moduleNames(module.name).swift} {`) lines.push('')
    lines.push(
      `${inner}static func ${fn.name}(${params}) -> ${swiftType(fn.returns)} {`,
      emit.statements(fn.body, inner.length + 4),
      `${inner}}`,
    )
  }
  lines.push(`${pad}}`)
  if (namespace) lines.push('}')
  lines.push('')
  return lines.join('\n')
}

export const valueRuntime = `import Foundation

${collectionRuntime}
${choiceValueRuntime}

func mavisSharedIsCivilDate(_ value: String) -> Bool { mavisCivil(value) != nil }
func mavisSharedDaysInMonth(_ year: Double, _ month: Double) -> Double {
    if month == 2 {
        return year.truncatingRemainder(dividingBy: 4) == 0 && (year.truncatingRemainder(dividingBy: 100) != 0 || year.truncatingRemainder(dividingBy: 400) == 0) ? 29 : 28
    }
    return [4.0, 6.0, 9.0, 11.0].contains(month) ? 30 : 31
}
func mavisSharedCivilDate(_ value: String) throws -> String {
    guard mavisCivil(value) != nil else { throw MavisFailure(message: "A civil date must be Gregorian YYYY-MM-DD (0001–9999)") }
    return value
}
func mavisSharedCivilWeekday(_ value: String) throws -> Double {
    guard let ordinal = mavisDateOrdinal(value) else { throw MavisFailure(message: "Invalid civil date") }
    return Double((ordinal + 1) % 7)
}
func mavisSharedAddCivilDays(_ value: String, _ amount: Double) throws -> String {
    guard amount.isFinite, amount.rounded(.towardZero) == amount, abs(amount) <= 9007199254740991 else { throw MavisFailure(message: "Day offset must be an integer") }
    guard let result = mavisAddCivilDays(value, amount) else { throw MavisFailure(message: "Invalid civil date") }
    return result
}
func mavisSharedAddCivilMonths(_ value: String, _ amount: Double) throws -> String {
    guard amount.isFinite, amount.rounded(.towardZero) == amount, abs(amount) <= 9007199254740991 else { throw MavisFailure(message: "Month offset must be an integer") }
    guard let result = mavisAddCivilMonths(value, amount) else { throw MavisFailure(message: "Invalid civil date") }
    return result
}

private func mavisUnits(_ text: String) -> [UInt16] { Array(text.utf16) }

// A cut inside a character outside the Basic Multilingual Plane leaves half of it, which
// JavaScript keeps as it is and Swift shows as U+FFFD.
private func mavisText<S: Sequence>(_ units: S) -> String where S.Element == UInt16 {
    String(decoding: Array(units), as: UTF16.self)
}

private func mavisWhole(_ value: Double) -> Double {
    value.isNaN ? 0 : value.rounded(.towardZero)
}

private func mavisPosition(_ value: Double, _ count: Int) -> Int {
    let length = Double(count)
    let relative = mavisWhole(value)
    return Int(relative < 0 ? max(length + relative, 0) : min(relative, length))
}

/// Where search starts in text at or after from, in UTF-16 units.
private func mavisFind(_ text: [UInt16], _ search: [UInt16], from: Int) -> Int? {
    guard from + search.count <= text.count else { return nil }
    if search.isEmpty { return from }
    var index = from
    let last = text.count - search.count
    while index <= last {
        if text[index] == search[0], text[index..<(index + search.count)].elementsEqual(search) { return index }
        index += 1
    }
    return nil
}

/// String#indexOf(search).
func mavisIndexOf(_ text: String, _ search: String) -> Double {
    mavisFind(mavisUnits(text), mavisUnits(search), from: 0).map(Double.init) ?? -1
}

/// Array#indexOf(value).
func mavisIndexOf<T: Equatable>(_ items: [T], _ value: T) -> Double {
    items.firstIndex(of: value).map(Double.init) ?? -1
}

/// String#split(separator).
func mavisSplit(_ text: String, _ separator: String) -> [String] {
    let units = mavisUnits(text)
    let cut = mavisUnits(separator)
    if cut.isEmpty { return units.map { mavisText([$0]) } }
    var parts: [String] = []
    var start = 0
    while let found = mavisFind(units, cut, from: start) {
        parts.append(mavisText(units[start..<found]))
        start = found + cut.count
    }
    parts.append(mavisText(units[start...]))
    return parts
}

/// String#replace and String#replaceAll for a text to find. In the replacement, $$, $&, $\` and $'
/// mean what they mean in JavaScript.
func mavisReplace(_ text: String, _ search: String, _ replacement: String, all: Bool) -> String {
    let units = mavisUnits(text)
    let find = mavisUnits(search)
    let with = mavisUnits(replacement)
    let dollar = UInt16(36)
    func substitution(_ at: Int) -> [UInt16] {
        var out: [UInt16] = []
        var index = 0
        while index < with.count {
            let unit = with[index]
            let next = index + 1 < with.count ? with[index + 1] : 0
            if unit == dollar, next == dollar {
                out.append(dollar)
            } else if unit == dollar, next == 38 {
                out.append(contentsOf: find)
            } else if unit == dollar, next == 96 {
                out.append(contentsOf: units[..<at])
            } else if unit == dollar, next == 39 {
                out.append(contentsOf: units[(at + find.count)...])
            } else {
                out.append(unit)
                index += 1
                continue
            }
            index += 2
        }
        return out
    }
    var out: [UInt16] = []
    var end = 0
    var from = 0
    while let found = mavisFind(units, find, from: from) {
        out.append(contentsOf: units[end..<found])
        out.append(contentsOf: substitution(found))
        end = found + find.count
        from = found + max(1, find.count)
        if !all { break }
    }
    out.append(contentsOf: units[end...])
    return mavisText(out)
}

/// String#padStart and String#padEnd.
func mavisPad(_ text: String, _ length: Double, _ fill: String, start: Bool) -> String {
    let units = mavisUnits(text)
    let pad = mavisUnits(fill)
    let target = mavisWhole(length)
    guard target > Double(units.count), !pad.isEmpty else { return text }
    let missing = Int(target) - units.count
    var filler: [UInt16] = []
    filler.reserveCapacity(missing + pad.count)
    while filler.count < missing { filler.append(contentsOf: pad) }
    filler.removeLast(filler.count - missing)
    return start ? mavisText(filler) + text : text + mavisText(filler)
}

/// String#slice(start, end).
func mavisSliceText(_ text: String, _ start: Double, _ end: Double? = nil) -> String {
    let units = mavisUnits(text)
    let from = mavisPosition(start, units.count)
    let to = end.map { mavisPosition($0, units.count) } ?? units.count
    return from < to ? mavisText(units[from..<to]) : ""
}

/// Number#toFixed(digits): the number's exact decimal value, rounded half up.
func mavisFixed(_ value: Double, _ digits: Int) -> String {
    if value.isNaN { return "NaN" }
    if abs(value) >= 1e21 { return mavisString(value) }
    // Every binary fraction ends within 1074 decimals, so this prints the value itself.
    let exact = Array(String(format: "%.1074f", abs(value)).utf8)
    let point = exact.firstIndex(of: 46)!
    var kept = Array(exact[..<point]) + exact[(point + 1)..<(point + 1 + digits)]
    if exact[point + 1 + digits] >= 53 {
        var index = kept.count - 1
        while index >= 0, kept[index] == 57 {
            kept[index] = 48
            index -= 1
        }
        if index >= 0 { kept[index] += 1 } else { kept.insert(49, at: 0) }
    }
    let whole = kept.count - digits
    var text = String(decoding: kept[..<whole], as: UTF8.self)
    if digits > 0 { text += "." + String(decoding: kept[whole...], as: UTF8.self) }
    return (value < 0 ? "-" : "") + text
}

/// Number(text): a decimal, hexadecimal, octal or binary literal with white space around it,
/// 0 for an empty text and NaN for anything else.
func mavisNumber(_ text: String) -> Double {
    let units = Array(mavisTrim(text).utf8)
    if units.isEmpty { return 0 }
    func digit(_ unit: UInt8) -> Int? {
        switch unit {
        case 48...57: return Int(unit) - 48
        case 65...70: return Int(unit) - 55
        case 97...102: return Int(unit) - 87
        default: return nil
        }
    }
    if units.count > 1, units[0] == 48, let base = [120: 16, 88: 16, 111: 8, 79: 8, 98: 2, 66: 2][units[1]] {
        guard units.count > 2 else { return .nan }
        var value = 0.0
        for unit in units[2...] {
            guard let next = digit(unit), next < base else { return .nan }
            value = value * Double(base) + Double(next)
        }
        return value
    }
    var body = units[...]
    var sign = 1.0
    if body.first == 43 || body.first == 45 {
        if body.first == 45 { sign = -1 }
        body = body.dropFirst()
    }
    if body.elementsEqual("Infinity".utf8) { return sign * .infinity }
    var index = body.startIndex
    func digits() -> Int {
        let from = index
        while index < body.endIndex, (48...57).contains(body[index]) { index += 1 }
        return index - from
    }
    var mantissa = digits()
    if index < body.endIndex, body[index] == 46 {
        index += 1
        mantissa += digits()
    }
    guard mantissa > 0 else { return .nan }
    if index < body.endIndex, body[index] == 101 || body[index] == 69 {
        index += 1
        if index < body.endIndex, body[index] == 43 || body[index] == 45 { index += 1 }
        guard digits() > 0 else { return .nan }
    }
    guard index == body.endIndex, let value = Double(String(decoding: body, as: UTF8.self)) else { return .nan }
    return sign * value
}

/// Number.isInteger(value).
func mavisIsInteger(_ value: Double) -> Bool {
    value.isFinite && value == value.rounded(.towardZero)
}
`
