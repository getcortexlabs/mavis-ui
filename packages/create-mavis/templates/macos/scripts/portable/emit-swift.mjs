// SwiftUI output. JavaScript semantics are kept where the platforms differ: numbers are
// Double, text length counts UTF-16 units, number text follows Number#toString, and
// trim/splice/slice/Math.round follow the ECMAScript rules (see runtime below).

export function swiftString(text) {
  if (!text.isWellFormed()) throw new Error('Text must contain well-formed Unicode.')
  return `"${Array.from(text, (char) => {
    if (char === '\\') return '\\\\'
    if (char === '"') return '\\"'
    const code = char.codePointAt(0)
    // Control characters and invisible separators stay readable and unambiguous in the source.
    return code < 0x20 ||
      (code >= 0x7f && code <= 0x9f) ||
      code === 0x2028 ||
      code === 0x2029 ||
      code === 0xfeff
      ? `\\u{${code.toString(16)}}`
      : char
  }).join('')}"`
}

const swiftNumber = (value) => {
  const text = String(Math.abs(value))
  const literal = /[.e]/.test(text) ? text : `${text}.0`
  return value < 0 || Object.is(value, -0) ? `-${literal}` : literal
}

export function swiftType(type) {
  switch (type.k) {
    case 'string':
      return 'String'
    case 'number':
      return 'Double'
    case 'boolean':
      return 'Bool'
    case 'record':
      return type.name
    case 'array':
      return `[${swiftType(type.of)}]`
    case 'optional':
      return `${swiftType(type.of)}?`
    case 'function':
      return `(${type.params.map(swiftType).join(', ')}) -> Void`
  }
  throw new Error(`No Swift type for ${type.k}`)
}

export class SwiftEmitter {
  constructor(model) {
    this.records = new Map(model.records.map((record) => [record.name, record]))
  }

  text(e) {
    // The text a JavaScript template literal or + would produce for a primitive.
    if (e.type.k === 'number') return `mavisString(${this.expr(e)})`
    if (e.type.k === 'boolean') return `String(${this.expr(e)})`
    return this.expr(e)
  }

  interpolate(parts) {
    if (parts.length === 1 && typeof parts[0] === 'string') return swiftString(parts[0])
    if (parts.length === 1) return this.text(parts[0])
    return `"${parts
      .map((part) =>
        typeof part === 'string' ? swiftString(part).slice(1, -1) : `\\(${this.text(part)})`,
      )
      .join('')}"`
  }

  closure(e, returns) {
    return `{ (${e.param}: ${swiftType(e.type)}) -> ${returns} in ${this.expr(e.body)} }`
  }

  expr(e) {
    switch (e.e) {
      case 'lit':
        return typeof e.value === 'string'
          ? swiftString(e.value)
          : typeof e.value === 'number'
            ? swiftNumber(e.value)
            : String(e.value)
      case 'undefined':
        return 'nil'
      case 'template':
        return this.interpolate(e.parts)
      case 'state':
      case 'getter':
        return `self.${e.name}`
      case 'prop':
        // Initial state is computed in init, before self is available: use the parameter.
        return this.initializing ? e.name : `self.${e.name}`
      case 'local':
        return e.name
      case 'length':
        return e.object.type.k === 'string'
          ? `Double(${this.wrap(e.object)}.utf16.count)`
          : `Double(${this.wrap(e.object)}.count)`
      case 'field':
        return `${this.wrap(e.object)}${e.optional ? '?' : ''}.${e.name}`
      case 'math': {
        const [a, b] = e.args.map((arg) => this.expr(arg))
        return {
          min: `min(${a}, ${b})`,
          max: `max(${a}, ${b})`,
          floor: `(${a}).rounded(.down)`,
          ceil: `(${a}).rounded(.up)`,
          abs: `abs(${a})`,
          round: `mavisRound(${a})`,
        }[e.fn]
      }
      case 'call':
        return this.call(e)
      case 'unary':
        return `${e.op}${this.wrap(e.arg)}`
      case 'binary':
        return this.binary(e)
      case 'logical':
        return `(${this.expr(e.left)} ${e.op} ${this.expr(e.right)})`
      case 'cond':
        return `(${this.expr(e.test)} ? ${this.expr(e.then)} : ${this.expr(e.else)})`
      case 'record':
        return this.record(e)
      case 'array':
        return e.items.length
          ? `[${e.items.map((item) => this.expr(item)).join(', ')}]`
          : `([] as ${swiftType(e.type)})`
    }
    throw new Error(`Unknown expression ${e.e}`)
  }

