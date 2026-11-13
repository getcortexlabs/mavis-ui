import ts from 'typescript'
import { T } from '../model.mjs'

// Only these named imports join the host contracts already allowed from core. The original
// module is still what Web and NativeScript execute, including Object.freeze from core.
export function isPolicyImport(element, clause, from) {
  if (from !== '@getcortexlabs/mavis-core') return false
  const name = (element.propertyName ?? element.name).text
  return name === 'defineNavigationTransition'
    ? !clause.isTypeOnly && !element.isTypeOnly
    : name === 'NavigationTransition' && (clause.isTypeOnly || element.isTypeOnly)
}

function unwrap(node) {
  while (
    node &&
    (ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node))
  )
    node = node.expression
  return node
}

/** Resolve a literal core policy to the same ordinary record each host reads. */
export function readNavigationPolicy(node, reader) {
  const callee = node.expression
  if (!ts.isIdentifier(callee)) return undefined
  const imported = reader.checker.getSymbolAtLocation(callee)?.declarations?.[0]
  if (!imported || !ts.isImportSpecifier(imported)) return undefined
  const clause = imported.parent.parent
  const from = clause.parent.moduleSpecifier.text
  if (!isPolicyImport(imported, clause, from)) return undefined
  if ((imported.propertyName ?? imported.name).text !== 'defineNavigationTransition')
    return undefined

  if (node.arguments.length > 1 || node.typeArguments?.length)
    reader.fail(node, 'defineNavigationTransition takes one literal options object.')
  const options = unwrap(node.arguments[0])
  const omitted = (value) => !value || (ts.isIdentifier(value) && value.text === 'undefined')
  const values = { name: 'fade', duration: 220 }
  if (!omitted(options)) {
    if (!ts.isObjectLiteralExpression(options))
      reader.fail(options, 'defineNavigationTransition needs literal options on the Mac.')
    for (const property of options.properties) {
      if (
        !ts.isPropertyAssignment(property) ||
        (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))
      )
        reader.fail(
          property,
          'Navigation transition options use literal properties, without spreads or computed keys.',
        )
      const key = property.name.text
      if (!['name', 'duration'].includes(key))
        reader.fail(property, `Navigation transition does not take ${key}.`)
      const value = unwrap(property.initializer)
      if (omitted(value)) continue
      if (key === 'name') {
        if (!ts.isStringLiteral(value) || !['fade', 'slide', 'none'].includes(value.text))
          reader.fail(
            value,
            'Navigation transition must be fade, slide or none, written as a literal.',
          )
        values.name = value.text
      } else {
        const negative =
          ts.isPrefixUnaryExpression(value) && value.operator === ts.SyntaxKind.MinusToken
        const numeric = negative ? value.operand : value
        if (!ts.isNumericLiteral(numeric))
          reader.fail(value, 'Navigation duration must be a finite number literal.')
        const duration = Number(numeric.text) * (negative ? -1 : 1)
        if (!Number.isFinite(duration) || duration < 0 || duration > 10000)
          reader.fail(value, 'Navigation duration must be between 0 and 10000ms.')
        values.duration = duration
      }
    }
  }
  return {
    e: 'record',
    name: 'NavigationTransitionPolicy',
    type: reader.record('NavigationTransitionPolicy'),
    fields: [
      { name: 'name', value: { e: 'lit', value: values.name, type: T.string } },
      { name: 'duration', value: { e: 'lit', value: values.duration, type: T.number } },
    ],
  }
}
