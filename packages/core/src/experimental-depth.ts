import type { MotionVector } from './experimental-platforms.js'
import type { Shadow } from './theme/types.js'

export type MotionPathSegment =
  | { to: MotionVector; control?: undefined }
  | { to: MotionVector; control: MotionVector }
  | { to: MotionVector; control: readonly [MotionVector, MotionVector] }
export interface MotionPathBounds {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}
/** A translation path in CSS pixels on Web and device-independent pixels on NativeScript. */
export interface MotionPath {
  readonly data: string
  readonly bounds: MotionPathBounds
  /** Where the surface rests afterwards, with the forward tangent in degrees. */
  readonly end: Readonly<MotionVector & { rotate: number }>
}
export type MotionShadowValues = Partial<
  Record<'shadowOpacity' | 'shadowRadius' | 'shadowOffsetX' | 'shadowOffsetY', number>
>

const paths = new WeakSet<MotionPath>()
const limit = 1e5
const round = (value: number) => Number(value.toFixed(3))
const point = (value: MotionVector | undefined, name: string): MotionVector => {
  if (
    !value ||
    typeof value !== 'object' ||
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    Math.abs(value.x) > limit ||
    Math.abs(value.y) > limit
  )
    throw new RangeError(`Path ${name} needs finite x and y within ${limit} pixels/DIPs.`)
  return { x: round(value.x), y: round(value.y) }
}
const bezier = (points: readonly number[], t: number) => {
  let values = [...points]
  while (values.length > 1)
    values = values.slice(1).map((value, index) => values[index]! + (value - values[index]!) * t)
  return values[0]!
}
const turns = (points: readonly number[]) => {
  if (points.length === 3) {
    const divisor = points[0]! - 2 * points[1]! + points[2]!
    return divisor === 0 ? [] : [(points[0]! - points[1]!) / divisor]
  }
  const a = -points[0]! + 3 * points[1]! - 3 * points[2]! + points[3]!
  const b = 2 * (points[0]! - 2 * points[1]! + points[2]!)
  const c = points[1]! - points[0]!
  if (a === 0) return b === 0 ? [] : [-c / b]
  const root = b * b - 4 * a * c
  if (root < 0) return []
  return [(-b + Math.sqrt(root)) / (2 * a), (-b - Math.sqrt(root)) / (2 * a)]
}

/** Lines, quadratic and cubic curves in one continuous path, with bounds known up front. */
export function motionPath(start: MotionVector, ...segments: MotionPathSegment[]): MotionPath {
  if (segments.length < 1 || segments.length > 64)
    throw new RangeError('A motion path needs between 1 and 64 segments.')
  let from = point(start, 'start')
  let data = `M ${from.x} ${from.y}`
  const xs = [from.x]
  const ys = [from.y]
  let rotate = 0
  segments.forEach((segment, index) => {
    const to = point(segment?.to, `segment ${index + 1} end`)
    const controls = (
      segment.control === undefined
        ? []
        : Array.isArray(segment.control)
          ? segment.control
          : [segment.control]
    ).map((value, at) => point(value as MotionVector, `segment ${index + 1} control ${at + 1}`))
    if (controls.length > 2) throw new RangeError('A path segment takes one or two control points.')
    const all = [from, ...controls, to]
    if (all.every((value) => value.x === from.x && value.y === from.y))
      throw new RangeError(`Path segment ${index + 1} has no length.`)
    data += ` ${'LQC'[controls.length]} ${[...controls, to].map((value) => `${value.x} ${value.y}`).join(' ')}`
    for (const [axis, values] of [
      ['x', xs],
      ['y', ys],
    ] as const) {
      const line = all.map((value) => value[axis])
      values.push(to[axis])
      if (controls.length)
        for (const t of turns(line)) if (t > 0 && t < 1) values.push(bezier(line, t))
    }
    const tangent = all
      .slice(0, -1)
      .reverse()
      .find((value) => value.x !== to.x || value.y !== to.y)!
    rotate = (Math.atan2(to.y - tangent.y, to.x - tangent.x) * 180) / Math.PI
    from = to
  })
  const path: MotionPath = Object.freeze({
    data,
    bounds: Object.freeze({
      left: round(Math.min(...xs)),
      top: round(Math.min(...ys)),
      right: round(Math.max(...xs)),
      bottom: round(Math.max(...ys)),
    }),
    end: Object.freeze({ x: from.x, y: from.y, rotate: round(rotate) }),
  })
  paths.add(path)
  return path
}

