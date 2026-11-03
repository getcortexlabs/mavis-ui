import {
  controlledMotionPlayback,
  motionPlaybackAdapter,
  type MotionStep,
  type MotionTimelineStep,
  type MotionTimeline,
  type MotionStateDefinitions,
  type MotionStates,
  type MotionStateTransition,
  type MotionStatesAdapter,
} from './experimental-playback.js'
import type { MotionPlayback } from './experimental.js'
import {
  mapMotionItems,
  type MotionHeaderOptions,
  type MotionHeader,
  type MotionReorderOptions,
  type MotionReorder,
} from './experimental-collections.js'
import {
  motionSurfaceAdapter,
  motionScrollAdapter,
  type MotionSurface,
  type MotionSurfaceAdapter,
  type MotionBinding,
  type MotionReadable,
  type MotionFrames,
  type MotionOptions,
  type MotionSpringOptions,
  type MotionScrollSource,
  type MotionScrollAdapter,
} from './experimental.js'

export interface MotionPointerOptions {
  axis?: 'x' | 'y' | 'both'
  coordinates?: 'normalized' | 'pixels'
  range?: { x?: readonly [number, number]; y?: readonly [number, number] }
  rest?: { x?: number; y?: number }
  spring?: MotionSpringOptions | false
  disabled?: boolean
}
export interface MotionPointer extends MotionBinding {
  readonly x: MotionReadable
  readonly y: MotionReadable
  readonly active: boolean
  readonly execution: 'hover' | 'static'
  update(state: { disabled: boolean }): void
  refresh(): void
}
export type MotionPointerAdapter = Omit<MotionPointer, 'disposed' | 'x' | 'y'> & {
  x: Pick<MotionReadable, 'get' | 'dispose'>
  y: Pick<MotionReadable, 'get' | 'dispose'>
}
export interface MotionViewportOptions {
  frames?: MotionFrames
  transition?: MotionOptions
  stagger?: number
  root?: MotionScrollSource
  /** CSS pixels/DIPs; positive expands the observed viewport. */
  margin?: number
  threshold?: number
  once?: boolean
  disabled?: boolean
}
export interface MotionViewport extends MotionBinding {
  readonly execution: 'intersection-observer' | 'native-layout' | 'static'
  readonly pending: number
  readonly completed: number
  update(state: { disabled: boolean }): void
  refresh(): void
}
export interface MotionSharedResult {
  status: 'completed' | 'cancelled' | 'unavailable'
  reason?:
    | 'interrupted'
    | 'cancelled'
    | 'unloaded'
    | 'suspended'
    | 'reduced-motion'
    | 'missing-source'
    | 'missing-target'
    | 'unsupported-target'
    | 'layout-timeout'
    | 'geometry-changed'
}
export interface MotionSharedPlayback {
  readonly finished: Promise<MotionSharedResult>
  cancel(): void
  stop(): void
}
export interface MotionSharedOptions {
  transition?: MotionOptions
  layoutTimeout?: number
}
export interface MotionSharedLayout extends MotionBinding {
  readonly active: boolean
  /** Explicit identity; follows replacement of this declared surface. */
  attach(surface: MotionSurface, identity: string): () => void
  /** Host mutation is synchronous; Jolt waits for renderer layout. */
  transition(change: () => void, options?: MotionOptions): MotionSharedPlayback
  cancel(): void
}
export interface MotionDiagnosticsOptions {
  development: true
  identity: string
  maxEvents?: number
}
export interface MotionDiagnosticSnapshot {
  identity: string
  execution: 'jolt-web' | 'lifecycle-only'
  disposed: boolean
  resources: Record<string, number | boolean>
  targets: {
    id: number
    execution: string
    channels: {
      property: string
      layer?: string
      kind: 'animation' | 'value' | 'rest'
      owner?: number
      paused?: boolean
    }[]
  }[]
  events: {
    sequence: number
    time: number
    reason: string
    owner?: number
    target?: number
    scope?: number
    property?: string
    layer?: string
  }[]
}
export interface MotionDiagnostics extends MotionBinding {
  snapshot(): MotionDiagnosticSnapshot
  clear(): void
}
type Available = {
  readonly available: boolean
  onAvailable(setup: () => void | (() => void)): () => void
}
export interface MotionRegion extends Available {
  scrollHeader(source: MotionScrollSource, options: MotionHeaderOptions): MotionHeader
  reorder(options: MotionReorderOptions): MotionReorder
  sequence(steps: readonly MotionStep[]): MotionPlayback
  timeline(steps: readonly MotionTimelineStep[]): MotionTimeline
  states<const S extends MotionStateDefinitions>(
    targets: Record<string, MotionSurface>,
    definitions: S,
    options?: { transition?: MotionStateTransition },
  ): MotionStates<Extract<keyof S, string>>
  viewportEnter(surfaces: readonly MotionSurface[], options?: MotionViewportOptions): MotionViewport
  sharedLayout(options?: MotionSharedOptions): MotionSharedLayout
  diagnostics(options: MotionDiagnosticsOptions): MotionDiagnostics
}
export interface MotionRegionAdapter {
  scrollHeader?(
    source: MotionScrollAdapter,
    options: MotionHeaderOptions<MotionSurfaceAdapter>,
  ): Omit<MotionHeader, 'disposed'>
  reorder?(
    options: MotionReorderOptions<MotionSurfaceAdapter, MotionScrollAdapter>,
  ): Omit<MotionReorder, 'disposed'>
  readonly kind: 'web' | 'native'
  sequence?(steps: readonly MotionStep<MotionSurfaceAdapter>[]): MotionPlayback
  timeline?(steps: readonly MotionTimelineStep<MotionSurfaceAdapter>[]): MotionPlayback
  states?(
    targets: Record<string, MotionSurfaceAdapter | null>,
    definitions: MotionStateDefinitions,
    options?: { transition?: MotionStateTransition },
  ): MotionStatesAdapter
  viewportEnter(
    surfaces: readonly MotionSurfaceAdapter[],
    options: Omit<MotionViewportOptions, 'root'> & {
      root?: MotionScrollAdapter
    },
  ): Omit<MotionViewport, 'disposed'>
  sharedLayout(options: MotionSharedOptions): Omit<MotionSharedLayout, 'disposed' | 'attach'> & {
    attach(surface: MotionSurfaceAdapter, identity: string): () => void
  }
  diagnostics?(options: MotionDiagnosticsOptions): Omit<MotionDiagnostics, 'disposed'>
}
type Resource = { dispose(): void }
type RegionState = {
  adapter: MotionRegionAdapter
  resources: Set<Resource>
  cleanup: Set<() => void>
  valid: boolean
}
const regions = new WeakMap<MotionRegion, { state?: RegionState; setups: Set<() => () => void> }>()
export function regionState(region: MotionRegion): RegionState {
  const state = regions.get(region)?.state
  if (!state?.valid) throw new Error('Motion region is unavailable. Mount its MBox first.')
  return state
}