  wrap(e) {
    return ['state', 'getter', 'prop', 'local', 'field', 'call', 'lit', 'array', 'length'].includes(
      e.e,
    ) && !(e.e === 'lit' && typeof e.value === 'number' && e.value < 0)
      ? this.expr(e)
      : `(${this.expr(e)})`
  }

  call(e) {
    const object = this.wrap(e.object)
    const [first, second] = e.args
    if (e.object.type.k === 'string') {
      switch (e.method) {
        case 'trim':
          return `mavisTrim(${this.expr(e.object)})`
        case 'toLowerCase':
          return `${object}.lowercased()`
        case 'toUpperCase':
          return `${object}.uppercased()`
        case 'includes':
          return `mavisIncludes(${this.expr(e.object)}, ${this.expr(first)})`
        case 'startsWith':
          return `${object}.hasPrefix(${this.expr(first)})`
        case 'endsWith':
          return `${object}.hasSuffix(${this.expr(first)})`
      }
    }
    switch (e.method) {
      case 'filter':
        return `${object}.filter ${this.closure(first, 'Bool')}`
      case 'some':
        return `${object}.contains(where: ${this.closure(first, 'Bool')})`
      case 'every':
        return `${object}.allSatisfy ${this.closure(first, 'Bool')}`
      case 'find':
        return `${object}.first(where: ${this.closure(first, 'Bool')})`
      case 'findIndex':
        return `mavisFindIndex(${this.expr(e.object)}, ${this.closure(first, 'Bool')})`
      case 'map':
        return `${object}.map ${this.closure(first, swiftType(first.body.type))}`
      case 'includes':
        return `${object}.contains(${this.expr(first)})`
      case 'slice':
        return `mavisSlice(${this.expr(e.object)}, ${this.expr(first)}${second ? `, ${this.expr(second)}` : ''})`
      case 'join':
        return `${object}.joined(separator: ${this.expr(first)})`
    }
    throw new Error(`Unknown method ${e.method}`)
  }

  binary(e) {
    const left = this.expr(e.left)
    const right = this.expr(e.right)
    switch (e.op) {
      case 'concat':
        return `(${this.text(e.left)} + ${this.text(e.right)})`
      case '%':
        return `${this.wrap(e.left)}.truncatingRemainder(dividingBy: ${right})`
      case '===':
        return `(${left} == ${right})`
      case '!==':
        return `(${left} != ${right})`
      default:
        return `(${left} ${e.op} ${right})`
    }
  }

  record(e) {
    const definition = this.records.get(e.name)
    if (e.spread) {
      if (!e.fields.length) return this.expr(e.spread)
      return `mavisCopy(${this.expr(e.spread)}) { mavisValue in ${e.fields
        .map((field) => `mavisValue.${field.name} = ${this.expr(field.value)}`)
        .join('; ')} }`
    }
    const values = new Map(e.fields.map((field) => [field.name, field.value]))
    return `${e.name}(${definition.fields
      .map((field) => `${field.name}: ${this.expr(values.get(field.name))}`)
      .join(', ')})`
  }

  path(target) {
    return ['self', target.name, ...target.fields].join('.')
  }

