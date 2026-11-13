import ts from 'typescript'
import { T, primitive } from '../model.mjs'

export function collectionType(type, node, { checker, mapType, fail }, allowed) {
  const symbol = type.getSymbol()
  if (
    !['Set', 'Map'].includes(symbol?.name) ||
    !symbol.declarations?.some((item) =>
      /[\/]lib\.es\d.*\.d\.ts$/.test(item.getSourceFile().fileName),
    )
  )
    return
  if (!allowed)
    fail(
      node,
      'Set/Map are local working collections. Return arrays or records; do not expose collections as reactive state, props or module constants.',
    )
  const arguments_ = checker.getTypeArguments(type)
  if (arguments_.some((type) => type.flags & ts.TypeFlags.Object))
    fail(
      node,
      'Local Set/Map keys and values are strings, numbers or booleans; object identity is not portable.',
    )
  const types = arguments_.map((type) => mapType(type, node))
  if (types.some((type) => !primitive(type)))
    fail(
      node,
      'Local Set/Map keys and values are strings, numbers or booleans; object identity is not portable.',
    )
  return symbol.name === 'Set'
    ? { k: 'set', of: types[0] }
    : { k: 'map', key: types[0], of: types[1] }
}

export function collectionNew(node, ctx, { expr, typeOf, fail }) {
  if (!ts.isIdentifier(node.expression) || !['Set', 'Map'].includes(node.expression.text)) return
  const type = typeOf(node, { allowCollections: true })
  if (!['set', 'map'].includes(type.k)) fail(node, 'Use the built-in Set or Map constructor.')
  if ((node.arguments?.length ?? 0) > 1) fail(node, 'Set/Map take one initial list.')
  const initial = node.arguments?.[0]
  if (type.k === 'set')
    return {
      e: 'collection-new',
      type,
      items: initial
        ? expr(initial, ctx, T.array(type.of))
        : { e: 'array', items: [], type: T.array(type.of) },
    }
  if (initial && !ts.isArrayLiteralExpression(initial))
    fail(
      initial,
      'Initialize Map with explicit [key, value] pairs; iterator protocols are not portable.',
    )
  const pairs = (initial?.elements ?? []).map((pair) => {
    if (!ts.isArrayLiteralExpression(pair) || pair.elements.length !== 2)
      fail(pair, 'Each Map entry is [key, value].')
    return {
      key: expr(pair.elements[0], ctx, type.key),
      value: expr(pair.elements[1], ctx, type.of),
    }
  })
  return { e: 'collection-new', type, pairs }
}

export function collectionCall(node, ctx, { expr, args, fail }) {
  const callee = node.expression
  if (!ts.isPropertyAccessExpression(callee) || callee.questionDotToken) return
  // Only local collections can be mutated; the reader refuses collection parameters/state.
  if (
    !ts.isIdentifier(callee.expression) ||
    !['set', 'map'].includes(ctx.locals.get(callee.expression.text)?.k)
  )
    return
  const object = expr(callee.expression, ctx),
    method = callee.name.text
  const key = object.type.k === 'set' ? object.type.of : object.type.key
  const signatures = {
    has: [[key], T.boolean],
    delete: [[key], T.boolean],
    clear: [[], T.void],
    ...(object.type.k === 'set'
      ? { add: [[key], object.type] }
      : { get: [[key], T.optional(object.type.of)], set: [[key, object.type.of], object.type] }),
  }
  if (!signatures[method])
    fail(
      node,
      'Local Set/Map support has, size, add/set, get, delete and clear. Consume keys()/values() immediately with Array.from or spread.',
    )
  const [parameters, type] = signatures[method]
  return {
    e: 'collection-call',
    object,
    method,
    args: args(node, node.arguments, parameters, ctx),
    type,
  }
}

export function collectionArray(node, ctx, { expr, fail }) {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ['keys', 'values'].includes(node.expression.name.text)
  ) {
    const source = node.expression.expression
    if (!ts.isIdentifier(source) || !['set', 'map'].includes(ctx.locals.get(source.text)?.k)) return
    if (node.arguments.length) fail(node, 'keys()/values() take no arguments.')
    const object = expr(source, ctx),
      method = node.expression.name.text
    const element = method === 'keys' && object.type.k === 'map' ? object.type.key : object.type.of
    return { e: 'collection-array', object, method, type: T.array(element) }
  }
  if (
    (ts.isIdentifier(node) && ctx.locals.get(node.text)?.k === 'set') ||
    (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Set')
  ) {
    const object = expr(node, ctx)
    return { e: 'collection-array', object, method: 'values', type: T.array(object.type.of) }
  }
}
