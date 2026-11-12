// Value helpers beyond the first list: text, number and list methods a shared module's functions
// lean on. Each one keeps its JavaScript meaning in every output (see values-swift.mjs); what
// cannot is refused here, by name.
import ts from 'typescript'
import { T, primitive } from '../model.mjs'

const numberChecks = ['isFinite', 'isNaN', 'isInteger']
const own = ['split', 'replace', 'replaceAll', 'padStart', 'padEnd', 'indexOf', 'slice', 'repeat']
const methods = new Set([...own, 'toFixed', 'reduce', 'toReversed'])

/**
 * The model of a call this file knows, or undefined for the reader's own list. tools are the
 * reader's expr, arrow, args and fail.
 */
export function valueCall(node, ctx, { expr, arrow, args, fail }) {
  const callee = node.expression
  const call = (method, object, list, type) => ({ e: 'call', method, object, args: list, type })
  if (ts.isIdentifier(callee) && !ctx.locals.has(callee.text)) {
    if (callee.text === 'Number' || callee.text === 'String') {
      if (node.arguments.length !== 1) fail(node, `${callee.text} takes one value.`)
      const arg = expr(node.arguments[0], ctx)
      if (!primitive(arg.type))
        fail(node.arguments[0], `${callee.text} converts a string, a number or a boolean.`)
      const to = callee.text === 'Number' ? T.number : T.string
      return arg.type.k === to.k ? arg : { e: 'convert', arg, type: to }
    }
    if (callee.text === 'parseInt' || callee.text === 'parseFloat')
      fail(
        callee,
        `${callee.text} reads the start of a text and ignores the rest, which the Mac does not repeat; use Number(text).`,
      )
    return undefined
  }
  if (!ts.isPropertyAccessExpression(callee) || callee.questionDotToken) return undefined
  const method = callee.name.text
  if (ts.isIdentifier(callee.expression) && callee.expression.text === 'Number') {
    if (!numberChecks.includes(method))
      fail(callee, `Number.${method} is not supported; Number has ${numberChecks.join(', ')}.`)
    return {
      e: 'check',
      fn: method,
      arg: args(node, node.arguments, [T.number], ctx)[0],
      type: T.boolean,
    }
  }
  if (!methods.has(method)) return undefined
  const object = expr(callee.expression, ctx)
  const values = node.arguments
  if (values.some(ts.isSpreadElement)) fail(node, 'Pass each argument on its own.')
  const pattern = (value) => {
    if (ts.isRegularExpressionLiteral(value))
      fail(
        value,
        `Regular expressions do not reach the Mac: JavaScript and Swift read them differently. Give ${method} the text itself.`,
      )
    return expr(value, ctx, T.string)
  }
  if (object.type.k === 'string') {
    switch (method) {
      case 'split':
        if (values.length !== 1) fail(node, 'Use split(separator).')
        return call(method, object, [pattern(values[0])], T.array(T.string))
      case 'replace':
      case 'replaceAll': {
        if (values.length !== 2) fail(node, `Use ${method}(text, replacement).`)
        if (ts.isArrowFunction(values[1]) || ts.isFunctionExpression(values[1]))
          fail(values[1], 'The replacement is a text, not a function.')
        return call(method, object, [pattern(values[0]), expr(values[1], ctx, T.string)], T.string)
      }
      case 'padStart':
      case 'padEnd':
        if (values.length < 1 || values.length > 2) fail(node, `Use ${method}(length, fill).`)
        return call(
          method,
          object,
          [expr(values[0], ctx, T.number), ...values.slice(1).map((v) => expr(v, ctx, T.string))],
          T.string,
        )
      case 'indexOf':
        if (values.length !== 1) fail(node, 'Use indexOf(text).')
        return call(method, object, [expr(values[0], ctx, T.string)], T.number)
      case 'slice':
        if (values.length < 1 || values.length > 2)
          fail(node, 'Use slice(start) or slice(start, end).')
        return call(
          method,
          object,
          values.map((value) => expr(value, ctx, T.number)),
          T.string,
        )
      case 'repeat': {
        const [count] = args(node, values, [T.number], ctx)
        if (count.e !== 'lit' || !Number.isInteger(count.value) || count.value < 0)
          fail(values[0], 'repeat takes a whole number written out, zero or more.')
        return call(method, object, [count], T.string)
      }
    }
    return undefined
  }
  if (object.type.k === 'number' && method === 'toFixed') {
    const digits = values.length
      ? expr(values[0], ctx, T.number)
      : { e: 'lit', value: 0, type: T.number }
    if (
      values.length > 1 ||
      digits.e !== 'lit' ||
      !Number.isInteger(digits.value) ||
      digits.value < 0 ||
      digits.value > 100
    )
      fail(node, 'toFixed takes the number of decimals written out, from 0 to 100.')
    return call(method, object, [digits], T.string)
  }
  if (object.type.k === 'array') {
    const element = object.type.of
    switch (method) {
      case 'indexOf':
        if (!primitive(element))
          fail(callee, 'indexOf works on lists of strings, numbers or booleans.')
        return call(method, object, args(node, values, [element], ctx), T.number)
      case 'toReversed':
        if (values.length) fail(node, 'toReversed takes no arguments.')
        return call(method, object, [], object.type)
      case 'reduce': {
        if (values.length !== 2)
          fail(
            node,
            'reduce takes a function and where it starts: reduce((sum, item) => sum + item, 0).',
          )
        const start = expr(values[1], ctx)
        if (start.type.k === 'optional' || start.type.k === 'void')
          fail(values[1], 'reduce starts from a value.')
        return call(
          method,
          object,
          [arrow(values[0], [start.type, element], start.type, ctx), start],
          start.type,
        )
      }
    }
  }
  return undefined
}
