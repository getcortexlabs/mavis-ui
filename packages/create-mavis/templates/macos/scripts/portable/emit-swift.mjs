// SwiftUI output. JavaScript semantics are kept where the platforms differ: numbers are
// Double, text length counts UTF-16 units, number text follows Number#toString, and
// trim/splice/slice/Math.round follow the ECMAScript rules (see runtime below).

/** The JoltSwiftUI package every generated Mac app links. */
export const joltSwift = Object.freeze({
  url: 'https://github.com/rafaelaugustos/jolt-swift.git',
  version: '0.1.0-rc.14',
})

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
    const params = e.params.map((name, i) => `${name}: ${swiftType(e.types[i])}`).join(', ')
    return `{ (${params}) -> ${returns} in ${this.expr(e.body)} }`
  }

  value(prop) {
    return 'lit' in prop ? swiftString(prop.lit) : this.expr(prop.expr)
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
      case 'index':
        return `mavisAt(${this.expr(e.object)}, ${this.expr(e.index)})`
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
      case 'cond': {
        if (!e.narrow) return `(${this.expr(e.test)} ? ${this.expr(e.then)} : ${this.expr(e.else)})`
        const [some, none] = e.narrow.op === '!==' ? [e.then, e.else] : [e.else, e.then]
        return `({ () -> ${swiftType(e.type)} in if let ${e.narrow.name} { return ${this.expr(some)} }; return ${this.expr(none)} })()`
      }
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
      case 'toSorted':
        return `mavisSorted(${this.expr(e.object)}, ${this.closure(first, 'Double')})`
    }
    throw new Error(`Unknown method ${e.method}`)
  }

  binary(e) {
    const left = this.expr(e.left)
    const right = this.expr(e.right)
    // JavaScript orders strings by UTF-16 code units.
    if (e.strings && ['<', '>', '<=', '>='].includes(e.op))
      return {
        '<': `mavisBefore(${left}, ${right})`,
        '>': `mavisBefore(${right}, ${left})`,
        '<=': `!mavisBefore(${right}, ${left})`,
        '>=': `!mavisBefore(${left}, ${right})`,
      }[e.op]
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
          case 'focus':
            return `${pad}self.mavisFocus = ${swiftString(s.ref)}`
          case 'blur':
            return `${pad}if self.mavisFocus == ${swiftString(s.ref)} { self.mavisFocus = nil }`
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
          if (props.shortcut) {
            const key = props.shortcut.lit.slice(4)
            lines.push(
              `${pad}    .keyboardShortcut(${key === 'Enter' ? '.return' : `KeyEquivalent(${swiftString(key)})`}, modifiers: .command)`,
            )
          }
          return lines.join('\n')
        }
        if (node.tag === 'MGrid' || node.tag === 'MCard') {
          const body =
            node.children.map((childNode) => this.view(childNode, indent + 4, tokens)).join('\n') ||
            `${pad}    EmptyView()`
          if (node.tag === 'MGrid') {
            // Each cell reads as a whole, in source order. Without a group per cell,
            // assistive technology goes by position and interleaves the columns.
            const cells =
              node.children
                .map((childNode) =>
                  [
                    `${pad}    Group {`,
                    this.view(childNode, indent + 8, tokens),
                    `${pad}    }`,
                    `${pad}        .accessibilityElement(children: .contain)`,
                  ].join('\n'),
                )
                .join('\n') || `${pad}    EmptyView()`
            const args = [
              ...(props.minColumnWidth
                ? [`minColumnWidth: ${this.expr(props.minColumnWidth.expr)}`]
                : []),
              ...(props.columns ? [`columns: ${this.expr(props.columns.expr)}`] : []),
              `spacing: ${tokens.space(props.gap, 'none')}`,
            ]
            return [`${pad}MavisGrid(${args.join(', ')}) {`, cells, `${pad}}`].join('\n')
          }
          const tone = !props.tone
            ? 'MavisTokens.surface'
            : 'lit' in props.tone
              ? tokens.color(props.tone.lit)
              : `MavisTokens.tone(${this.expr(props.tone.expr)})`
          const args = [
            `tone: ${tone}`,
            ...(props.padding ? [`padding: ${tokens.space(props.padding)}`] : []),
            `spacing: ${tokens.space(props.gap, 'none')}`,
          ]
          const card = [`MavisCard(${args.join(', ')}) {`, body, `${pad}}`]
          if (!props.onClick)
            return [
              `${pad}${card[0]}`,
              ...card.slice(1),
              ...(props.label
                ? [
                    `${pad}    .accessibilityElement(children: .contain)`,
                    `${pad}    .accessibilityLabel(Text(verbatim: ${this.value(props.label)}))`,
                  ]
                : []),
            ].join('\n')
          // One button for assistive technology, like the Web card with role="button".
          return [
            `${pad}Button(action: ${this.handler(props.onClick, indent)}) {`,
            `${pad}    ${card[0]}`,
            body
              .split('\n')
              .map((line) => `    ${line}`)
              .join('\n'),
            `${pad}    }`,
            `${pad}}`,
            `${pad}    .buttonStyle(MavisCardButtonStyle())`,
            `${pad}    .accessibilityLabel(Text(verbatim: ${this.value(props.label)}))`,
            `${pad}    .accessibilityIdentifier("mavis-card")`,
          ].join('\n')
        }
        if (node.tag === 'MInput') return this.input(node, indent)
        if (node.tag === 'MCheckbox')
          return this.control(node, indent, 'MavisCheckbox', [
            ['label', 'label'],
            ['checked', 'checked'],
            ['onChange', 'onChange'],
            ['indeterminate', 'indeterminate'],
            ['helperText', 'helperText'],
            ['disabled', 'disabled'],
          ])
        if (node.tag === 'MSelect')
          return this.control(node, indent, 'MavisSelect', [
            ['label', 'label'],
            ['value', 'value'],
            ['options', 'options'],
            ['onChange', 'onChange'],
            ['placeholder', 'placeholder'],
            ['helperText', 'helperText'],
            ['error', 'error'],
            ['disabled', 'disabled'],
          ])
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
        if (node.animatesList) {
          const list = animatedFor(node)
          const keys = list.key
            ? `${this.wrap(list.each)}.map(\\.${list.key})`
            : this.expr(list.each)
          lines.push(`${pad}    .joltLayout(value: ${keys})`)
        }
        if (props.label)
          lines.push(
            `${pad}    .accessibilityElement(children: .contain)`,
            `${pad}    .accessibilityLabel(Text(verbatim: ${this.value(props.label)}))`,
          )
        if (props.onKeyDown) {
          const key = this.focusKey('stack')
          lines.push(
            // In the Tab order without keyboard navigation turned on, and focused by a click
            // anywhere in it, like the Web stack with tabindex="0".
            `${pad}    .contentShape(Rectangle())`,
            `${pad}    .focusable(interactions: .edit)`,
            `${pad}    .focused($mavisFocus, equals: ${key})`,
            `${pad}    .simultaneousGesture(TapGesture().onEnded { self.mavisFocus = ${key} })`,
            `${pad}    .onKeyPress(keys: [.upArrow, .downArrow, .leftArrow, .rightArrow]) { press in`,
            // Arrow keys also carry .function and .numericPad; only real modifiers opt out.
            `${pad}        guard press.modifiers.isDisjoint(with: [.command, .option, .control, .shift]) else { return .ignored }`,
            `${pad}        let handle: (String) -> Void = ${this.handler(props.onKeyDown, indent + 8)}`,
            `${pad}        handle(mavisKeyName(press.key))`,
            `${pad}        return .handled`,
            `${pad}    }`,
          )
        }
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
        if (node.animate) {
          // JoltPresence keeps leaving content until its exit finishes; Reduce Motion settles it.
          const presence = (when, body) => [
            `${pad}JoltPresence(${when}) {`,
            body.map((childNode) => this.view(childNode, indent + 4, tokens)).join('\n') ||
              `${pad}    EmptyView()`,
            `${pad}}`,
          ]
          const shown = this.expr(node.when)
          return [
            ...presence(shown, node.then),
            ...(node.else.length ? presence(`!${this.wrap(node.when)}`, node.else) : []),
          ].join('\n')
        }
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
        this.forKeys.push(node.key ? `${node.item}.${node.key}` : node.item)
        try {
          return this.forEach(node, indent, tokens, element, pad)
        } finally {
          this.forKeys.pop()
        }
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

  forEach(node, indent, tokens, element, pad) {
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

  // Arguments in the helper's declaration order; Swift requires it for defaulted parameters.
  control(node, indent, name, order, extra = []) {
    const pad = ' '.repeat(indent)
    const args = []
    for (const [prop, label] of order) {
      const value = node.props[prop]
      if (!value) continue
      if ('body' in value) args.push(`${label}: ${this.handler(value, indent + 4)}`)
      else if (prop === 'options')
        args.push(
          `${label}: ${this.wrap(value.expr)}.map { option in MavisChoice(value: option.value, label: option.label, disabled: option.disabled ?? false) }`,
        )
      else args.push(`${label}: ${this.value(value)}`)
    }
    args.push(...extra)
    return `${pad}${name}(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
  }

  // Unique per view, and per row inside For.
  focusKey(kind) {
    return `"${kind}${++this.fields}${this.forKeys.map((key) => `:\\(${key})`).join('')}"`
  }

  input(node, indent) {
    const ref = node.props.ref?.ref
    // Every field has a focus key: refs move focus to it, the focus border reads it.
    const key = ref ? swiftString(ref) : this.focusKey('field')
    const type = node.props.type?.lit ?? 'text'
    return this.control(
      node,
      indent,
      'MavisTextInput',
      [
        ['label', 'label'],
        ['value', 'value'],
        ['onChange', 'onChange'],
      ],
      [
        `focus: $mavisFocus`,
        `focusKey: ${key}`,
        ...[
          ['placeholder', 'placeholder'],
          ['helperText', 'helperText'],
          ['error', 'error'],
        ]
          .filter(([prop]) => node.props[prop])
          .map(([prop, label]) => `${label}: ${this.value(node.props[prop])}`),
        ...(type === 'password' ? ['secure: true'] : []),
        ...(type === 'email' ? ['email: true'] : []),
        ...[
          ['multiline', 'multiline'],
          ['rows', 'rows'],
          ['maxLength', 'maxLength'],
          ['disabled', 'disabled'],
          ['readonly', 'readonly'],
          ['onSubmit', 'onSubmit'],
          ['onEscape', 'onEscape'],
        ]
          .filter(([prop]) => node.props[prop])
          .map(([prop, label]) =>
            'body' in node.props[prop]
              ? `${label}: ${this.handler(node.props[prop], indent + 4)}`
              : `${label}: ${this.value(node.props[prop])}`,
          ),
      ],
    )
  }

  component(component, tokens, header, namespace) {
    const lines = [`// ${header}`, 'import SwiftUI', 'import JoltSwiftUI', '']
    const indent = namespace ? 4 : 0
    const pad = ' '.repeat(indent)
    if (namespace) lines.push(`extension ${namespace} {`)
    lines.push(`${pad}struct ${component.name}: View {`)
    const inner = pad + '    '
    for (const prop of component.props)
      lines.push(`${inner}let ${prop.name}: ${swiftType(prop.type)}`)
    for (const value of component.state)
      lines.push(`${inner}@State private var ${value.name}: ${swiftType(value.type)}`)
    if (hasInput(component.view)) lines.push(`${inner}@FocusState private var mavisFocus: String?`)
    this.fields = 0
    this.forKeys = []
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

const children = (node) => [
  ...(node.children ?? []),
  ...(node.then ?? []),
  ...(node.else ?? []),
  ...(node.body ? [node.body] : []),
]
const animatedFor = (node) =>
  children(node)
    .map((child) =>
      child.v === 'for' && child.animate ? child : child.v === 'show' ? animatedFor(child) : null,
    )
    .find(Boolean)

function hasInput(node) {
  if (node.tag === 'MInput' || node.props?.onKeyDown) return true
  return [
    ...(node.children ?? []),
    ...(node.then ?? []),
    ...(node.else ?? []),
    ...(node.body ? [node.body] : []),
  ].some(hasInput)
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
import JoltSwiftUI

enum MavisTokens {
${colors.join('\n')}
    /// System controls draw in the theme's appearance, whatever the Mac uses.
    static let colorScheme: ColorScheme = .${theme.appearance === 'dark' ? 'dark' : 'light'}

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

/// MButton: Mavis tokens for the look, Jolt for the press. Jolt settles under Reduce Motion.
struct MavisStarterButtonStyle: ButtonStyle {
    let secondary: Bool
    @Environment(\\.isEnabled) private var isEnabled
    private static let pressed = try! JoltPose(scale: ${theme.motion.pressScale})
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .semibold))
            .padding(.horizontal, 20).padding(.vertical, 12)
            .foregroundStyle(secondary ? MavisTokens.text : MavisTokens.onPrimary)
            .background(secondary ? MavisTokens.elevated : MavisTokens.primary, in: RoundedRectangle(cornerRadius: 12))
            .opacity(isEnabled ? 1 : 0.45)
            .joltMotion(to: configuration.isPressed && isEnabled ? Self.pressed : .identity, transition: .spring(.snappy))
    }
}
`
  const input = theme.components.input
  const radius = theme.radius[input.radius] ?? theme.radius.md
  const body = theme.typography.body
  const caption = theme.typography.caption
  const card = theme.components.card
  const cardPadding = typeof card.padding === 'number' ? card.padding : theme.space[card.padding]
  const cardRadius = typeof card.radius === 'number' ? card.radius : theme.radius[card.radius]
  const controls = `import SwiftUI
import JoltSwiftUI

/// MGrid: equal columns, as many as fit minColumnWidth, like the Web and NativeScript grid.
struct MavisGrid: Layout {
    var minColumnWidth: Double? = nil
    var columns: Double? = nil
    var spacing: Double = 0

    private func count(_ width: CGFloat) -> Int {
        let limit = columns.map { max(1, Int($0)) }
        guard let minColumnWidth, width.isFinite else { return limit ?? 1 }
        let fit = max(1, Int((max(0, width) + spacing) / (minColumnWidth + spacing)))
        return limit.map { min($0, fit) } ?? fit
    }

    private func rows(_ subviews: Subviews, _ width: CGFloat) -> (count: Int, column: CGFloat, heights: [CGFloat]) {
        let count = count(width)
        let column = max(0, (width - spacing * CGFloat(count - 1)) / CGFloat(count))
        var heights: [CGFloat] = []
        for start in stride(from: 0, to: subviews.count, by: count) {
            let row = subviews[start..<min(start + count, subviews.count)]
            heights.append(row.map { $0.sizeThatFits(ProposedViewSize(width: column, height: nil)).height }.max() ?? 0)
        }
        return (count, column, heights)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? subviews.map { $0.sizeThatFits(.unspecified).width }.max() ?? 0
        let heights = rows(subviews, width).heights
        return CGSize(width: width, height: heights.reduce(0, +) + spacing * CGFloat(max(0, heights.count - 1)))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let layout = rows(subviews, bounds.width)
        var y = bounds.minY
        for (row, height) in layout.heights.enumerated() {
            for column in 0..<layout.count {
                let index = row * layout.count + column
                guard index < subviews.count else { break }
                subviews[index].place(
                    at: CGPoint(x: bounds.minX + CGFloat(column) * (layout.column + spacing), y: y),
                    anchor: .topLeading,
                    proposal: ProposedViewSize(width: layout.column, height: height)
                )
            }
            y += height + spacing
        }
    }
}

/// MCard: the theme's card surface around a column of content.
struct MavisCard<Content: View>: View {
    var tone: Color = MavisTokens.surface
    var padding: Double = ${cardPadding}
    var spacing: Double = 0
    @ViewBuilder var content: () -> Content
    var body: some View {
        VStack(alignment: .leading, spacing: spacing) { content() }
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tone, in: RoundedRectangle(cornerRadius: ${cardRadius}))
            .overlay(RoundedRectangle(cornerRadius: ${cardRadius}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
    }
}

/// A card with onClick: the whole surface presses, through Jolt.
struct MavisCardButtonStyle: ButtonStyle {
    @Environment(\\.isEnabled) private var isEnabled
    private static let pressed = try! JoltPose(scale: ${theme.motion.pressScale})
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .contentShape(RoundedRectangle(cornerRadius: ${cardRadius}))
            .opacity(isEnabled ? 1 : 0.45)
            .joltMotion(to: configuration.isPressed && isEnabled ? Self.pressed : .identity, transition: .spring(.snappy))
    }
}

/// One MSelect option, without the shared record type so every project can use it.
struct MavisChoice: Hashable {
    let value: String
    let label: String
    let disabled: Bool
}

private struct MavisFieldLabel: View {
    let text: String
    var body: some View {
        // The control carries the label for assistive technology.
        Text(verbatim: text)
            .font(.system(size: ${caption.fontSize}, weight: .semibold))
            .foregroundStyle(MavisTokens.text)
            .accessibilityHidden(true)
    }
}

private struct MavisFieldMessage: View {
    let label: String
    let text: String
    let error: Bool
    var body: some View {
        Text(verbatim: text)
            .font(${font('caption')})
            .foregroundStyle(error ? MavisTokens.danger : MavisTokens.muted)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityIdentifier("mavis-message:" + label)
    }
}

/// MInput: the value stays with the source; the field keeps a draft so maxLength and
/// readonly hold while typing, like the Web input.
struct MavisTextInput: View {
    let label: String
    let value: String
    let onChange: (String) -> Void
    let focus: FocusState<String?>.Binding
    let focusKey: String
    let placeholder: String
    let helperText: String
    let error: String
    let secure: Bool
    let email: Bool
    let multiline: Bool
    let rows: Double
    let maxLength: Double?
    let disabled: Bool
    let readonly: Bool
    let onSubmit: (() -> Void)?
    let onEscape: (() -> Void)?
    @State private var draft: String
    // Values sent to the source that have not come back yet. Typing can run ahead of them.
    @State private var pending: [String] = []

    init(
        label: String,
        value: String,
        onChange: @escaping (String) -> Void,
        focus: FocusState<String?>.Binding,
        focusKey: String,
        placeholder: String = "",
        helperText: String = "",
        error: String = "",
        secure: Bool = false,
        email: Bool = false,
        multiline: Bool = false,
        rows: Double = 3,
        maxLength: Double? = nil,
        disabled: Bool = false,
        readonly: Bool = false,
        onSubmit: (() -> Void)? = nil,
        onEscape: (() -> Void)? = nil
    ) {
        self.label = label
        self.value = value
        self.onChange = onChange
        self.focus = focus
        self.focusKey = focusKey
        self.placeholder = placeholder
        self.helperText = helperText
        self.error = error
        self.secure = secure
        self.email = email
        self.multiline = multiline
        self.rows = rows
        self.maxLength = maxLength
        self.disabled = disabled
        self.readonly = readonly
        self.onSubmit = onSubmit
        self.onEscape = onEscape
        _draft = State(initialValue: value)
    }

    private var focused: Bool { focus.wrappedValue == focusKey }
    private var message: String { error.isEmpty ? helperText : error }
    private var border: Color {
        !error.isEmpty ? MavisTokens.danger : focused ? MavisTokens.primary : MavisTokens.border
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.sm}) {
            MavisFieldLabel(text: label)
            editor
                .font(${font('body')})
                .foregroundStyle(MavisTokens.text)
                .background(readonly ? MavisTokens.elevated : MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${radius}))
                // The border only draws. Left hit-testable, it takes clicks on the field's middle line.
                .overlay(RoundedRectangle(cornerRadius: ${radius}).strokeBorder(border, lineWidth: focused ? 2 : 1).allowsHitTesting(false))
                .focused(focus, equals: focusKey)
                .accessibilityLabel(Text(verbatim: label))
                .onKeyPress(.escape) {
                    guard let onEscape else { return .ignored }
                    onEscape()
                    return .handled
                }
            if !message.isEmpty {
                MavisFieldMessage(label: label, text: message, error: !error.isEmpty)
            }
        }
        .disabled(disabled)
        .opacity(disabled ? 0.5 : 1)
        .environment(\\.colorScheme, MavisTokens.colorScheme)
        .onChange(of: value) { _, next in
            if let index = pending.firstIndex(of: next) {
                pending.removeFirst(index + 1)
            } else {
                // Changed by the source itself: show its value.
                pending = []
                if next != draft { draft = next }
            }
        }
        .onChange(of: draft) { _, next in
            let allowed = readonly ? value : mavisLimit(next, maxLength)
            if allowed != next {
                draft = allowed
            } else if next != value && pending.last != next {
                pending.append(next)
                onChange(next)
            }
        }
    }

    @ViewBuilder private var editor: some View {
        if multiline {
            TextEditor(text: $draft)
                .scrollContentBackground(.hidden)
                .frame(minHeight: rows * ${body.fontSize * input.lineHeight})
                .padding(.horizontal, ${input.paddingX - 5})
                .padding(.vertical, ${input.paddingY - 4})
                .overlay(alignment: .topLeading) {
                    if draft.isEmpty && !placeholder.isEmpty {
                        Text(verbatim: placeholder)
                            .foregroundStyle(MavisTokens.muted)
                            .padding(.horizontal, ${input.paddingX})
                            .padding(.vertical, ${input.paddingY})
                            .allowsHitTesting(false)
                            .accessibilityHidden(true)
                    }
                }
        } else if secure {
            SecureField(text: $draft, prompt: prompt) { Text(verbatim: label) }
                .textFieldStyle(.plain)
                .labelsHidden()
                .onSubmit { onSubmit?() }
                .padding(.horizontal, ${input.paddingX})
                .padding(.vertical, ${input.paddingY})
        } else {
            TextField(text: $draft, prompt: prompt) { Text(verbatim: label) }
                .textFieldStyle(.plain)
                .labelsHidden()
                .autocorrectionDisabled(email)
                .onSubmit { onSubmit?() }
                .padding(.horizontal, ${input.paddingX})
                .padding(.vertical, ${input.paddingY})
        }
    }

    private var prompt: Text? {
        placeholder.isEmpty ? nil : Text(verbatim: placeholder).foregroundStyle(MavisTokens.muted)
    }
}

