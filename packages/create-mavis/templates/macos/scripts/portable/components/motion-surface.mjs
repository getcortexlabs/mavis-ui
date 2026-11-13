import {
  motionSurfaceOpen,
  motionSurfaceMember,
  motionSurfaceCall,
  motionSurfaceReadCall,
  motionPlaybackMember,
  motionPlaybackEffect,
  motionPlaybackAwait,
  motionSurfaceType,
  motionPlaybackType,
} from '../frontends/motion-surface.mjs'
import { motionSurfaceRuntime } from './motion-surface-runtime.mjs'
export { motionSurfaceRuntime }
export { motionSurfaceReference } from '../frontends/motion-surface.mjs'
export const motionSurfaceTypes = `
interface MotionPlayback { readonly finished: Promise<boolean>; stop(): void }
interface MotionControlledPlayback extends MotionPlayback { readonly paused: boolean; readonly duration: number; progress: number; pause(): void; resume(): void }
interface MotionSurface { readonly available: boolean; set(values: unknown): MotionPlayback; animate(values: unknown, options?: unknown): MotionControlledPlayback; onAvailable(setup: () => void | (()=>void)): ()=>void; refresh(): void }
`
export function motionFramesSwift(emit, first, set = false) {
  const fields = first.fields.map(
    (field) =>
      `${JSON.stringify(field.name)}: ${set ? emit.expr(field.value) : field.value.e === 'array' ? `[${field.value.items.map((item) => (item.e === 'lit' && item.value === null ? 'nil' : emit.expr(item))).join(', ')}]` : `[${emit.expr(field.value)}]`}`,
  )
  return fields.length ? `[${fields.join(', ')}]` : '[:]'
}
export function motionOptionsSwift(emit, timing) {
  const args = ['type', 'duration', 'bounce', 'ease', 'delay'].flatMap((name) => {
    const field = timing?.fields.find((field) => field.name === name)
    return field ? [`${name}: ${emit.expr(field.value)}`] : []
  })
  return `MavisMotionOptions(${args.join(', ')})`
}
function motionCall(emit, value, owner = 'self', indent = 0) {
  const target = value.object ? emit.expr(value.object) : `${owner}.${value.ref}`
  if (value.method === 'onAvailable')
    return `${target}.onAvailable(${emit.ownedCallback(value.callback, indent)})`
  if (value.method === 'set' || value.method === 'animate') {
    const values = motionFramesSwift(emit, value.args[0], value.method === 'set')
    const timing = value.args[1]
    return `try ${target}.${value.method}(${values}${timing ? `, options: ${motionOptionsSwift(emit, timing)}` : ''})`
  }
  return `${value.throws ? 'try ' : ''}${target}.${value.method}()`
}
export const motionSurfaceComposable = {
  name: 'createMotionSurface',
  kind: 'motion-surface',
  resource: true,
  module: '@getcortexlabs/mavis-core/experimental',
  declaration: 'function createMotionSurface(): MotionSurface',
  valueType: motionSurfaceType,
  typeImports: {
    '@getcortexlabs/mavis-core/experimental': [
      'MotionSurface',
      'MotionPlayback',
      'MotionControlledPlayback',
    ],
  },
  types: {
    MotionSurface: { type: motionSurfaceType },
    MotionPlayback: {
      type: motionPlaybackType,
      member: motionPlaybackMember,
      effect: motionPlaybackEffect,
      await: motionPlaybackAwait,
    },
    MotionControlledPlayback: {
      type: motionPlaybackType,
      member: motionPlaybackMember,
      effect: motionPlaybackEffect,
      await: motionPlaybackAwait,
    },
  },
  open: motionSurfaceOpen,
  member: motionSurfaceMember,
  call: motionSurfaceCall,
  valueCall: motionSurfaceReadCall,
  swift: (name) => `@StateObject private var ${name}: MavisMotionSurface`,
  initialize: (reference) => `_${reference.name} = StateObject(wrappedValue: MavisMotionSurface())`,
  contextType: 'MavisMotionSurface',
  dispose: (reference, owner = 'self') => `${owner}.${reference.name}.dispose()`,
  statement: (emit, value, indent, owner) =>
    `${' '.repeat(indent)}${motionCall(emit, value, owner, indent)}`,
  expression: motionCall,
  value: (emit, value, owner = 'self') => `${owner}.${value.ref}.${value.field}`,
  vue: (reference) => ({
    imports: { '@getcortexlabs/mavis-core/experimental': ['createMotionSurface'] },
    setup: [`const ${reference.name} = createMotionSurface()`],
  }),
  unused: (name) => `${name} needs a view with motionSurface to own its presentation.`,
}
