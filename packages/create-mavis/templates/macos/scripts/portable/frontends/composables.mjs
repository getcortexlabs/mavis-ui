import ts from 'typescript'
import { components } from '../components/index.mjs'

export function composableValue(reader, node, ctx, call = false) {
  const member = call ? node.expression : node
  if (!ts.isPropertyAccessExpression(member) || !ts.isIdentifier(member.expression)) return
  const name = member.expression.text
  if (ctx.locals.has(name)) return
  const reference = ctx.component.refs.find((ref) => ref.name === name && ref.owner)
  if (!reference) return
  const definition = components[reference.owner].composable
  const read = call ? definition.valueCall : definition.member
  if (!read) return
  return read({ node, ref: name, reference, ctx, reader })
}
