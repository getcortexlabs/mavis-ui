import { themeColor } from './themes.mjs'
import { themeMetrics, metricsRuntime } from './theme-runtime.mjs'
// SwiftUI output. JavaScript semantics are kept where the platforms differ: numbers are
// Double, text length counts UTF-16 units, number text follows Number#toString, and
// trim/splice/slice/Math.round follow the ECMAScript rules (see runtime below).

import { components } from './components/index.mjs'
import { children, nodesWhere } from './tree.mjs'
import { swiftNumber, swiftString, swiftType } from './swift-text.mjs'
import { swiftModule, swiftValue, swiftValueCall } from './values-swift.mjs'
import { usesNavigation } from './navigation/routes.mjs'
import { swiftAsync } from './async-swift.mjs'
import { swiftEffects } from './effects.mjs'
import { initialState } from './initial-state.mjs'
import {
  ownsLifetime,
  swiftContext,
  asyncViewCallbacks,
  lifetimeValuesName,
  lifetimePropsName,
  forwardedState,
} from './lifetime-swift.mjs'

export { swiftString, swiftType }

/** The JoltSwiftUI package every generated Mac app links. */
export const joltSwift = Object.freeze({
  url: 'https://github.com/rafaelaugustos/jolt-swift.git',
  version: '0.1.0-rc.14',
})

/** What a component without content for a slot gets: its slot shows the fallback instead. */
export const slotRuntime = `import SwiftUI

/// The content of a slot the parent left out. A component tells it apart by its type and
/// shows the slot's fallback instead.
struct MavisNoSlot: View {
    var body: some View { EmptyView() }
}
`

/**
 * The closure a component keeps for each slot, by slot: content for the default slot and the
 * slot's own name for the others, unless a member of the component already has that name.
 * Parents label their content with the same names.
 */
function slotProperties(component) {
  const taken = new Set(
    [component.props, component.state, component.getters, component.actions, component.refs]
      .flat()
      .map((member) => member.name),
  )
  return new Map(
    component.slots.map((slot) => {
      const base = slot.name === 'default' ? 'content' : slot.name
      let property = base
      for (let next = 2; taken.has(property); next++)
        property = `${base}${next === 2 ? 'Slot' : `Slot${next - 1}`}`
      taken.add(property)
      return [slot.name, property]
    }),
  )
}

export class SwiftEmitter {
  constructor(model) {
    this.records = new Map(model.records.map((record) => [record.name, record]))
    this.slotProperties = new Map(
      model.components.map((component) => [component.name, slotProperties(component)]),
    )
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
      case 'initial-getter':
        return `({ () -> ${swiftType(e.type)} in ${e.locals.map((local) => `let ${local.name}: ${swiftType(local.type)} = ${this.expr(local.value)}; `).join('')}return ${this.expr(e.expr)} })()`
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
      case 'narrowed':
        return e.name
      case 'controller':
        return `self.${e.ref}`
      case 'controller-value':
        return components[e.owner].composable.value(this, e, 'self')
      case 'controller-call':
        return `self.${e.ref}.${e.method}(${e.args ? e.args.map((arg) => this.expr(arg)).join(', ') : e.options.map((option) => `${option.name}: ${this.expr(option.value)}`).join(', ')})`
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
          trunc: `(${a}).rounded(.towardZero)`,
          sqrt: `(${a}).squareRoot()`,
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
    const value = swiftValue(this, e)
    if (value !== undefined) return value
    throw new Error(`Unknown expression ${e.e}`)
  }

  wrap(e) {
    return [
      'state',
      'getter',
      'prop',
      'local',
      'field',
      'call',
      'lit',
      'array',
      'length',
      'const',
      'invoke',
      'spread',
      'store',
    ].includes(e.e) && !(e.e === 'lit' && typeof e.value === 'number' && e.value < 0)
      ? this.expr(e)
      : `(${this.expr(e)})`
  }

