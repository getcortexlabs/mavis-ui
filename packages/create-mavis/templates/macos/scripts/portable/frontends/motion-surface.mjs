import ts from 'typescript'
import { T } from '../model.mjs'

export const motionSurfaceType = { k: 'opaque', name: 'MotionSurface', swift: 'MavisMotionSurface' }
export const motionPlaybackType = {
  k: 'opaque',
  name: 'MotionControlledPlayback',
  swift: 'MavisMotionPlayback',
}
const channels = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'opacity']
function object(node, reader, name, read) {
  if (!ts.isObjectLiteralExpression(node))
    reader.fail(node, `Write ${name} as an object where the motion starts.`)
  const fields = []
  for (const property of node.properties) {
    if (
      !(ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) ||
      !ts.isIdentifier(property.name)
    )
      reader.fail(property, `${name} needs named properties without spreads.`)
    const key = property.name.text
    if (fields.some((field) => field.name === key))
      reader.fail(property, `${key} is declared twice.`)
    fields.push({
      name: key,
      value: read(
        key,
        ts.isShorthandPropertyAssignment(property) ? property.name : property.initializer,
      ),
    })
  }
  return { e: 'record', name, fields, type: { k: 'opaque', name, swift: `Mavis${name}` } }
}
export function frames(node, ctx, reader, set = false) {
  return object(node, reader, set ? 'MotionPoseValues' : 'MotionFrames', (name, value) => {
    if (!channels.includes(name))
      reader.fail(
        value,
        `${name} is not a supported motion channel on the Mac yet (#354). Planar and 3D transform channels and opacity are supported.`,
      )
    if (set) return reader.expr(value, ctx, T.number)
    if (ts.isArrayLiteralExpression(value)) {
      if (value.elements.length < 1 || value.elements.length > 2)
        reader.fail(value, 'Mac motion currently accepts one destination or a from/to pair (#354).')
      const list = value.elements.map((element, index) => {
        if (element.kind === ts.SyntaxKind.NullKeyword) {
          if (index !== 0 || value.elements.length !== 2)
            reader.fail(element, 'Only the starting frame may be null.')
          return { e: 'lit', value: null, type: T.optional(T.number) }
        }
        return reader.expr(element, ctx, T.number)
      })
      return { e: 'array', items: list, type: T.array(T.optional(T.number)) }
    }
    return reader.expr(value, ctx, T.number)
  })
}
export function options(node, ctx, reader, timeline = false) {
  if (!node) return
  return object(node, reader, 'MotionOptions', (name, value) => {
    if (name === 'at' && timeline) {
      const kind = ts.isStringLiteral(value) ? T.string : T.number
      const position = reader.expr(value, ctx, kind)
      if (
        position.e === 'lit' &&
        (kind === T.string
          ? position.value !== '<' &&
            (!/^\+(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(position.value) ||
              !Number.isFinite(Number(position.value)))
          : !Number.isFinite(position.value) || position.value < 0)
      )
        reader.fail(
          value,
          'Use a nonnegative timeline position, < or +milliseconds; backward scheduling needs additional support (#354).',
        )
      return position
    }
    if (!['type', 'duration', 'bounce', 'ease', 'delay'].includes(name))
      reader.fail(value, `${name} needs additional motion support on the Mac (#354).`)
    const expr = reader.expr(value, ctx, ['type', 'ease'].includes(name) ? T.string : T.number)
    if (expr.e === 'lit') {
      if (name === 'type' && !['spring', 'tween'].includes(expr.value))
        reader.fail(
          value,
          'Mac motion supports spring and tween here; gravity needs additional runtime support (#354).',
        )
      if (name === 'ease' && !['linear', 'easeIn', 'easeOut', 'easeInOut'].includes(expr.value))
        reader.fail(value, 'Use linear, easeIn, easeOut or easeInOut.')
      if (
        ['duration', 'delay'].includes(name) &&
        (!Number.isFinite(expr.value) || expr.value < 0 || expr.value > 60000)
      )
        reader.fail(value, `${name} must be between 0 and 60000 ms.`)
      if (name === 'bounce' && (!Number.isFinite(expr.value) || expr.value < -1 || expr.value > 1))
        reader.fail(value, 'bounce must be between -1 and 1.')
    }
    return expr
  })
}
export function motionSurfaceOpen({ call, fail }) {
  if (call.arguments.length || call.typeArguments?.length)
    fail(call, 'createMotionSurface takes no arguments.')
}
export function motionSurfaceMember({ node, ref, ctx, reader }) {
  if (node.name.text !== 'available' || ctx.mode !== 'action')
    reader.fail(
      node,
      'Read motion.available inside an action or onAvailable callback; availability is not a Vue reactive value.',
    )
  return { e: 'controller-value', owner: 'MBox', ref, field: 'available', type: T.boolean }
}
export function motionSurfaceCall({ node, ref, ctx, reader }) {
  const method = node.expression.name.text
  if (method === 'onAvailable') {
    if (node.arguments.length !== 1) reader.fail(node, 'onAvailable takes one setup callback.')
    const callback = reader.ownedCallback(node.arguments[0], [], T.void, ctx)
    if (callback.throws)
      reader.fail(node, 'Handle errors inside the motion setup callback with try/catch.')
    return { s: 'call', owner: 'MBox', ref, method, callback }
  }
  if (method === 'set' || method === 'animate') {
    if (node.arguments.length < 1 || node.arguments.length > (method === 'set' ? 1 : 2))
      reader.fail(
        node,
        `${method} takes values${method === 'animate' ? ' and optional timing' : ''}.`,
      )
    const args = [frames(node.arguments[0], ctx, reader, method === 'set')]
    const timing = options(node.arguments[1], ctx, reader)
    if (timing) args.push(timing)
    return { s: 'call', owner: 'MBox', ref, method, args, throws: true, type: motionPlaybackType }
  }
  if (method === 'refresh') {
    if (node.arguments.length) reader.fail(node, 'refresh takes no arguments.')
    return { s: 'call', owner: 'MBox', ref, method, args: [], throws: true }
  }
  reader.fail(node, `${method} is not yet available through the Mac motion surface (#354).`)
}
export function motionSurfaceReadCall(context) {
  const value = motionSurfaceCall(context)
  if (!['set', 'animate'].includes(value.method))
    context.reader.fail(context.node, 'Only set and animate return playback values here.')
  if (!context.ctx.failing)
    context.reader.fail(
      context.node,
      'Keep a fallible motion playback inside try/catch so a detached presentation can fail safely.',
    )
  const { s, ...rest } = value
  return { e: 'controller-call', ...rest }
}
export function motionPlaybackMember({ node, object, reader }) {
  const field = node.name.text
  if (!['paused', 'duration', 'progress'].includes(field))
    reader.fail(
      node,
      'Read paused, duration or progress; await playback.finished inside an async action.',
    )
  return { e: 'field', object, name: field, type: field === 'paused' ? T.boolean : T.number }
}
export function motionPlaybackAwait({ node, object, reader }) {
  if (node.name.text !== 'finished') reader.fail(node, 'Only playback.finished is asynchronous.')
  return {
    s: 'await-value',
    value: { e: 'field', object, name: 'finished', type: T.boolean },
    type: T.boolean,
    await: true,
  }
}
export function motionPlaybackEffect({ node, object, ctx, reader }) {
  const method = node.expression.name.text
  if (!['pause', 'resume', 'stop'].includes(method) || node.arguments.length)
    reader.fail(node, 'Call playback.pause(), resume() or stop().')
  return { s: 'call', owner: 'MBox', object, method, args: [] }
}
export function motionSurfaceReference({ value, ctx, fail, ts }) {
  const ref =
    ts.isIdentifier(value) &&
    ctx.component.refs.find((ref) => ref.name === value.text && ref.kind === 'motion-surface')
  if (!ref) fail(value, 'motionSurface takes createMotionSurface() owned by this shared component.')
  if (ref.motionAttached)
    fail(
      value,
      'A motion surface binds to one view at a time; declare another surface for another view.',
    )
  if (ctx.inFor)
    fail(value, 'A repeated view needs a separate motion surface per component instance.')
  ref.field = true
  ref.motionAttached = true
  return { ref: ref.name }
}
