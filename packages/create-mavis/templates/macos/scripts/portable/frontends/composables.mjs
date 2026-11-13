import { composableOf } from '../components/index.mjs'
import ts from 'typescript'
import { components, composables } from '../components/index.mjs'

export function composableValue(reader, node, ctx, call = false) {
  const member = call ? node.expression : node
  if (!ts.isPropertyAccessExpression(member) || !ts.isIdentifier(member.expression)) return
  const name = member.expression.text
  if (ctx.locals.has(name)) return
  const reference = ctx.component.refs.find((ref) => ref.name === name && ref.owner)
  if (!reference) return
  const definition = composableOf(reference)
  const read = call ? definition.valueCall : definition.member
  if (!read) return
  const value = read({ node, ref: name, reference, ctx, reader })
  return value ? { ...value, owner: reference.owner, factory: reference.factory } : value
}

/** A raw wrapper is meaningful for JS controllers, never a second Swift lifetime owner. */
export function ownedFactoryCall(node) {
  if (!ts.isCallExpression(node)) return node
  if (!ts.isIdentifier(node.expression) || node.expression.text !== 'markRaw') return node
  const value = node.arguments[0]
  return !node.typeArguments?.length &&
    node.arguments.length === 1 &&
    value &&
    ts.isCallExpression(value) &&
    ts.isIdentifier(value.expression) &&
    composables[value.expression.text]
    ? value
    : node
}

export function composableImports(module) {
  return Object.values(composables).filter((made) => made.module === module)
}

export function composableImportAllowed(module, name, typeOnly = false) {
  return composableImports(module).some((made) =>
    typeOnly
      ? Object.hasOwn(made.exports ?? {}, name) || made.typeImports?.[module]?.includes(name)
      : made.name === name,
  )
}