  call(e) {
    const value = swiftValueCall(this, e)
    if (value !== undefined) return value
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
        case 'toLocaleLowerCase':
          return `${object}.lowercased(with: Locale(identifier: ${this.expr(first)}))`
        case 'toLocaleUpperCase':
          return `${object}.uppercased(with: Locale(identifier: ${this.expr(first)}))`
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
    return ['self', ...(target.store ? [target.store] : []), target.name, ...target.fields].join(
      '.',
    )
  }

  statements(list, indent) {
    const pad = ' '.repeat(indent)
    return list
      .map((s) => {
        const waited = swiftAsync(this, s, indent)
        if (waited !== undefined) return waited
        switch (s.s) {
          case 'assign':
            return s.op === '+=' && s.target.type.k === 'string'
              ? `${pad}${this.path(s.target)} += ${this.text(s.value)}`
              : `${pad}${this.path(s.target)} ${s.op} ${this.expr(s.value)}`
          case 'const':
            return `${pad}let ${s.name}: ${swiftType(s.type)} = ${this.expr(s.value)}`
          case 'return':
            return s.value ? `${pad}return ${this.expr(s.value)}` : `${pad}return`
          case 'guard':
            if (s.else)
              return `${pad}guard let ${s.name} else {\n${this.statements(s.else, indent + 4)}\n${pad}}`
            return `${pad}guard let ${s.name} else { return${s.value ? ` ${this.expr(s.value)}` : ''} }`
          case 'iflet': {
            const otherwise = s.else.length
              ? ` else {\n${this.statements(s.else, indent + 4)}\n${pad}}`
              : ''
            return `${pad}if let ${s.name} {\n${this.statements(s.then, indent + 4) || `${pad}    `}\n${pad}}${otherwise}`
          }
          case 'throw':
            return `${pad}throw MavisFailure(message: ${this.expr(s.message)})`
          case 'action':
            return `${pad}${this.failing?.has(s.name) ? 'try ' : ''}self.${s.name}(${s.args.map((arg) => this.expr(arg)).join(', ')})`
          case 'callback':
            return `${pad}self.${s.name}(${s.args.map((arg) => this.expr(arg)).join(', ')})`
          case 'cancel-cleanup':
            return `${pad}${s.ref}.onCancel {\n${this.statements(s.body, indent + 4)}\n${pad}}`
          case 'navigate':
            return `${pad}self.mavisNavigation.${s.method}(${s.href ? this.expr(s.href) : ''})`
          case 'focus':
            return `${pad}self.mavisFocus = ${swiftString(s.ref)}`
          case 'blur':
            return `${pad}if self.mavisFocus == ${swiftString(s.ref)} { self.mavisFocus = nil }`
          case 'scroll':
            return `${pad}self.${s.ref} = MavisListRequest(index: ${this.expr(s.index)}, serial: self.${s.ref}.serial + 1)`
          case 'call': {
            const statement = s.owner && components[s.owner].composable.statement
            const custom = statement?.(this, s, indent, 'self')
            if (custom !== undefined) return custom
            return `${pad}self.${s.ref}.${s.method}(${s.args ? s.args.map((arg) => this.expr(arg)).join(', ') : (s.options ?? []).map((option) => `${option.name}: ${this.expr(option.value)}`).join(', ')})`
          }
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

  ownedCallback(callback, indent) {
    const method = this.asyncCallbacks?.get(callback)
    if (!method) throw new Error('Retained callbacks must belong to their component model.')
    const pad = ' '.repeat(indent)
    const names = callback.params.map((_, index) => `mavisArgument${index}`)
    const params = callback.params
      .map((param, index) => `${names[index]}: ${swiftType(param.type)}`)
      .join(', ')
    const captures = callback.captures ?? []
    const capture = [
      `mavisOwner = ${this.contextTasks ? 'self.mavisContext' : 'self'}`,
      ...captures.map((local, index) => `mavisCapture${index} = ${local.name}`),
    ]
    const args = [...names, ...captures.map((_, index) => `mavisCapture${index}`)]
    return `{ [${capture.join(', ')}] (${params})${callback.async ? ' async' : ''}${callback.throws ? ' throws' : ''} -> ${swiftType(callback.returns)} in\n${pad}    ${callback.throws ? 'try ' : ''}${callback.async ? 'await ' : ''}mavisOwner.${method}(${args.join(', ')})\n${pad}}`
  }

  asyncCallback(callback, indent) {
    return this.ownedCallback(callback, indent)
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
      case 'initial-body': {
        const args = [
          ...node.props.map((prop) => `${prop.name}: self.${prop.name}`),
          ...node.seeds.map((seed) => `${seed.name}: ${this.expr(seed.value)}`),
          ...[...this.slots.values()].map((slot) => `${slot.property}: self.${slot.property}`),
        ]
        return `${pad}${node.name}(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
      }
      case 'element':
      case 'text':
        return components[node.tag].swift(node, { emit: this, indent, tokens })
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
          `${pad}if ${node.binding ? `let ${node.binding.name} = ${this.expr(node.binding.source)}` : this.expr(node.when)} {`,
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
        const args = [
          ...node.props.map(({ name, value }) =>
            value.handler
              ? `${name}: ${this.handler(value.handler, indent + 4)}`
              : `${name}: ${this.expr(value.expr)}`,
          ),
          // Every slot by its label: a slot the parent leaves out takes its default.
          ...node.slots.map(
            (slot) =>
              `${this.slotProperties.get(node.name).get(slot.name)}: ${this.slotContent(slot, indent + 4, tokens)}`,
          ),
        ]
        if (!args.length) return `${pad}${node.name}()`
        return `${pad}${node.name}(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
      }
      case 'slot': {
        const slot = this.slots.get(node.name)
        const show = `self.${slot.property}(${node.args.map((arg) => this.expr(arg.value)).join(', ')})`
        if (!node.fallback.length) return `${pad}${show}`
        return [
          `${pad}if ${slot.generic}.self == MavisNoSlot.self {`,
          node.fallback.map((childNode) => this.view(childNode, indent + 4, tokens)).join('\n'),
          `${pad}} else {`,
          `${pad}    ${show}`,
          `${pad}}`,
        ].join('\n')
      }
    }
    throw new Error(`Unknown view ${node.v}`)
  }

  // The parent's content for a slot, as the closure the component calls.
  slotContent(slot, indent, tokens) {
    const params = slot.params.map((param) => `${param.name}: ${swiftType(param.type)}`).join(', ')
    const body = slot.body.map((childNode) => this.view(childNode, indent + 4, tokens)).join('\n')
    return `{${params ? ` (${params}) in` : ''}\n${body}${body ? '\n' : ''}${' '.repeat(indent)}}`
  }

  forEach(node, indent, tokens, element, pad) {
    const keyPath = node.key ? `\\.${node.key}` : '\\.self'
    if (!node.index)
      return [
        `${pad}ForEach(${this.expr(node.each)}, id: ${keyPath}) { (${node.item}: ${element}) in`,
        this.view(node.body, indent + 4, tokens),
        `${pad}}`,
      ].join('\n')
    // The pair of item and position, under a name the source did not take.
    const pair = [node.item, node.index].includes('entry') ? 'mavisEntry' : 'entry'
    return [
      `${pad}ForEach(Array(${this.expr(node.each)}.enumerated()), id: ${node.key ? `\\.element.${node.key}` : '\\.element'}) { ${pair} in`,
      `${pad}    let ${node.item}: ${element} = ${pair}.element`,
      `${pad}    let ${node.index}: Double = Double(${pair}.offset)`,
      this.view(node.body, indent + 4, tokens),
      `${pad}}`,
    ].join('\n')
  }

  // Unique per view, and per row inside For.
  focusKey(kind) {
    return `"${kind}${++this.fields}${this.forKeys.map((key) => `:\\(${key})`).join('')}"`
  }

  component(component, tokens, header, namespace) {
    const initial = initialState(component)
    if (initial) {
      const base = initial.name
      for (let next = 2; this.slotProperties.has(initial.name); next++)
        initial.name = `${base}${next}`
      this.slotProperties.set(initial.name, this.slotProperties.get(component.name))
      const outer = this.component(
        {
          ...component,
          state: [],
          getters: [],
          actions: [],
          effects: [],
          refs: [],
          view: {
            v: 'initial-body',
            name: initial.name,
            props: component.props,
            seeds: initial.seeds,
          },
        },
        tokens,
        header,
        namespace,
      )
      const inner = this.component(
        {
          ...component,
          name: initial.name,
          props: [...component.props, ...initial.seeds.map(({ name, type }) => ({ name, type }))],
          state: component.state.map((state) => {
            const seed = initial.seeds.find((seed) => seed.state === state.name)
            return seed
              ? { ...state, init: { e: 'prop', name: seed.name, type: seed.type } }
              : state
          }),
        },
        tokens,
        header,
        namespace,
      )
      return `${outer}\n${inner}`
    }
    const lines = [
      `// ${header}`,
      'import SwiftUI',
      'import JoltSwiftUI',
      ...(ownsLifetime(component) ? ['import Observation'] : []),
      '',
    ]
    const indent = namespace ? 4 : 0
    const pad = ' '.repeat(indent)
    if (namespace) lines.push(`extension ${namespace} {`)
    // Each slot is a view type of its own, as in SwiftUI: Content for the default slot,
    // Header for header. Written as a placeholder until the rest shows the name is free.
    const properties = this.slotProperties.get(component.name)
    this.slots = new Map(
      component.slots.map((slot, index) => [
        slot.name,
        {
          ...slot,
          generic: `\u0000${index}\u0000`,
          type:
            slot.name === 'default' ? 'Content' : slot.name[0].toUpperCase() + slot.name.slice(1),
          property: properties.get(slot.name),
        },
      ]),
    )
    const slots = [...this.slots.values()]
    const closure = (slot) =>
      `(${slot.params.map((param) => swiftType(param.type)).join(', ')}) -> ${slot.generic}`
    lines.push(
      `${pad}struct ${component.name}${slots.length ? `<${slots.map((slot) => `${slot.generic}: View`).join(', ')}>` : ''}: View {`,
    )
    const inner = pad + '    '
    for (const prop of component.props)
      lines.push(`${inner}let ${prop.name}: ${swiftType(prop.type)}`)
    for (const slot of slots) lines.push(`${inner}let ${slot.property}: ${closure(slot)}`)
    this.asyncCallbacks = new Map(
      asyncViewCallbacks(component).map((callback, index) => [
        callback,
        `mavisAsyncCallback${index + 1}`,
      ]),
    )
    this.contextTasks = Boolean(ownsLifetime(component))
    if (this.contextTasks && component.props.length)
      lines.push(`${inner}@State private var mavisProps: ${lifetimePropsName(component)}`)
    if (this.contextTasks && component.state.length) {
      lines.push(`${inner}@State private var mavisValues: ${lifetimeValuesName(component)}`)
      for (const value of component.state) lines.push(...forwardedState(value, inner))
    } else
      for (const value of component.state)
        lines.push(`${inner}@State private var ${value.name}: ${swiftType(value.type)}`)
    if (this.contextTasks)
      lines.push(`${inner}@StateObject private var mavisLifetime = MavisComponentLifetime()`)
    for (const use of component.stores ?? [])
      lines.push(`${inner}@Environment(${use.store}Store.self) private var ${use.name}`)
    if (usesFocus(component.view)) lines.push(`${inner}@FocusState private var mavisFocus: String?`)
    if (usesNavigation(component))
      lines.push(`${inner}@Environment(\\.mavisNavigation) private var mavisNavigation`)
    for (const reference of component.refs)
      if (reference.kind === 'list')
        lines.push(`${inner}@State private var ${reference.name} = MavisListRequest()`)
      else if (reference.owner)
        lines.push(
          `${inner}${components[reference.owner].composable.swift(reference.name, reference)}`,
        )
    this.fields = 0
    this.forKeys = []
    this.failing = new Set(
      component.actions.filter((action) => action.throws).map((action) => action.name),
    )
    this.asyncActions = new Set(
      component.actions.filter((action) => action.async).map((action) => action.name),
    )
    const controllers = component.refs.filter(
      (ref) => ref.owner && components[ref.owner].composable.initialize,
    )
    if (component.props.length || component.state.length || slots.length || controllers.length) {
      lines.push('')
      // A property with a default can be left out by the parent, and so can every slot.
      const params = [
        ...component.props.map(
          (prop) =>
            `${prop.name}: ${prop.type.k === 'function' ? '@escaping ' : ''}${swiftType(prop.type)}${prop.default ? ` = ${this.expr(prop.default)}` : ''}${prop.optional ? ` = { ${prop.type.params.map(() => '_').join(', ')}${prop.type.params.length ? ' in ' : ''}}` : ''}`,
        ),
        ...slots.map(
          (slot) =>
            `@ViewBuilder ${slot.property}: @escaping ${closure(slot)} = { ${slot.params.map(() => '_').join(', ')}${slot.params.length ? ' in ' : ''}MavisNoSlot() }`,
        ),
      ]
      lines.push(
        slots.length
          ? `${inner}init(\n${params.map((param) => `${inner}    ${param}`).join(',\n')}\n${inner}) {`
          : `${inner}init(${params.join(', ')}) {`,
      )
      for (const prop of component.props) lines.push(`${inner}    self.${prop.name} = ${prop.name}`)
      if (this.contextTasks && component.props.length)
        lines.push(
          `${inner}    _mavisProps = State(initialValue: ${lifetimePropsName(component)}(${component.props.map((prop) => `${prop.name}: ${prop.name}`).join(', ')}))`,
        )
      for (const slot of slots) lines.push(`${inner}    self.${slot.property} = ${slot.property}`)
      this.initializing = true
      if (this.contextTasks && component.state.length)
        lines.push(
          `${inner}    _mavisValues = State(initialValue: ${lifetimeValuesName(component)}(${component.state.map((value) => `${value.name}: ${this.expr(value.init)}`).join(', ')}))`,
        )
      else
        for (const value of component.state)
          lines.push(`${inner}    _${value.name} = State(initialValue: ${this.expr(value.init)})`)
      for (const reference of controllers)
        lines.push(
          `${inner}    ${components[reference.owner].composable.initialize(reference, this)}`,
        )
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
      lines.push(
        '',
        `${inner}${action.async ? '@MainActor ' : ''}private func ${action.name}(${params})${action.async ? ' async' : ''}${action.throws ? ' throws' : ''} {`,
      )
      const body = this.statements(action.body, indent + 8)
      if (body) lines.push(body)
      lines.push(`${inner}}`)
    }
    const shown = forMac(component.view)
    const context = this.contextTasks
      ? swiftContext(this, component, indent, usesFocus(component.view), usesNavigation(component))
      : undefined
    if (context) lines.push('', ...context.property)
    lines.push(
      '',
      `${inner}var body: some View {`,
      ...(tokens.scoped
        ? [
            `${inner}    MavisThemeReader { mavisTheme in`,
            this.view(shown, indent + 12, tokens),
            `${inner}    }`,
          ]
        : [this.view(shown, indent + 8, tokens)]),
      // What a component inside puts on the root of the view, such as the host of its toasts.
      ...nodesWhere(shown, (node) => components[node.tag]?.swiftRoot).map((node) =>
        components[node.tag].swiftRoot(node, { emit: this, indent: indent + 8, tokens }),
      ),
      ...swiftEffects(this, component, indent + 12),
      `${inner}}`,
    )
    lines.push(`${pad}}`)
    if (context) lines.push('', ...context.declaration)
    if (namespace) lines.push('}')
    lines.push('')
    return this.nameSlots(component, lines.join('\n'))
  }

  // A slot's view type would hide a type of the same name inside the component, such as Text
  // for a slot called text, so it takes a name nothing else in the component uses. Parents never
  // write it: Swift infers it from their content.
  nameSlots(component, text) {
    const code = text
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('//'))
      .join('\n')
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    const taken = new Set()
    for (const slot of this.slots.values()) {
      let type = slot.type
      for (let next = 2; taken.has(type) || new RegExp(`\\b${type}\\b`).test(code); next++)
        type = `${slot.type}${next === 2 ? 'Content' : `Content${next - 1}`}`
      taken.add(type)
      text = text.replaceAll(slot.generic, type)
    }
    return text
  }

  /** A shared module's constants and functions (see values-swift.mjs). */
  module(module, header, namespace) {
    return swiftModule(this, module, header, namespace)
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

// What the Mac shows of an MPlatform is its branch, in place of it: the other branch leaves no
// trace in the SwiftUI. An MPlatform that is a whole view, or a list's row, writes its branch.
const branch = (node) =>
  node.props.only.lit.includes('macos')
    ? node.children
    : (node.slots?.find((slot) => slot.name === 'fallback')?.body ?? [])
const platformBranches = (nodes) =>
  nodes.flatMap((node) =>
    node.v === 'element' && node.tag === 'MPlatform'
      ? platformBranches(branch(node))
      : [forMac(node)],
  )
function forMac(node) {
  const copy = { ...node }
  for (const key of ['children', 'then', 'else', 'fallback'])
    if (node[key]) copy[key] = platformBranches(node[key])
  if (node.slots)
    copy.slots = node.slots.map((slot) => ({ ...slot, body: platformBranches(slot.body) }))
  if (node.body) copy.body = forMac(node.body)
  return copy
}

const usesFocus = (node) =>
  Boolean(components[node.tag]?.focus?.(node)) || children(node).some(usesFocus)

export function themeTokens(theme, palettes = { [theme.name]: theme }) {
  const scoped = Boolean(theme.__mavisProjectThemes?.modules.size)
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
  const weight = (name) => pick(weights, name, 'normal', 'font weight')
  const tokens = {
    scoped,
    space: (value, fallback) => {
      const key = value?.lit ?? value ?? fallback
      const result = pick(theme.space, key, fallback, 'space')
      return scoped ? `mavisTheme.palette.metrics.gap(${swiftString(key)})` : String(result)
    },
    radius: (name) => {
      const key = name ?? 'none'
      const result = pick(theme.radius, key, 'none', 'radius')
      return scoped ? `mavisTheme.palette.metrics.corner(${swiftString(key)})` : String(result)
    },
    font: (name) =>
      scoped ? `mavisTheme.palette.metrics.type(${swiftString(name ?? 'body')}).font` : font(name),
    weight,
    color: (tone) => {
      pick(theme.colors, tone, 'text', 'color')
      return `MavisTokens.${tone}`
    },
  }
  const names = Object.keys(theme.colors)
  const project = theme.__mavisProjectThemes
  const rootKey = project?.key ?? theme.name
  const all = { ...palettes, [rootKey]: theme }
  const palette = ([key, each]) => {
    const argb = names.map((key) => {
      const value = each.colors[key]
      return `.${key}: 0x${themeColor(value, `colors.${key}`).toString(16).padStart(8, '0').toUpperCase()}`
    })
    return `    static let ${key} = MavisPalette(name: ${swiftString(each.name)}, appearance: .${each.appearance === 'dark' ? 'dark' : 'light'}, argb: [${argb.join(', ')}]${scoped ? `, metrics: ${themeMetrics(each)}` : ''})`
  }
  // The root scope registers a theme for each appearance, as the starter's createMavis does.
  const light = project?.light ?? (theme.appearance === 'dark' ? 'mavis' : rootKey)
  const dark = project ? project.dark : theme.appearance === 'dark' ? rootKey : 'midnight'
  const source = `import SwiftUI
${scoped ? 'import JoltSwiftUI' : ''}

/// A Mavis color token. MavisTokens.surface and the others resolve it in the theme around them.
enum MavisToken: Hashable {
    case ${names.join(', ')}
}

enum MavisAppearance: String {
    case light, dark
}

/// An appearance selection: system follows the Mac, light and dark are fixed.
enum MavisAppearanceMode: String {
    case system, light, dark
    init(_ name: String) { self = MavisAppearanceMode(rawValue: name) ?? .system }
}

/// The colors of one Mavis theme, as ARGB in sRGB like the Web and NativeScript paint them.
struct MavisPalette: Equatable {
    let name: String
    let appearance: MavisAppearance
    let argb: [MavisToken: UInt32]
${scoped ? '    let metrics: MavisMetrics' : ''}

    func color(_ token: MavisToken) -> Color {
        let value = argb[token] ?? 0xFF000000
        return Color(red: Double((value >> 16) & 255) / 255, green: Double((value >> 8) & 255) / 255, blue: Double(value & 255) / 255, opacity: Double((value >> 24) & 255) / 255)
    }

    var colorScheme: ColorScheme { appearance == .dark ? .dark : .light }

${Object.entries(all).map(palette).join('\n')}
}
${scoped ? metricsRuntime : ''}

/// Which theme a part of the window draws with, like a Mavis theme context: a theme for each
/// appearance, the selection and the palette they resolve to. MThemeProvider scopes it.
struct MavisThemeScope: Equatable {
    var light: MavisPalette?
    var dark: MavisPalette?
    var mode: MavisAppearanceMode
    var palette: MavisPalette

    static let root = MavisThemeScope(light: ${light ? `.${light}` : 'nil'}, dark: ${dark ? `.${dark}` : 'nil'}, mode: .${project?.appearance ?? (theme.appearance === 'dark' ? 'dark' : 'light')}, palette: .${rootKey})

    /// The scope inside an MThemeProvider: its themes over the ones around it, and its appearance,
    /// or its theme's, or the one around it. system is the Mac's appearance.
    func scoped(theme: MavisPalette?, darkTheme: MavisPalette?, appearance: MavisAppearanceMode?, system: MavisAppearance) -> MavisThemeScope {
        var next = self
        if let theme {
            if theme.appearance == .dark { next.dark = theme } else { next.light = theme }
        }
        if let darkTheme { next.dark = darkTheme }
        next.mode = appearance ?? theme.map { $0.appearance == .dark ? .dark : .light } ?? mode
        let wanted: MavisAppearance = next.mode == .system ? system : next.mode == .dark ? .dark : .light
        next.palette = (wanted == .dark ? next.dark : next.light) ?? (wanted == .dark ? next.light : next.dark) ?? palette
        return next
    }
}

private struct MavisThemeKey: EnvironmentKey {
    static let defaultValue = MavisThemeScope.root
}

extension EnvironmentValues {
    var mavisTheme: MavisThemeScope {
        get { self[MavisThemeKey.self] }
        set { self[MavisThemeKey.self] = newValue }
    }
}

/// A theme color that takes its value from the theme where it is drawn.
struct MavisColor: ShapeStyle {
    let token: MavisToken?
    init(_ token: MavisToken?) { self.token = token }
    static let clear = MavisColor(nil)

    func resolve(in environment: EnvironmentValues) -> Color {
        token.map { environment.mavisTheme.palette.color($0) } ?? .clear
    }
}

private struct MavisColorScheme: ViewModifier {
    @Environment(\\.mavisTheme) private var theme
    func body(content: Content) -> some View {
        content.environment(\\.colorScheme, theme.palette.colorScheme)
    }
}

private struct MavisTint: ViewModifier {
    let token: MavisToken
    @Environment(\\.mavisTheme) private var theme
    func body(content: Content) -> some View {
        content.tint(theme.palette.color(token))
    }
}

extension View {
    /// System controls draw in the theme's appearance, whatever the Mac uses.
    func mavisColorScheme() -> some View { modifier(MavisColorScheme()) }
    /// A system control's accent, from the theme where it is drawn.
    func mavisTint(_ token: MavisToken) -> some View { modifier(MavisTint(token: token)) }
}

enum MavisTokens {
${names.map((key) => `    static let ${key} = MavisColor(.${key})`).join('\n')}

    static func tone(_ name: String) -> MavisColor {
        switch name {
${names.map((key) => `        case ${swiftString(key)}: return ${key}`).join('\n')}
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

    static func weight(_ name: String) -> Font.Weight {
        switch name {
${Object.entries(weights)
  .filter(([key]) => key !== 'normal')
  .map(([key, value]) => `        case ${swiftString(key)}: return .${value}`)
  .join('\n')}
        default: return .regular
        }
    }

    static func isHeading(_ variant: String) -> Bool {
        ["title", "heading", "display"].contains(variant)
    }
}
`
  // Runtime helpers read the same environment as generated layouts. Arithmetic remains in
  // Swift when a value can change with an inner provider or system appearance.
  const metric = (path, op, amount) => {
    const parts = path.split('.')
    const value = parts.reduce((value, key) => value[key], theme)
    const group = { space: 'gap', radius: 'corner', typography: 'type', control: 'size' }[parts[0]]
    const field = parts[2] === 'fontSize' && parts[0] === 'typography' ? 'size' : parts[2]
    const dynamic =
      parts[0] === 'motion'
        ? `mavisTheme.palette.metrics.motion.${parts[1]}`
        : `mavisTheme.palette.metrics.${group}(${swiftString(parts[1])})${field ? '.' + field : ''}`
    if (!op) return scoped ? dynamic : String(value)
    const apply = {
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      '/': (a, b) => a / b,
    }
    return scoped ? `(${dynamic} ${op} ${amount})` : String(apply[op](value, amount))
  }
  const defaultMetric = (name, path) =>
    scoped
      ? `    @MavisMetric(${swiftString(path)}) var ${name}: Double = .nan`
      : `    var ${name}: Double = ${metric(path)}`
  const motion = (kind, fallback) =>
    scoped ? `mavisTheme.palette.metrics.motion.${kind}` : fallback
  const runtimeFont = (name) =>
    scoped ? `mavisTheme.palette.metrics.type(${swiftString(name)}).font` : font(name)
  // Each component's Swift helpers in registry order, after the shared helpers it uses.
  const helpers = new Set(
    Object.values(components).flatMap((definition) => [...(definition.uses ?? []), definition]),
  )
  const controls = [
    'import Combine\nimport SwiftUI\nimport JoltSwiftUI',
    ...[...helpers].flatMap((part) =>
      part.swiftRuntime
        ? [
            part.swiftRuntime({
              theme,
              font: runtimeFont,
              weight,
              scoped,
              metric,
              defaultMetric,
              motion,
            }),
          ]
        : [],
    ),
  ]
    .join('\n\n')
    .concat('\n')
  return { tokens, source, controls }
}

export const runtime = `import SwiftUI

/// What a function of a shared screen throws: throw new Error("why").
struct MavisFailure: Error {
    let message: String
}

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
