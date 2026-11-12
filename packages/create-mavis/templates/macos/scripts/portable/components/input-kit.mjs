// What the form controls share: how their properties are read while generating, how their
// SwiftUI call is written, and the Swift pieces their looks are drawn with.
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
      inner.locals.set(parameter.name.text, params[index].type)
      return parameter.name.text
    })
    // Swift names every parameter of the closure; the ones the source leaves out get their own.
    const taken = new Set(names)
    for (const param of params.slice(names.length)) {
      let name = param.name
      while (taken.has(name) || inner.locals.has(name)) name = `${name}Value`
      taken.add(name)
      names.push(name)
    }
    return {
      expr: {
        e: 'arrow',
        params: names,
        written: value.parameters.length,
        types: params.map((param) => param.type),
        body: expr(value.body, inner, T.string),
        type: T.string,
      },
    }
  }

/** A formatter as the JavaScript the Vue output passes on. */
export const formatterJs = (prop, js) =>
  `(${prop.expr.params.slice(0, prop.expr.written).join(', ')}) => ${js(prop.expr.body)}`

/** A formatter as a Swift closure. */
export const formatterSwift = (prop, emit) => emit.closure(prop.expr, 'String')

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

/** Swift the controls draw with: choiceMotion of the Mavis core, and the focus outline. */
export const inputRuntime = {
  swiftRuntime: ({
    theme,
  }) => `/// choiceMotion in the Mavis core: how a choice's paint and its mark change. Jolt settles it
/// at once under Reduce Motion.
enum MavisChoiceMotion {
    static let paint: JoltTransition = try! .tween(milliseconds: ${theme.motion.enterDuration}, ease: .${theme.motion.ease})
    static let pressed = try! JoltPose(scale: 0.9)
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