/** Subscribe to a fixed set of explicit, potentially replacing surfaces. */
export function whenMotionAvailable(
  sources: readonly Available[],
  setup: () => void | (() => void),
) {
  let cleanup: void | (() => void),
    active = false
  const clear = () => {
    const previous = cleanup
    cleanup = undefined
    active = false
    previous?.()
  }
  const start = () => {
    if (!active && sources.every((source) => source.available)) {
      active = true
      try {
        cleanup = setup()
      } catch (error) {
        active = false
        throw error
      }
    }
    return clear
  }
  const subscriptions: (() => void)[] = []
  try {
    for (const source of new Set(sources)) subscriptions.push(source.onAvailable(start))
  } catch (error) {
    for (const stop of subscriptions) stop()
    clear()
    throw error
  }
  return () => {
    for (const stop of subscriptions) stop()
    clear()
  }
}

function owned<T extends Resource>(state: RegionState, raw: T): T & MotionBinding {
  let disposed = false
  const handle = new Proxy(raw, {
    get(target, key) {
      if (key === 'disposed') return disposed || !state.valid
      if (key === 'dispose')
        return () => {
          if (disposed) return
          disposed = true
          state.resources.delete(handle)
          raw.dispose()
        }
      // Diagnostics retain a final, detached snapshot after teardown.
      if (key !== 'snapshot' && (disposed || !state.valid))
        throw new Error('Motion region resource is disposed.')
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  }) as T & MotionBinding
  state.resources.add(handle)
  return handle
}

function diagnosticsHandle(
  state: RegionState,
  options: MotionDiagnosticsOptions,
): MotionDiagnostics {
  let owner: RegionState | undefined = state
  let raw = state.adapter.diagnostics?.(options)
  let final: MotionDiagnosticSnapshot | undefined
  const read = (): MotionDiagnosticSnapshot =>
    raw?.snapshot() ?? {
      identity: options.identity,
      execution: 'lifecycle-only',
      disposed: !owner,
      resources: { regionResources: owner?.resources.size ?? 0 },
      targets: [],
      events: [],
    }
  const handle: MotionDiagnostics = {
    get disposed() {
      return !owner
    },
    snapshot: () => {
      const snapshot = final ?? read()
      return {
        ...snapshot,
        resources: { ...snapshot.resources },
        targets: snapshot.targets.map((target) => ({
          ...target,
          channels: target.channels.map((channel) => ({ ...channel })),
        })),
        events: snapshot.events.map((event) => ({ ...event })),
      }
    },
    clear() {
      raw?.clear()
      if (final) final.events = []
    },
    dispose() {
      if (!owner) return
      owner.resources.delete(handle)
      owner = undefined
      try {
        raw?.dispose()
        final = { ...read(), disposed: true }
      } finally {
        raw = undefined
      }
    },
  }
  state.resources.add(handle)
  return handle
}

/** Translate targets and factories only; all timing belongs to Jolt. */
function group(
  region: MotionRegion,
  steps: readonly (MotionStep | MotionTimelineStep)[],
  controlled: boolean,
) {
  const state = regionState(region)
  const surfaces = new Set<MotionSurface>()
  const factory = (run: () => MotionPlayback) => () => {
    if (!state.valid) throw new Error('This motion region is disposed.')
    return motionPlaybackAdapter(run())
  }
  const mapped = steps.map((step) => {
    if (typeof step === 'function') return factory(step)
    if ('run' in step) return { ...step, run: factory(step.run) }
    const [surface, frames, options] = step
    surfaces.add(surface)
    return [motionSurfaceAdapter(surface), frames, options] as const
  })
  const create = controlled ? state.adapter.timeline : state.adapter.sequence
  if (!create) throw new Error('Motion orchestration is unavailable.')
  const raw = controlled
    ? state.adapter.timeline!(mapped as readonly MotionTimelineStep<MotionSurfaceAdapter>[])
    : state.adapter.sequence!(mapped as readonly MotionStep<MotionSurfaceAdapter>[])
  const releases: (() => void)[] = []
  let ended = false
  const dispose = () => {
    if (ended) return
    ended = true
    raw.stop()
    for (const release of releases) release()
    state.resources.delete(resource)
  }
  const resource = { dispose }
  state.resources.add(resource)
  try {
    for (const surface of surfaces)
      releases.push(
        surface.onAvailable(() => () => {
          if (!ended) raw.stop()
        }),
      )
  } catch (error) {
    dispose()
    throw error
  }
  const forget = () => {
    ended = true
    for (const release of releases) release()
    state.resources.delete(resource)
  }
  void raw.finished.then(forget, forget)
  const playback = controlledMotionPlayback(raw, () => state.valid)
  return controlled
    ? playback
    : {
        finished: raw.finished,
        stop: () => {
          if (state.valid) raw.stop()
        },
      }
}

export function createMotionRegion(): MotionRegion {
  const entry: { state?: RegionState; setups: Set<() => () => void> } = { setups: new Set() }
  const region: MotionRegion = {
    get available() {
      return Boolean(entry.state?.valid)
    },
    onAvailable(setup) {
      let cleanup: (() => void) | undefined
      const invoke = () => {
        const state = regionState(region)
        const before = new Set(state.resources)
        let release: void | (() => void)
        try {
          release = setup()
        } catch (error) {
          for (const resource of [...state.resources].reverse())
            if (!before.has(resource)) resource.dispose()
          throw error
        }
        const resources = [...state.resources].filter((value) => !before.has(value))
        let ended = false
        cleanup = () => {
          if (ended) return
          ended = true
          state.cleanup.delete(cleanup!)
          const errors: unknown[] = []
          for (const dispose of [
            () => release?.(),
            ...resources.reverse().map((resource) => () => resource.dispose()),
          ]) {
            try {
              dispose()
            } catch (error) {
              errors.push(error)
            }
          }
          if (errors.length) throw new AggregateError(errors, 'Motion region setup cleanup failed.')
        }
        return cleanup
      }
      entry.setups.add(invoke)
      try {
        if (entry.state?.valid) entry.state.cleanup.add(invoke())
      } catch (error) {
        entry.setups.delete(invoke)
        throw error
      }
      return () => {
        entry.setups.delete(invoke)
        cleanup?.()
      }
    },
    sequence: (steps) => group(region, steps, false),
    scrollHeader(source, options) {
      const state = regionState(region)
      if (!state.adapter.scrollHeader) throw new Error('Scroll headers are unavailable.')
      const { header, artwork, title, toolbar, toolbarTitle, section, items, ...rest } = options
      const raw = state.adapter.scrollHeader(motionScrollAdapter(source), {
        ...rest,
        header: motionSurfaceAdapter(header),
        artwork: motionSurfaceAdapter(artwork),
        title: motionSurfaceAdapter(title),
        toolbar: motionSurfaceAdapter(toolbar),
        toolbarTitle: motionSurfaceAdapter(toolbarTitle),
        section: motionSurfaceAdapter(section),
        items: () => mapMotionItems(items(), motionSurfaceAdapter),
      })
      let off: (() => void) | undefined
      const control = owned(state, {
        ...raw,
        get ready() {
          return raw.ready
        },
        get state() {
          return raw.state
        },
        dispose() {
          off?.()
          raw.dispose()
        },
      })
      off = whenMotionAvailable(
        [source, header, artwork, title, toolbar, toolbarTitle, section],
        () => () => control.dispose(),
      )
      return control
    },
    reorder(options) {
      const state = regionState(region)
      if (!state.adapter.reorder) throw new Error('Interactive reorder is unavailable.')
      const raw = state.adapter.reorder({
        ...options,
        scroll: motionScrollAdapter(options.scroll),
        container: motionSurfaceAdapter(options.container),
        items: () => mapMotionItems(options.items(), motionSurfaceAdapter),
      })
      let off: (() => void) | undefined
      const control = owned(state, {
        ...raw,
        get activeKey() {
          return raw.activeKey
        },
        dispose() {
          off?.()
          raw.dispose()
        },
      })
      off = whenMotionAvailable([options.scroll, options.container], () => () => control.dispose())
      return control
    },
    timeline: (steps) => group(region, steps, true) as MotionTimeline,
    states(targets, definitions, options) {
      const state = regionState(region)
      if (!state.adapter.states) throw new Error('Named motion states are unavailable.')
      const entries = Object.entries(targets)
      if (
        !entries.length ||
        entries.length > 64 ||
        new Set(entries.map(([, surface]) => surface)).size !== entries.length
      )
        throw new TypeError('Use 1–64 distinct named surfaces.')
      const raw = state.adapter.states(
        Object.fromEntries(
          entries.map(([name, surface]) => [
            name,
            surface.available ? motionSurfaceAdapter(surface) : null,
          ]),
        ),
        definitions,
        options,
      )
      const releases: (() => void)[] = []
      let disposed = false
      try {
        for (const [name, surface] of entries)
          releases.push(
            surface.onAvailable(() => {
              if (disposed) return
              raw.attach(name, motionSurfaceAdapter(surface))
              return () => {
                if (!disposed) raw.attach(name, null)
              }
            }),
          )
      } catch (error) {
        disposed = true
        for (const release of releases) release()
        raw.dispose()
        throw error
      }
      return owned(state, {
        get current() {
          return raw.current
        },
        get settled() {
          return raw.settled
        },
        get paused() {
          return raw.paused
        },
        to: (name: string, transition?: MotionStateTransition) => raw.to(name, transition),
        pause: () => raw.pause(),
        resume: () => raw.play(),
        stop: () => raw.stop(),
        dispose() {
          disposed = true
          for (const release of releases) release()
          raw.dispose()
        },
      }) as MotionStates<Extract<keyof typeof definitions, string>>
    },
    viewportEnter(surfaces, options = {}) {
      const state = regionState(region)
      if (!surfaces.length || surfaces.length > 64 || new Set(surfaces).size !== surfaces.length)
        throw new RangeError('Use 1–64 distinct viewport surfaces in their entrance order.')
      for (const [key, value] of Object.entries({
        margin: options.margin,
        stagger: options.stagger,
      }))
        if (
          value !== undefined &&
          (!Number.isFinite(value) || Math.abs(value) > 10000 || (key === 'stagger' && value < 0))
        )
          throw new RangeError('Viewport margin/stagger must be finite and bounded by 10000.')
      if (
        options.threshold !== undefined &&
        (!Number.isFinite(options.threshold) || options.threshold < 0 || options.threshold > 1)
      )
        throw new RangeError('Viewport threshold must be between zero and one.')
      return owned(
        state,
        state.adapter.viewportEnter(surfaces.map(motionSurfaceAdapter), {
          ...options,
          root: options.root && motionScrollAdapter(options.root),
        }),
      )
    },
    sharedLayout(options = {}) {
      const state = regionState(region)
      const raw = state.adapter.sharedLayout(options)
      const attachments = new Set<() => void>()
      const identities = new Map<string, MotionSurface>()
      return owned<Omit<MotionSharedLayout, 'disposed'>>(state, {
        get active() {
          return raw.active
        },
        attach(surface, identity) {
          if (
            !identity.trim() ||
            identity.length > 100 ||
            identities.has(identity) ||
            [...identities.values()].includes(surface)
          )
            throw new TypeError(
              'Use a unique nonempty identity and surface (up to 100 characters).',
            )
          identities.set(identity, surface)
          let stop: () => void
          try {
            stop = surface.onAvailable(() => raw.attach(motionSurfaceAdapter(surface), identity))
          } catch (error) {
            identities.delete(identity)
            throw error
          }
          const detach = () => {
            attachments.delete(detach)
            identities.delete(identity)
            stop()
          }
          attachments.add(detach)
          return detach
        },
        transition: (change, options) => raw.transition(change, options),
        cancel: () => raw.cancel(),
        dispose() {
          for (const detach of [...attachments]) detach()
          raw.dispose()
        },
      })
    },
    diagnostics(options) {
      const state = regionState(region)
      if (
        options?.development !== true ||
        !options.identity?.trim() ||
        options.identity.length > 100
      )
        throw new TypeError('Diagnostics need development: true and a short region identity.')
      const max = options.maxEvents ?? 200
      if (!Number.isInteger(max) || max < 1 || max > 2000)
        throw new RangeError('Use 1–2000 diagnostic events.')
      return diagnosticsHandle(state, options)
    },
  }
  regions.set(region, entry)
  return region
}

export function bindMotionRegion(region: MotionRegion, adapter: MotionRegionAdapter): () => void {
  const entry = regions.get(region)
  if (!entry) throw new TypeError('Use createMotionRegion().')
  const clear = (state: RegionState) => {
    if (!state.valid) return
    state.valid = false
    if (entry.state === state) entry.state = undefined
    const errors: unknown[] = []
    for (const release of [
      ...state.cleanup,
      ...[...state.resources].reverse().map((resource) => () => resource.dispose()),
    ])
      try {
        release()
      } catch (error) {
        errors.push(error)
      }
    state.cleanup.clear()
    state.resources.clear()
    if (errors.length) throw new AggregateError(errors, 'Motion region cleanup failed.')
  }
  if (entry.state) clear(entry.state)
  const state: RegionState = { adapter, valid: true, resources: new Set(), cleanup: new Set() }
  entry.state = state
  try {
    for (const setup of [...entry.setups]) state.cleanup.add(setup())
  } catch (error) {
    clear(state)
    throw error
  }
  return () => clear(state)
}

export function validatePointer(options: MotionPointerOptions) {
  if (options.axis !== undefined && !['x', 'y', 'both'].includes(options.axis))
    throw new TypeError('Unknown pointer axis.')
  if (options.coordinates !== undefined && !['normalized', 'pixels'].includes(options.coordinates))
    throw new TypeError('Unknown pointer coordinates.')
  if (options.disabled !== undefined && typeof options.disabled !== 'boolean')
    throw new TypeError('disabled must be boolean.')
  for (const axis of ['x', 'y'] as const) {
    const rest = options.rest?.[axis] ?? 0,
      range = options.range?.[axis]
    if (
      !Number.isFinite(rest) ||
      (range &&
        (range.length !== 2 ||
          !range.every(Number.isFinite) ||
          range[0] >= range[1] ||
          rest < range[0] ||
          rest > range[1]))
    )
      throw new RangeError('Pointer bounds must increase and contain the resting value.')
  }
}