/// MCheckbox: the system checkbox. A mixed checkbox turns on when clicked, as on the Web.
struct MavisCheckbox: View {
    let label: String
    let checked: Bool
    let onChange: (Bool) -> Void
    var indeterminate: Bool = false
    var helperText: String = ""
    var disabled: Bool = false

    private var sources: [Binding<Bool>] {
        let source = Binding(get: { indeterminate ? false : checked }, set: { onChange($0) })
        // Two sources that disagree draw the mixed state.
        return indeterminate ? [source, .constant(true)] : [source]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.xs}) {
            Toggle(sources: sources, isOn: \\.self) {
                Text(verbatim: label)
                    .font(.system(size: ${body.fontSize}, weight: .semibold))
                    .foregroundStyle(MavisTokens.text)
            }
            .toggleStyle(.checkbox)
            .tint(MavisTokens.primary)
            if !helperText.isEmpty {
                MavisFieldMessage(label: label, text: helperText, error: false)
            }
        }
        .disabled(disabled)
        .environment(\\.colorScheme, MavisTokens.colorScheme)
    }
}

/// MSelect: a menu picker. With no value it shows the placeholder as an explicit empty choice.
struct MavisSelect: View {
    let label: String
    let value: String?
    let options: [MavisChoice]
    let onChange: (String) -> Void
    var placeholder: String = "Select an option"
    var helperText: String = ""
    var error: String = ""
    var disabled: Bool = false

