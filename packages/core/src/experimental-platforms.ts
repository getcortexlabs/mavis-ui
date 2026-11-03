import type { MotionBinding, MotionSurface } from './experimental.js'

export interface MotionKeyboardState {
  readonly visible: boolean
  readonly height: number
  readonly duration: number
  readonly backend: 'native' | 'virtual-keyboard' | 'visual-viewport' | 'none'
  readonly accuracy: 'native' | 'exact' | 'estimated' | 'unavailable'
}
export interface MotionKeyboard extends MotionBinding {
  snapshot(): MotionKeyboardState
}
export interface MotionVector {
  x: number
  y: number
}
export interface MotionPhysicsLine {
  color: string
  width?: number
}
export interface MotionAttachment {
  anchor: MotionVector
  length?: number
  stiffness?: number
  damping?: number
  line?: MotionPhysicsLine
}
export interface MotionPhysicsSnap {
  points: readonly MotionVector[]
  stiffness?: number
  damping?: number
  projection?: number
}
export interface MotionPhysicsSpring {
  id: string
  from: string
  to: string
  length: number
  stiffness?: number
  damping?: number
  line?: MotionPhysicsLine
}
export interface MotionCircleBody<T = MotionSurface> {
  id: string
  target: T
  radius: number
  x: number
  y: number
  mass?: number
  velocity?: MotionVector
  attachment?: MotionAttachment
  snap?: MotionPhysicsSnap
  drag?:
    | 'direct'
    | {
        type: 'spring'
        length?: number
        stiffness?: number
        damping?: number
        line?: MotionPhysicsLine
      }
}
export interface MotionPhysicsOptions {
  gravity?: MotionVector
  restitution?: number
  damping?: number
  reducedMotion?: 'pause' | 'continue'
  springs?: readonly MotionPhysicsSpring[]
}
export interface MotionPhysicsSnapshot {
  status: 'running' | 'sleeping' | 'paused' | 'detached' | 'invalid-bounds' | 'disposed'
  frames: number
  steps: number
  contacts: number
  droppedMs: number
  bodies: {
    id: string
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    held: boolean
  }[]
}
export interface MotionPhysicsWorld extends MotionBinding {
  readonly paused: boolean
  pause(): void
  resume(): void
  reset(): void
  impulse(id: string, impulse: MotionVector): void
  attach(id: string, attachment: MotionAttachment | null): void
  spring(id: string, spring: Omit<MotionPhysicsSpring, 'id'> | null): void
  snapTo(id: string, index: number): void
  snapshot(): MotionPhysicsSnapshot
}
