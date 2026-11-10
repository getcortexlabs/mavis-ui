import type { MotionBinding, MotionReadable, MotionValueAdapter } from './experimental.js'

export type MotionSensorKind = 'rotation' | 'gravity'
export type MotionSensorStatus =
  | 'idle'
  | 'permission-required'
  | 'starting'
  | 'active'
  | 'paused'
  | 'unavailable'
  | 'denied'
  | 'error'
  | 'replaying'
  | 'disposed'
export interface MotionSensorOptions {
  interval?: number | 'auto'
  coordinates?: 'device' | 'interface'
  reducedMotion?: 'pause' | 'continue'
  onStatus?: (status: MotionSensorStatus) => void
}
export interface MotionSensorSnapshot {
  status: MotionSensorStatus
  available: boolean
  timestamp: number | null
  samples: number
  values: number[]
  /** `replay` means Jolt is playing synthetic samples; it never proves hardware availability. */
  backend: 'native' | 'device-orientation' | 'device-motion' | 'replay' | 'none'
  reason?: string
}
export interface MotionSensor<T = MotionReadable> extends MotionBinding {
  readonly kind: MotionSensorKind
  readonly status: MotionSensorStatus
  readonly available: boolean
  readonly paused: boolean
  readonly x: T
  readonly y: T
  readonly z: T
  /** Only rotation provides a Hamilton quaternion (xyzw) and recenter. */
  readonly quaternion?: Readonly<{ x: T; y: T; z: T; w: T }>
  recenter(): void
  /** Web may prompt. Native returns not-required, which is not availability. */
  requestPermission(): Promise<'granted' | 'denied' | 'unavailable' | 'not-required'>
  snapshot(): MotionSensorSnapshot
  pause(): void
  resume(): void
}
export type MotionSensorAdapter = Omit<
  MotionSensor<Pick<MotionValueAdapter, 'get' | 'dispose'>>,
  'disposed'
>