    private var selected: String? {
        options.contains { $0.value == value } ? value : nil
    }
    private var message: String { error.isEmpty ? helperText : error }

    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.sm}) {
            MavisFieldLabel(text: label)
            Picker(selection: Binding(get: { selected }, set: { next in
                if let next, next != value, options.contains(where: { $0.value == next && !$0.disabled }) {
                    onChange(next)
                }
            })) {
                if selected == nil {
                    Text(verbatim: placeholder).tag(String?.none)
                }
                ForEach(options, id: \\.value) { option in
                    Text(verbatim: option.label)
                        .tag(Optional(option.value))
                        .disabled(option.disabled)
                }
            } label: {
                Text(verbatim: label)
            }
            .pickerStyle(.menu)
            .labelsHidden()
            .tint(MavisTokens.primary)
            .fixedSize()
            if !message.isEmpty {
                MavisFieldMessage(label: label, text: message, error: !error.isEmpty)
            }
        }
        .disabled(disabled)
        .environment(\\.colorScheme, MavisTokens.colorScheme)
    }
}
`
  return { tokens, source, controls }
}

export const runtime = `import SwiftUI

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

/// list[index]: undefined unless index is a whole number inside the list.
func mavisAt<T>(_ items: [T], _ index: Double) -> T? {
    guard index >= 0, index < Double(items.count), index == index.rounded(.towardZero) else { return nil }
    return items[Int(index)]
}