  statements(list, indent) {
    const pad = ' '.repeat(indent)
    return list
      .map((s) => {
        switch (s.s) {
          case 'assign':
            return s.op === '+=' && s.target.type.k === 'string'
              ? `${pad}${this.path(s.target)} += ${this.text(s.value)}`
              : `${pad}${this.path(s.target)} ${s.op} ${this.expr(s.value)}`
          case 'const':
            return `${pad}let ${s.name}: ${swiftType(s.type)} = ${this.expr(s.value)}`
          case 'return':
            return `${pad}return`
          case 'guard':
            return `${pad}guard let ${s.name} else { return }`
          case 'iflet': {
            const otherwise = s.else.length
              ? ` else {\n${this.statements(s.else, indent + 4)}\n${pad}}`
              : ''
            return `${pad}if let ${s.name} {\n${this.statements(s.then, indent + 4) || `${pad}    `}\n${pad}}${otherwise}`
          }
          case 'action':
          case 'callback':
            return `${pad}self.${s.name}(${s.args.map((arg) => this.expr(arg)).join(', ')})`
          case 'push':
            return `${pad}${this.path(s.target)}.append(${this.expr(s.value)})`
          case 'unshift':
            return `${pad}${this.path(s.target)}.insert(${this.expr(s.value)}, at: 0)`
          case 'splice':
            return `${pad}mavisSplice(&${this.path(s.target)}, ${this.expr(s.start)}, ${this.expr(s.deleteCount)}, [${s.items.map((item) => this.expr(item)).join(', ')}])`
          case 'if': {
            const otherwise =
              s.else.length === 1 && s.else[0].s === 'if'
                ? ` else ${this.statements(s.else, indent).trimStart()}`
                : s.else.length
                  ? ` else {\n${this.statements(s.else, indent + 4)}\n${pad}}`
                  : ''
            return `${pad}if ${this.expr(s.test)} {\n${this.statements(s.then, indent + 4) || `${pad}    `}\n${pad}}${otherwise}`
          }
        }
        throw new Error(`Unknown statement ${s.s}`)
      })
      .join('\n')
  }

  handler(handler, indent) {
    const params = handler.params
      .map((param) => `${param.name}: ${swiftType(param.type)}`)
      .join(', ')
    const head = params ? `(${params}) in` : ''
    const body = this.statements(handler.body, indent + 4)
    return `{${head ? ` ${head}` : ''}\n${body}\n${' '.repeat(indent)}}`
  }

