import ts from 'typescript'
import { T } from '../model.mjs'
import {
  frames,
  options,
  motionSurfaceType,
  motionPlaybackType,
  motionSurfaceMember,
} from './motion-surface.mjs'
export const motionTimelineType = {
  k: 'opaque',
  name: 'MotionTimeline',
  swift: 'MavisMotionPlayback',
}
export const motionRegionType = { k: 'opaque', name: 'MotionRegion', swift: 'MavisMotionRegion' }
export function motionRegionOpen({ call, fail }) {
  if (call.arguments.length || call.typeArguments?.length)
    fail(call, 'createMotionRegion takes no arguments.')
}
export const motionRegionMember = motionSurfaceMember
export function motionRegionCall(context) {
  const { node, ref, ctx, reader } = context
  const method = node.expression.name.text
  if (method === 'onAvailable') {
    if (node.arguments.length !== 1) reader.fail(node, 'onAvailable takes one setup callback.')
    const callback = reader.ownedCallback(node.arguments[0], [], T.void, ctx)
    if (callback.throws)
      reader.fail(node, 'Handle errors inside the motion setup callback with try/catch.')
    return { s: 'call', owner: 'MBox', factory: 'createMotionRegion', ref, method, callback }
  }
  if (!['timeline', 'sequence'].includes(method))
    reader.fail(node, `${method} needs additional motion region support on the Mac (#354).`)
  const list = node.arguments[0]
  if (node.arguments.length !== 1 || !list || !ts.isArrayLiteralExpression(list))
    reader.fail(node, `${method} takes an explicit list of surface/frame/timing tuples.`)
  if (list.elements.length === 0 || list.elements.length > 256)
    reader.fail(list, 'A motion group needs 1–256 steps.')
  const items = list.elements.map((step) => {
    if (!ts.isArrayLiteralExpression(step) || step.elements.length < 2 || step.elements.length > 3)
      reader.fail(
        step,
        'Use [surface, frames, timing?]; callback timeline steps need additional support (#354).',
      )
    const target = reader.expr(step.elements[0], ctx, motionSurfaceType)
    const value = frames(step.elements[1], ctx, reader)
    const timing = options(step.elements[2], ctx, reader, true)
    return {
      e: 'array',
      items: [target, value, ...(timing ? [timing] : [])],
      type: { k: 'opaque', name: 'MotionTimelineStep', swift: 'MavisMotionStep' },
    }
  })
  return {
    s: 'call',
    owner: 'MBox',
    factory: 'createMotionRegion',
    ref,
    method,
    args: [
      {
        e: 'array',
        items,
        type: T.array({ k: 'opaque', name: 'MotionTimelineStep', swift: 'MavisMotionStep' }),
      },
    ],
    throws: true,
    type: method === 'timeline' ? motionTimelineType : motionPlaybackType,
  }
}
export function motionRegionReadCall(context) {
  const value = motionRegionCall(context)
  if (value.method === 'onAvailable')
    context.reader.fail(
      context.node,
      'Retaining availability cleanup needs additional callback support (#354).',
    )
  if (!context.ctx.failing)
    context.reader.fail(context.node, 'Keep a fallible motion timeline inside try/catch.')
  const { s, ...rest } = value
  return { e: 'controller-call', ...rest }
}
export function motionRegionReference({ value, ctx, fail, ts }) {
  const ref =
    ts.isIdentifier(value) &&
    ctx.component.refs.find((ref) => ref.name === value.text && ref.kind === 'motion-region')
  if (!ref) fail(value, 'motionRegion takes createMotionRegion() owned by this shared component.')
  if (ref.motionAttached || ctx.inFor)
    fail(value, 'A motion region binds to one view; repeated views need their own component owner.')
  ref.field = true
  ref.motionAttached = true
  return { ref: ref.name }
}