/// a < b for strings in JavaScript: UTF-16 code units, not Unicode canonical order.
func mavisBefore(_ a: String, _ b: String) -> Bool {
    a.utf16.lexicographicallyPrecedes(b.utf16)
}

/// Array#toSorted(compare): stable, and NaN counts as equal.
func mavisSorted<T>(_ items: [T], _ compare: (T, T) -> Double) -> [T] {
    items.enumerated().sorted { a, b in
        let order = compare(a.element, b.element)
        return order < 0 || (!(order > 0) && a.offset < b.offset)
    }.map(\\.element)
}

/// maxLength counts UTF-16 units, like the Web; it never splits a character.
func mavisLimit(_ text: String, _ maxLength: Double?) -> String {
    guard let maxLength, Double(text.utf16.count) > maxLength else { return text }
    var kept = ""
    var count = 0
    for character in text {
        let size = character.utf16.count
        if Double(count + size) > maxLength { break }
        kept.append(character)
        count += size
    }
    return kept
}

/// The source's name for a pressed arrow key.
func mavisKeyName(_ key: KeyEquivalent) -> String {
    switch key {
    case .upArrow: return "ArrowUp"
    case .downArrow: return "ArrowDown"
    case .leftArrow: return "ArrowLeft"
    default: return "ArrowRight"
    }
}

/// Object spread for records: a changed copy.
func mavisCopy<T>(_ value: T, _ change: (inout T) -> Void) -> T {
    var copy = value
    change(&copy)
    return copy
}
`