  view(node, indent, tokens) {
    const pad = ' '.repeat(indent)
    switch (node.v) {
      case 'element': {
        const props = node.props
        if (node.tag === 'MButton') {
          const label =
            'lit' in props.text ? swiftString(props.text.lit) : this.expr(props.text.expr)
          const variant = props.variant
            ? 'lit' in props.variant
              ? String(props.variant.lit === 'secondary')
              : `(${this.expr(props.variant.expr)} == "secondary")`
            : 'false'
          const lines = [
            `${pad}Button(action: ${this.handler(props.onClick, indent)}) {`,
            `${pad}    Text(verbatim: ${label})`,
            `${pad}}`,
            `${pad}    .buttonStyle(MavisStarterButtonStyle(secondary: ${variant}))`,
          ]
          if (props.disabled)
            lines.push(
              `${pad}    .disabled(${'lit' in props.disabled ? 'true' : this.expr(props.disabled.expr)})`,
            )
          return lines.join('\n')
        }
        const spacing = tokens.space(props.gap, 'none')
        const stack =
          node.tag === 'MColumn'
            ? `VStack(alignment: .leading, spacing: ${spacing})`
            : `HStack(alignment: .center, spacing: ${spacing})`
        const body = node.children
          .map((childNode) => this.view(childNode, indent + 4, tokens))
          .join('\n')
        const lines = [`${pad}${stack} {`, body || `${pad}    EmptyView()`, `${pad}}`]
        if (props.padding) lines.push(`${pad}    .padding(${tokens.space(props.padding)})`)
        return lines.join('\n')
      }
      case 'text': {
        const props = node.props
        const content = this.interpolate(node.parts)
        const lines = [`${pad}Text(verbatim: ${content})`]
        if (!props.variant || 'lit' in props.variant) {
          const variant = props.variant?.lit ?? 'body'
          lines.push(`${pad}    .font(${tokens.font(variant)})`)
          if (['title', 'heading', 'display'].includes(variant))
            lines.push(`${pad}    .accessibilityAddTraits(.isHeader)`)
        } else {
          const variant = this.expr(props.variant.expr)
          lines.push(`${pad}    .font(MavisTokens.font(${variant}))`)
          lines.push(
            `${pad}    .accessibilityAddTraits(MavisTokens.isHeading(${variant}) ? .isHeader : [])`,
          )
        }
        lines.push(
          !props.tone || 'lit' in props.tone
            ? `${pad}    .foregroundStyle(${tokens.color(props.tone?.lit ?? 'text')})`
            : `${pad}    .foregroundStyle(MavisTokens.tone(${this.expr(props.tone.expr)}))`,
        )
        lines.push(`${pad}    .fixedSize(horizontal: false, vertical: true)`)
        return lines.join('\n')
      }
      case 'show': {
        const then = node.then
          .map((childNode) => this.view(childNode, indent + 4, tokens))
          .join('\n')
        const otherwise = node.else
          .map((childNode) => this.view(childNode, indent + 4, tokens))
          .join('\n')
        return [
          `${pad}if ${this.expr(node.when)} {`,
          then || `${pad}    EmptyView()`,
          ...(otherwise ? [`${pad}} else {`, otherwise] : []),
          `${pad}}`,
        ].join('\n')
      }
      case 'for': {
        const element = swiftType(node.each.type.of)
        const keyPath = node.key ? `\\.${node.key}` : '\\.self'
        if (!node.index)
          return [
            `${pad}ForEach(${this.expr(node.each)}, id: ${keyPath}) { (${node.item}: ${element}) in`,
            this.view(node.body, indent + 4, tokens),
            `${pad}}`,
          ].join('\n')
        return [
          `${pad}ForEach(Array(${this.expr(node.each)}.enumerated()), id: ${node.key ? `\\.element.${node.key}` : '\\.element'}) { entry in`,
          `${pad}    let ${node.item}: ${element} = entry.element`,
          `${pad}    let ${node.index}: Double = Double(entry.offset)`,
          this.view(node.body, indent + 4, tokens),
          `${pad}}`,
        ].join('\n')
      }
      case 'component': {
        if (!node.props.length) return `${pad}${node.name}()`
        const args = node.props.map(({ name, value }) =>
          value.handler
            ? `${name}: ${this.handler(value.handler, indent + 4)}`
            : `${name}: ${this.expr(value.expr)}`,
        )
        return `${pad}${node.name}(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
      }
    }
    throw new Error(`Unknown view ${node.v}`)
  }

  component(component, tokens, header, namespace) {
    const lines = [`// ${header}`, 'import SwiftUI', '']
    const indent = namespace ? 4 : 0
    const pad = ' '.repeat(indent)
    if (namespace) lines.push(`extension ${namespace} {`)
    lines.push(`${pad}struct ${component.name}: View {`)
    const inner = pad + '    '
    for (const prop of component.props)
      lines.push(`${inner}let ${prop.name}: ${swiftType(prop.type)}`)
    for (const value of component.state)
      lines.push(`${inner}@State private var ${value.name}: ${swiftType(value.type)}`)
    if (component.props.length || component.state.length) {
      lines.push('')
      const params = component.props
        .map(
          (prop) =>
            `${prop.name}: ${prop.type.k === 'function' ? '@escaping ' : ''}${swiftType(prop.type)}`,
        )
        .join(', ')
      lines.push(`${inner}init(${params}) {`)
      for (const prop of component.props) lines.push(`${inner}    self.${prop.name} = ${prop.name}`)
      this.initializing = true
      for (const value of component.state)
        lines.push(`${inner}    _${value.name} = State(initialValue: ${this.expr(value.init)})`)
      this.initializing = false
      lines.push(`${inner}}`)
    }
    for (const getter of component.getters) {
      lines.push('', `${inner}private var ${getter.name}: ${swiftType(getter.type)} {`)
      for (const local of getter.locals)
        lines.push(
          `${inner}    let ${local.name}: ${swiftType(local.type)} = ${this.expr(local.value)}`,
        )
      lines.push(`${inner}    return ${this.expr(getter.expr)}`, `${inner}}`)
    }
    for (const action of component.actions) {
      const params = action.params
        .map((param) => `_ ${param.name}: ${swiftType(param.type)}`)
        .join(', ')
      lines.push('', `${inner}private func ${action.name}(${params}) {`)
      const body = this.statements(action.body, indent + 8)
      if (body) lines.push(body)
      lines.push(`${inner}}`)
    }
    lines.push(
      '',
      `${inner}var body: some View {`,
      this.view(component.view, indent + 8, tokens),
      `${inner}}`,
    )
    lines.push(`${pad}}`)
    if (namespace) lines.push('}')
    lines.push('')
    return lines.join('\n')
  }

  types(records, header, namespace) {
    const lines = [`// ${header}`, 'import Foundation', '']
    if (namespace) lines.push(`enum ${namespace} {}`, '', `extension ${namespace} {`)
    const pad = namespace ? '    ' : ''
    for (const record of records) {
      lines.push(`${pad}struct ${record.name}: Hashable {`)
      for (const field of record.fields)
        lines.push(`${pad}    var ${field.name}: ${swiftType(field.type)}`)
      lines.push(`${pad}}`)
    }
    if (namespace) lines.push('}')
    lines.push('')
    return lines.join('\n')
  }
}

export function themeTokens(theme) {
  const weights = {
    normal: 'regular',
    bold: 'bold',
    100: 'ultraLight',
    200: 'thin',
    300: 'light',
    400: 'regular',
    500: 'medium',
    600: 'semibold',
    700: 'bold',
    800: 'heavy',
    900: 'black',
  }
  const pick = (family, value, fallback, what) => {
    const key = value ?? fallback
    if (!Object.hasOwn(family, key)) throw new Error(`Unsupported ${what} token ${key}.`)
    return family[key]
  }
  const font = (variant) => {
    const typo = pick(theme.typography, variant, 'body', 'typography')
    return `.system(size: ${typo.fontSize}, weight: .${weights[typo.fontWeight]})`
  }
  const tokens = {
    space: (value, fallback) => String(pick(theme.space, value?.lit ?? value, fallback, 'space')),
    font,
    color: (tone) => {
      pick(theme.colors, tone, 'text', 'color')
      return `MavisTokens.${tone}`
    },
  }
  const colors = Object.entries(theme.colors).map(([key, value]) => {
    if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Unsupported color token ${key}.`)
    const hex = Number.parseInt(value.slice(1), 16)
    return `    static let ${key} = Color(red: ${((hex >> 16) & 255) / 255}, green: ${((hex >> 8) & 255) / 255}, blue: ${(hex & 255) / 255})`
  })
  const source = `import SwiftUI

enum MavisTokens {
${colors.join('\n')}

    static func tone(_ name: String) -> Color {
        switch name {
${Object.keys(theme.colors)
  .map((key) => `        case ${swiftString(key)}: return ${key}`)
  .join('\n')}
        default: return text
        }
    }

    static func font(_ variant: String) -> Font {
        switch variant {
${Object.keys(theme.typography)
  .map((key) => `        case ${swiftString(key)}: return ${font(key)}`)
  .join('\n')}
        default: return ${font('body')}
        }
    }

    static func isHeading(_ variant: String) -> Bool {
        ["title", "heading", "display"].contains(variant)
    }
}

struct MavisStarterButtonStyle: ButtonStyle {
    let secondary: Bool
    @Environment(\\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\\.isEnabled) private var isEnabled
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .semibold))
            .padding(.horizontal, 20).padding(.vertical, 12)
            .foregroundStyle(secondary ? MavisTokens.text : MavisTokens.onPrimary)
            .background(secondary ? MavisTokens.elevated : MavisTokens.primary, in: RoundedRectangle(cornerRadius: 12))
            .opacity(isEnabled ? (configuration.isPressed ? 0.8 : 1) : 0.45)
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.98 : 1)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.15), value: configuration.isPressed)
    }
}
`
  return { tokens, source }
}

export const runtime = `import Foundation