const planar = ['x', 'y', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity', 'rotateX', 'rotateY']
const shadows = ['shadowOpacity', 'shadowRadius', 'shadowOffsetX', 'shadowOffsetY']
/** The channels a path replaces, so renderers can release them from other owners. */
export function motionChannels(values: Record<string, unknown>) {
  return Object.keys(values).flatMap((key) =>
    key === 'path' ? ['x', 'y', ...(values.orient ? ['rotate'] : [])] : key === 'orient' ? [] : key,
  )
}
/** Renderer input: the descriptor becomes the path string both engines read. */
export function motionKeyframes<T extends { path?: MotionPath }>(
  values: T,
): Omit<T, 'path'> & { path?: string } {
  const { path, ...channels } = values
  return path === undefined ? channels : { ...channels, path: path.data }
}

/** Rejects a request before a renderer replaces the motion already running. */
export function validateMotion(
  values: Record<string, unknown>,
  frames: boolean,
  supportsShadow: () => boolean,
) {
  if (!values || typeof values !== 'object') throw new TypeError('Motion needs an object.')
  const keys = Object.keys(values).filter((key) => values[key] !== undefined)
  for (const key of keys) {
    const value = values[key]
    if (frames && key === 'path') {
      if (!paths.has(value as MotionPath))
        throw new TypeError('Use motionPath() to declare a path.')
      continue
    }
    if (frames && key === 'orient') {
      if (typeof value !== 'boolean') throw new TypeError('Path orient must be a boolean.')
      continue
    }
    if (!planar.includes(key) && !shadows.includes(key))
      throw new TypeError(`Unsupported motion property "${key}".`)
    const list = frames && Array.isArray(value) ? value : [value]
    if (
      !list.length ||
      list.length > 1024 ||
      list.some((entry) => !(frames && entry === null) && !Number.isFinite(entry))
    )
      throw new TypeError(`Motion property "${key}" needs finite numbers.`)
    const numbers = list.filter((entry): entry is number => entry !== null)
    if (key === 'shadowOpacity' && numbers.some((entry) => entry < 0 || entry > 1))
      throw new RangeError('Shadow opacity must be between 0 and 1.')
    if (key === 'shadowRadius' && numbers.some((entry) => entry < 0))
      throw new RangeError('Shadow radius cannot be negative.')
  }
  if (keys.includes('orient') && !keys.includes('path'))
    throw new TypeError('Path orient needs a path.')
  if (keys.includes('path')) {
    if (keys.includes('x') || keys.includes('y'))
      throw new TypeError('A path owns x and y. Remove them or drop the path.')
    if (values.orient === true && keys.includes('rotate'))
      throw new TypeError('An oriented path owns rotate. Remove it or turn orient off.')
  }
  if (keys.some((key) => shadows.includes(key)) && !supportsShadow())
    throw new Error(
      'Shadow motion is unavailable on this surface. Check supports("shadow") and keep the static shadow.',
    )
}

/** Projection distance for the rotateX/rotateY of a box's direct children. */
export function resolvePerspective(value: number | undefined) {
  if (value === undefined) return undefined
  if (!Number.isFinite(value) || value < 1 || value > limit)
    throw new RangeError('Perspective must be between 1 and 100000 pixels/DIPs.')
  return value
}

/** A theme elevation as shadow channels, so a recipe moves between the theme's own shadows. */
export function elevationMotion(shadow: Readonly<Shadow>): Required<MotionShadowValues> {
  if (shadow.spread !== 0) throw new RangeError('Shadow motion needs an elevation without spread.')
  const color = shadow.color.trim().toLowerCase()
  const parts = /^rgba?\(([^)]*)\)$/
    .exec(color)?.[1]
    ?.split(/[\s,/]+/)
    .filter(Boolean)
  const alpha =
    color === 'transparent'
      ? 0
      : parts
        ? parts.length > 3
          ? parts[3]!.endsWith('%')
            ? parseFloat(parts[3]!) / 100
            : Number(parts[3])
          : 1
        : /^#(?:[\da-f]{4}|[\da-f]{8})$/.test(color)
          ? parseInt(color.length === 5 ? color[4]!.repeat(2) : color.slice(7), 16) / 255
          : /^#(?:[\da-f]{3}|[\da-f]{6})$/.test(color)
            ? 1
            : Number.NaN
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)
    throw new TypeError('Shadow motion reads rgb(), rgba(), hex or transparent colors.')
  return {
    shadowOpacity: round(alpha),
    shadowRadius: shadow.blur / 2,
    shadowOffsetX: shadow.x,
    shadowOffsetY: shadow.y,
  }
}
