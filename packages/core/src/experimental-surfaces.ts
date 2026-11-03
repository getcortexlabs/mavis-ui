import type { MotionBinding, MotionOptions, MotionPlayback } from './experimental.js'
import type { MotionControlledPlayback } from './experimental-playback.js'

/** The common renderer subset. Distances are CSS pixels on Web and DIPs on native. */
export interface MotionParticleOptions {
  colors?: readonly string[]
  shape?: 'circle' | 'rectangle' | 'ring'
  source?: 'center' | 'top' | 'bottom'
  rate?: number
  lifetime?: number
  size?: number
  velocity?: number
  velocityRange?: number
  angle?: number
  spread?: number
  gravity?: number
  spin?: number
  spinRange?: number
  fadeOut?: boolean
  duration?: number
}
export interface MotionConfettiOptions {
  count?: number
  colors?: readonly string[]
}
export interface MotionDecoration extends MotionBinding {
  readonly supported: boolean
}
export interface MotionBlurOptions {
  amount?: number
  radius?: number
  style?: 'system' | 'light' | 'dark'
}
export interface MotionBlur extends MotionBinding {
  animate(amount: number, options?: MotionOptions): MotionControlledPlayback
  set(amount: number): void
  stop(): void
  snapshot(): { amount: number; appliedAmount: number; backend: string; attached: boolean }
}
export interface MotionShapeValues {
  d?: string
  strokeStart?: number
  strokeEnd?: number
}
export interface MotionShapeOptions extends MotionShapeValues {
  d: string
  viewBox: readonly [number, number, number, number]
  stroke?: string
  fill?: string
  strokeWidth?: number
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
  fillRule?: 'nonzero' | 'evenodd'
}
export interface MotionShape extends MotionBinding {
  animate(values: MotionShapeValues, options?: MotionOptions): MotionControlledPlayback
  set(values: MotionShapeValues): void
  stop(): void
}
export interface MotionLiquid extends MotionDecoration {
  pause(): void
  resume(): void
}
export interface MotionLiquidOptions {
  intensity?: number
  duration?: number
}
export type MotionImageEffectName = 'ripple' | 'distortion' | 'dissolve'
export interface MotionImagePlayback extends MotionControlledPlayback {
  reverse(): void
  finish(): void
}
export interface MotionImageEffectOptions {
  origin?: { x: number; y: number }
  amplitude?: number
  radius?: number
  duration?: number
  seed?: number
  /** A source URL, prepared by MImage before starting. Success emits update:src. */
  to?: string
  paused?: boolean
}
export type MotionSymbolEffectName = 'bounce' | 'pulse' | 'scale' | 'variableColor'
export interface MotionSymbolOptions {
  speed?: number
  repeat?: boolean
}
export interface MotionKeyboardFollowOptions {
  offset?: number
}
export interface MotionSurfaceEffects {
  particles(options?: MotionParticleOptions): MotionDecoration
  confetti(options?: MotionConfettiOptions): MotionDecoration
  blur(options?: MotionBlurOptions): MotionBlur
  shape(options: MotionShapeOptions): MotionShape
  /** Only a loaded MImage target, not its layout wrapper. */
  liquid(options?: MotionLiquidOptions): MotionLiquid
  imageEffect(
    name: MotionImageEffectName,
    options?: MotionImageEffectOptions,
  ): Promise<MotionImagePlayback>
  /** MIcon artwork: Web supports glyphs; native requires an iOS system-symbol image. */
  symbolEffect(name: MotionSymbolEffectName, options?: MotionSymbolOptions): MotionPlayback
  /** Use a dedicated, untranslated composer surface. */
  followKeyboard(options?: MotionKeyboardFollowOptions): MotionBinding
}
export interface MotionSurfaceEffectsAdapter {
  particles(options?: MotionParticleOptions): Omit<MotionDecoration, 'disposed'>
  confetti(options?: MotionConfettiOptions): Omit<MotionDecoration, 'disposed'>
  blur(options?: MotionBlurOptions): Omit<MotionBlur, 'disposed' | 'animate'> & {
    animate(amount: number, options?: MotionOptions): MotionPlayback
  }
  shape(options: MotionShapeOptions): Omit<MotionShape, 'disposed' | 'animate'> & {
    animate(values: MotionShapeValues, options?: MotionOptions): MotionPlayback
  }
  liquid(options?: MotionLiquidOptions): Omit<MotionLiquid, 'disposed'>
  imageEffect(
    name: MotionImageEffectName,
    options: MotionImageEffectOptions | undefined,
    live: () => boolean,
  ): Promise<MotionPlayback>
  symbolEffect(name: MotionSymbolEffectName, options?: MotionSymbolOptions): MotionPlayback
  followKeyboard(options?: MotionKeyboardFollowOptions): { dispose(): void }
}