/// Number#toString(10) from ECMAScript, so text shows the same digits on the Web and macOS.
func mavisString(_ value: Double) -> String {
    if value.isNaN { return "NaN" }
    if value == 0 { return "0" }
    if value.isInfinite { return value < 0 ? "-Infinity" : "Infinity" }
    if value < 0 { return "-" + mavisString(-value) }
    // Swift prints the shortest round-trip digits; only the layout differs from JavaScript.
    let printed = "\\(value)".lowercased()
    let parts = printed.split(separator: "e", maxSplits: 1)
    let mantissa = parts[0]
    let exponent = parts.count > 1 ? Int(parts[1])! : 0
    let pieces = mantissa.split(separator: ".", maxSplits: 1, omittingEmptySubsequences: false)
    let whole = String(pieces[0])
    let fraction = pieces.count > 1 ? String(pieces[1]) : ""
    var digits = Array(whole + fraction)
    var point = whole.count + exponent
    while let first = digits.first, first == "0", digits.count > 1 {
        digits.removeFirst()
        point -= 1
    }
    while let last = digits.last, last == "0", digits.count > 1 { digits.removeLast() }
    let s = String(digits)
    let k = digits.count
    let n = point
    if k <= n && n <= 21 { return s + String(repeating: "0", count: n - k) }
    if 0 < n && n <= 21 { return String(digits[0..<n]) + "." + String(digits[n...]) }
    if -6 < n && n <= 0 { return "0." + String(repeating: "0", count: -n) + s }
    let e = n - 1
    let sign = e < 0 ? "-" : "+"
    let head = k == 1 ? s : String(digits[0]) + "." + String(digits[1...])
    return head + "e" + sign + String(abs(e))
}

