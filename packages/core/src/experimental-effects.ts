import type {
  MotionBinding,
  MotionColor,
  MotionOptions,
  MotionPlayback,
  MotionReadable,
} from './experimental.js'
import type { MotionSurfaceEffects, MotionSurfaceEffectsAdapter } from './experimental-surfaces.js'

/** Availability of the actual renderer backend; no simulated native fallback. */
export type MotionEffectKind =
  | 'gradient'
  | 'shimmer'
  | 'loader'
  | 'circular'
  | 'text'
  | 'particles'
  | 'confetti'
  | 'blur'
  | 'shape'
  | 'liquid'
  | 'image'
  | 'symbol'
  | 'keyboard'
  | 'shadow'
export interface MotionGradientValues {
  colors?: readonly string[]
  stops?: readonly number[]
  angle?: number
  center?: { x: number; y: number }
  radius?: number
}
export interface MotionGradientOptions extends MotionGradientValues {
  type: 'linear' | 'radial' | 'conic'
  colors: readonly string[]
}
export interface MotionGradientBindings<N = MotionReadable, C = MotionColor> {
  colors?: readonly (string | C)[]
  stops?: readonly (number | N)[]
  angle?: number | N
  center?: { x?: number | N; y?: number | N }
  radius?: number | N
}
export interface MotionGradient extends MotionBinding {
  readonly type: MotionGradientOptions['type']
  readonly suspended: boolean
  animate(values: MotionGradientValues, options?: MotionOptions): MotionPlayback
  set(values: MotionGradientValues): void
  bind(values: MotionGradientBindings): MotionBinding
  stop(): void
  suspend(): void
  resume(): void
}
export interface MotionLoadingEffect extends MotionBinding {
  readonly supported: boolean
}
export interface MotionShimmerOptions {
  duration?: number
}
export interface MotionLoaderOptions {
  style?: 'dots' | 'bars' | 'ring'
  color?: string
  size?: number
  duration?: number
}
export interface MotionCircularOptions {
  /** Local CSS pixels on Web, DIPs on native. Omit to preserve a reversing circle. */
  origin?: { x: number; y: number }
  duration?: number
}
export interface MotionCircular extends MotionBinding {
  readonly supported: boolean
  /** Move focus outside interactive content before conceal; the resource owns inert state. */
  conceal(options?: MotionCircularOptions): MotionPlayback
  reveal(options?: MotionCircularOptions): MotionPlayback
}
export interface MotionTextOptions {
  by?: 'letter' | 'word'
  duration?: number
  stagger?: number
  delay?: number
  y?: number
}
export interface MotionRollOptions {
  format?: (value: number) => string
  duration?: number
  bounce?: number
  stagger?: number
  delay?: number
  direction?: 'auto' | 'up' | 'down'
  tabular?: boolean
}
export interface MotionVisualSurface extends MotionSurfaceEffects {
  supports(effect: MotionEffectKind): boolean
  gradient(options: MotionGradientOptions): MotionGradient
  shimmer(options?: MotionShimmerOptions): MotionLoadingEffect
  loader(options?: MotionLoaderOptions): MotionLoadingEffect
  circular(): MotionCircular
  /** Only explicit MText text targets; rich/slotted content is rejected. */
  animateText(options?: MotionTextOptions): MotionPlayback
  rollTo(value: number | string, options?: MotionRollOptions): MotionPlayback
}
type NumericSource = Pick<MotionReadable, 'get' | 'dispose'>
type ColorSource = Pick<MotionColor, 'get' | 'dispose'>
export interface MotionGradientAdapter extends Omit<MotionGradient, 'disposed' | 'bind'> {
  bind(values: MotionGradientBindings<NumericSource, ColorSource>): { dispose(): void }
}
export interface MotionVisualAdapter
  extends
    MotionSurfaceEffectsAdapter,
    Omit<
      MotionVisualSurface,
      'gradient' | 'shimmer' | 'loader' | 'circular' | keyof MotionSurfaceEffects
    > {
  gradient(options: MotionGradientOptions): MotionGradientAdapter
  shimmer(options?: MotionShimmerOptions): Omit<MotionLoadingEffect, 'disposed'>
  loader(options?: MotionLoaderOptions): Omit<MotionLoadingEffect, 'disposed'>
  circular(): Omit<MotionCircular, 'disposed'>
}

/** Structural translation only: validation, interpolation and scheduling stay in Jolt. */
export function mapGradientBindings<N, C, RN, RC>(
  values: MotionGradientBindings<N, C>,
  numeric: (value: N) => RN,
  color: (value: C) => RC,
): MotionGradientBindings<RN, RC> {
  const number = (value: number | N) => (typeof value === 'number' ? value : numeric(value))
  return {
    ...values,
    ...(values.colors === undefined
      ? {}
      : {
          colors: values.colors.map((value) => (typeof value === 'string' ? value : color(value))),
        }),
    ...(values.stops === undefined ? {} : { stops: values.stops.map(number) }),
    ...(values.angle === undefined ? {} : { angle: number(values.angle) }),
    ...(values.radius === undefined ? {} : { radius: number(values.radius) }),
    ...(values.center === undefined
      ? {}
      : {
          center: {
            ...(values.center.x === undefined ? {} : { x: number(values.center.x) }),
            ...(values.center.y === undefined ? {} : { y: number(values.center.y) }),
          },
        }),
  } as MotionGradientBindings<RN, RC>
}
