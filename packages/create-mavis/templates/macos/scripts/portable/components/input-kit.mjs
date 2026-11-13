// What the form controls share: how their properties are read while generating, how their
// SwiftUI call is written, and the Swift pieces their looks are drawn with.
import { expression, handlerJs, js } from '../js-text.mjs'
import { nameProblem } from '../model.mjs'
import { swiftType } from '../swift-text.mjs'
import { accessibility, flexItem, flexProps } from './shared.mjs'

/** id and accessibilityHidden, as the controls' contracts take them; the label is the name. */
export const controlProps = { id: 'string', accessibilityHidden: 'boolean' }
export const controlTypes = 'id?: string; accessibilityHidden?: boolean'

/** grow, shrink and width, for the controls whose contract has them. */
export const layoutProps = { ...flexProps, width: 'dimension' }
export const layoutTypes = 'grow?: number; shrink?: number; width?: MavisDimension'

/** A number checked while generating when it is written out, as the Web checks it while rendering. */
export const bounded =
  (key, test, message) =>
  ({ value, ctx, expr, attribute, fail, T }) => {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && !test(number.value)) fail(attribute, `${key} ${message}`)
    return { expr: number }
  }

/** A choice written out, such as a locale: it picks what is generated. */
export const literal =
  (key, values) =>
  ({ value, attribute, fail, ts }) => {
    if (!ts.isStringLiteral(value) || !values.includes(value.text))
      fail(attribute, `${key} is written out: ${values.map((each) => `"${each}"`).join(' or ')}.`)
    return { lit: value.text }
  }

/**
 * A property of the contract the Mac does not take yet: it fails where it is written, with the
 * reason and the issue it waits for.
 */
export const later = (reason) => (source) => source.fail(source.attribute, reason)

/** The value of a literal number property, the fallback when it is not set, or undefined. */
export const number = (props, key, fallback) =>
  props[key] ? (props[key].expr.e === 'lit' ? props[key].expr.value : undefined) : fallback

/**
 * A function from values to text, such as formatValue: an arrow with an expression body. It
 * reads its parameters and the component's values, and changes nothing.
 */
export const formatter =
  (key, params) =>
  ({ value, attribute, ctx, expr, fail, ts, T }) => {
    const example = `${key}={(${params.map((param) => param.name).join(', ')}) => \`\${${params[0].name}} km\`}`
    if (
      !ts.isArrowFunction(value) ||
      ts.isBlock(value.body) ||
      value.parameters.length > params.length
    )
      fail(attribute, `${key} is an arrow function that returns text, for example ${example}.`)
    const inner = { ...ctx, mode: 'pure', locals: new Map(ctx.locals) }
    const names = value.parameters.map((parameter, index) => {
      if (!ts.isIdentifier(parameter.name) || parameter.initializer || parameter.dotDotDotToken)
        fail(parameter, 'Use simple parameter names.')
      const name = parameter.name.text
      const problem = nameProblem(name)
      if (problem) fail(parameter, `Parameter ${name} ${problem}`)
      inner.locals.set(name, params[index].type)
      return name
    })
    const body = expr(value.body, inner, T.string)
    // Math.max(…) is max(…) in Swift, where a parameter of that name would be called instead.
    const shadowed = names.find((name) => calls(body, name))
    if (shadowed)
      fail(
        attribute,
        `Inside ${key} the parameter ${shadowed} hides Math.${shadowed} on the Mac; give it another name.`,
      )
    return {
      expr: {
        e: 'arrow',
        params: names,
        types: params.map((param) => param.type),
        body,
        type: T.string,
      },
    }
  }

// Whether an expression calls the Math function of this name anywhere inside it.
const calls = (node, fn) =>
  Boolean(node) &&
  typeof node === 'object' &&
  ((node.e === 'math' && node.fn === fn) || Object.values(node).some((part) => calls(part, fn)))

/** A formatter as a Swift closure: every parameter typed, the ones the source left out unnamed. */
export const formatterSwift = (prop, emit) => {
  const { params, types, body } = prop.expr
  const list = types.map((type, index) => `${params[index] ?? '_'}: ${swiftType(type)}`)
  return `{ (${list.join(', ')}) -> String in ${emit.expr(body)} }`
}

/** name: value for each property that is set, in the order of the Swift initializer. */
export const given = (node, { emit, indent }, order) =>
  order.flatMap((entry) => {
    const [prop, label = prop] = [entry].flat()
    const value = node.props[prop]
    if (!value) return []
    return [`${label}: ${'body' in value ? emit.handler(value, indent + 4) : emit.value(value)}`]
  })

/** The control's SwiftUI call, then accessibilityHidden and its place in the stack around it. */
export function control(node, context, name, args) {
  const pad = ' '.repeat(context.indent)
  return [
    `${pad}${name}(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`,
    ...accessibility({ accessibilityHidden: node.props.accessibilityHidden }, context),
    ...flexItem(node.props, context),
  ].join('\n')
}

/**
 * A choice among options with text values, as generated Vue passes it on: the Web and
 * NativeScript report string or number choices and take null for none, the source writes
 * strings and undefined.
 */
export const choiceVue = {
  rename: { value: 'modelValue', onChange: 'update:modelValue' },
  attribute(name, value) {
    if (name === 'onChange' && value.params.some((param) => !param.unused))
      return `@update:modelValue="${expression(`(choice) => (${handlerJs(value)})(String(choice))`)}"`
    if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
  },
}

/** Swift the controls draw with: choiceMotion of the Mavis core, and the focus outline. */
export const inputRuntime = {
  swiftRuntime: ({
    theme,
  }) => `/// choiceMotion in the Mavis core: how a choice's paint and its mark change. Jolt settles it
/// at once under Reduce Motion.
enum MavisChoiceMotion {
    static let paint: JoltTransition = try! .tween(milliseconds: ${theme.motion.enterDuration}, ease: .${theme.motion.ease})
    static let pressed = try! JoltPose(scale: 0.9)
    /// componentMotion(theme, "feedback") in the Mavis core.
    static let feedback: JoltTransition = try! .spring(milliseconds: ${theme.motion.enterDuration * 1.2}, bounce: ${Math.min(0.2, theme.motion.releaseBounce)})
}

/// Where an arrow key takes a radio group or a segmented control, as segmentedFocusTarget
/// in the Mavis core: the next or the previous choice that is not disabled, around the ends;
/// Home and End go to the first and the last.
func mavisChoiceTarget(_ options: [MavisChoice], from value: String, _ press: KeyPress) -> MavisChoice? {
    guard press.modifiers.isDisjoint(with: [.option, .control, .command]) else { return nil }
    let enabled = options.filter { !$0.disabled }
    guard !enabled.isEmpty else { return nil }
    let step: Int
    switch press.key {
    case .home: return enabled.first
    case .end: return enabled.last
    case .rightArrow, .downArrow: step = 1
    case .leftArrow, .upArrow: step = -1
    default: return nil
    }
    let index = enabled.firstIndex { $0.value == value } ?? (step > 0 ? -1 : 0)
    return enabled[(index + step + enabled.count) % enabled.count]
}

/// The outline of a control that has the keyboard focus, as the Web draws it.
struct MavisFocusRing: ViewModifier {
    let focused: Bool
    var radius: Double = 8
    var offset: Double = 4
    func body(content: Content) -> some View {
        content.overlay(RoundedRectangle(cornerRadius: radius + offset).inset(by: -offset).strokeBorder(MavisTokens.primary, lineWidth: focused ? 2 : 0).allowsHitTesting(false))
    }
}`,
}
