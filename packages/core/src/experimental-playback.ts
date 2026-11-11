import type {
  MotionPlayback,
  MotionChannelFrames,
  MotionOptions,
  MotionSurface,
  MotionSurfaceAdapter,
  MotionValues,
  MotionBinding,
} from './experimental.js'

/** Controls share the engine clock. resume() continues; it never restarts playback. */
export interface MotionControlledPlayback extends MotionPlayback {
  readonly paused: boolean
  readonly duration: number
  progress: number
  pause(): void
  resume(): void
}
export interface MotionTimeline extends MotionPlayback {
  readonly paused: boolean
  readonly duration: number | undefined
  pause(): void
  resume(): void
}
export type MotionValueOptions = MotionOptions & {
  layer?: string
}
export interface MotionDecayOptions {
  friction?: number
  snap?: readonly number[] | { x?: readonly number[]; y?: readonly number[] }
}
export type MotionPosition = number | '<' | `${'+' | '-'}${number}`
export type MotionStep<T = MotionSurface> =
  | readonly [T, MotionChannelFrames, (MotionOptions & { at?: MotionPosition })?]
  | (() => MotionPlayback)
export type MotionTimelineStep<T = MotionSurface> =
  | readonly [T, MotionChannelFrames, (MotionOptions & { at?: MotionPosition })?]
  | (() => MotionControlledPlayback)
  | { at?: MotionPosition; run: () => MotionControlledPlayback }
export type MotionStateDefinitions<K extends string = string> = Record<
  string,
  Partial<Record<K, MotionValues>>
>
export type MotionStateTransition = MotionOptions & { targets?: Record<string, MotionOptions> }
export interface MotionStates<S extends string = string> extends MotionBinding {
  readonly current: S | undefined
  readonly settled: S | undefined
  readonly paused: boolean
  to(state: S, transition?: MotionStateTransition): MotionPlayback
  pause(): void
  resume(): void
  stop(): void
}
export interface MotionStatesAdapter {
  readonly current: string | undefined
  readonly settled: string | undefined
  readonly paused: boolean
  to(state: string, transition?: MotionStateTransition): MotionPlayback
  attach(name: string, surface: MotionSurfaceAdapter | null): void
  pause(): void
  play(): void
  stop(): void
  dispose(): void
}

const originals = new WeakMap<MotionPlayback, MotionPlayback>()
/** Renderer bridge. Returning the actual handle preserves Jolt's clock and arrival metadata. */
export function motionPlaybackAdapter(handle: MotionPlayback): MotionPlayback {
  const raw = originals.get(handle)
  if (!raw) throw new TypeError('Use playback returned by a Mavis motion surface or region.')
  return raw
}
export function controlledMotionPlayback(
  raw: MotionPlayback,
  live: () => boolean,
): MotionControlledPlayback {
  const control = raw as MotionPlayback & {
    pause(): void
    play(): void
    paused: boolean
    duration: number
    progress: number
  }
  const assert = () => {
    if (!live()) throw new Error('This motion presentation is disposed.')
  }
  const result: MotionControlledPlayback = {
    finished: raw.finished,
    stop() {
      if (live()) raw.stop()
    },
    pause() {
      assert()
      control.pause()
    },
    resume() {
      assert()
      control.play()
    },
    get paused() {
      return control.paused
    },
    get duration() {
      return control.duration
    },
    get progress() {
      return control.progress
    },
    set progress(value) {
      assert()
      control.progress = value
    },
  }
  originals.set(result, raw)
  return result
}
