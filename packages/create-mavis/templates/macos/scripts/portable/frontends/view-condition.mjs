// A checked optional value can be read inside the visible branch. The model keeps the
// original expression for JavaScript and a stable binding for Swift's optional unwrap.
export const valueKey = (value) =>
  ['state', 'getter', 'prop', 'local'].includes(value.e)
    ? `${value.e}:${value.name}`
    : value.e === 'store'
      ? `store:${value.store}:${value.name}`
      : undefined

export function viewCondition(reader, node, ctx, boolean) {
  const when = reader.expr(node, ctx, boolean)
  const source =
    when.e === 'binary' && when.op === '!==' && when.right.e === 'undefined' ? when.left : undefined
  const key = source && valueKey(source)
  if (!key || source.type.k !== 'optional' || !['record', 'array'].includes(source.type.of.k))
    return { when, inner: { ...ctx, inShow: true } }
  const narrowed = new Map(ctx.narrowed ?? [])
  const names = new Set([
    ...ctx.locals.keys(),
    ...ctx.members.keys(),
    ...[...narrowed.values()].map((value) => value.name),
  ])
  let name = 'mavisValue'
  for (let index = 2; names.has(name); index++) name = `mavisValue${index}`
  const binding = { name, source }
  narrowed.set(key, { e: 'narrowed', name, source, type: source.type.of })
  return { when, binding, inner: { ...ctx, inShow: true, narrowed } }
}