/// String#trim: ECMAScript white space and line terminators.
func mavisTrim(_ text: String) -> String {
    func space(_ scalar: Unicode.Scalar) -> Bool {
        switch scalar.value {
        case 0x9, 0xA, 0xB, 0xC, 0xD, 0x20, 0xA0, 0x1680, 0x2000...0x200A, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF:
            return true
        default:
            return false
        }
    }
    let scalars = text.unicodeScalars
    guard let start = scalars.firstIndex(where: { !space($0) }),
          let end = scalars.lastIndex(where: { !space($0) }) else { return "" }
    return String(scalars[start...end])
}

func mavisIncludes(_ text: String, _ search: String) -> Bool {
    search.isEmpty || text.range(of: search, options: .literal) != nil
}

func mavisRound(_ value: Double) -> Double {
    let floor = value.rounded(.down)
    return value - floor >= 0.5 ? floor + 1 : floor
}

func mavisFindIndex<T>(_ items: [T], _ match: (T) -> Bool) -> Double {
    items.firstIndex(where: match).map(Double.init) ?? -1
}

private func mavisInteger(_ value: Double) -> Double {
    value.isNaN ? 0 : value.rounded(.towardZero)
}

private func mavisClamp(_ value: Double, _ count: Int) -> Int {
    let length = Double(count)
    let relative = mavisInteger(value)
    return Int(relative < 0 ? max(length + relative, 0) : min(relative, length))
}

/// Array#splice(start, deleteCount, ...items), including negative and out-of-range indices.
func mavisSplice<T>(_ items: inout [T], _ start: Double, _ deleteCount: Double, _ inserted: [T]) {
    let from = mavisClamp(start, items.count)
    let count = Int(min(max(mavisInteger(deleteCount), 0), Double(items.count - from)))
    items.replaceSubrange(from..<(from + count), with: inserted)
}

/// Array#slice(start, end).
func mavisSlice<T>(_ items: [T], _ start: Double, _ end: Double? = nil) -> [T] {
    let from = mavisClamp(start, items.count)
    let to = end.map { mavisClamp($0, items.count) } ?? items.count
    return from < to ? Array(items[from..<to]) : []
}

/// Object spread for records: a changed copy.
func mavisCopy<T>(_ value: T, _ change: (inout T) -> Void) -> T {
    var copy = value
    change(&copy)
    return copy
}
`
