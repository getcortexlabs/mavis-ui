import {
  controlledMotionPlayback,
  motionPlaybackAdapter,
  type MotionControlledPlayback,
  type MotionValueOptions,
  type MotionDecayOptions,
} from './experimental-playback.js'
export * from './experimental-playback.js'
/** Experimental, single-surface motion contract. No platform objects cross this boundary. */
import {
  regionState,
  validatePointer,
  type MotionRegion,
  type MotionRegionAdapter,
  type MotionPointerOptions,
  type MotionPointer,
  type MotionPointerAdapter,
} from './experimental-regions.js'
export * from './experimental-regions.js'
export type MotionValues = Partial<
  Record<'scale' | 'scaleX' | 'scaleY' | 'x' | 'y' | 'rotate' | 'opacity', number>
>
export type MotionFrames = { [K in keyof MotionValues]?: number | readonly (number | null)[] }
export interface MotionOptions {
  type?: 'spring' | 'tween'
  duration?: number
  bounce?: number
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  delay?: number
}
export interface MotionPlayback {
  readonly finished: Promise<boolean>
  stop(): void
}
export interface MotionSurface {
  readonly available: boolean
  animate(values: MotionFrames, options?: MotionOptions): MotionControlledPlayback
  set(values: MotionValues): MotionPlayback
  /** Runs once per mount/load. Its resources belong to that presentation. */
  onAvailable(setup: () => void | (() => void)): () => void
  /** A child owner, recreated on mount/load. Late work must use the supplied child. */
  use(setup: (motion: MotionSurface) => void | (() => void)): () => void
  pointerFollow(region: MotionRegion, options?: MotionPointerOptions): MotionPointer
  animateValue(
    value: MotionValue,
    frames: number | readonly (number | null)[],
    options?: MotionValueOptions,
  ): MotionControlledPlayback
  stopValue(value: MotionValue, options?: { layer?: string }): void
  playbackProgress(playback: MotionControlledPlayback): MotionReadable
  decay(
    velocity: { x?: number; y?: number },
    options?: MotionDecayOptions,
  ): MotionControlledPlayback
  motionValue(initial: number): MotionValue
  springValue(source: MotionValue, options?: MotionSpringOptions): MotionSpring
  bind(values: MotionBindings): MotionBinding
  drag(options: MotionDragOptions): MotionDrag
  /** Re-read a supported size/pivot change without replacing this presentation. */
  refresh(): void
  scrollLinked(
    source: MotionScrollSource,
    frames: MotionScrollFrames,
    options: MotionScrollOptions,
  ): MotionScrollLink
}
export interface MotionBinding {
  readonly disposed: boolean
  dispose(): void
}
export interface MotionColor extends MotionBinding {
  get(): string
}
export interface MotionReadable extends MotionBinding {
  get(): number
  to(
    input: readonly number[],
    output: readonly number[],
    options?: { clamp?: boolean },
  ): MotionReadable
  to(input: readonly number[], output: readonly string[]): MotionColor
}
export interface MotionValue extends MotionReadable {
  set(value: number): void
}
export interface MotionSpring extends MotionReadable {
  readonly moving: boolean
  readonly paused: boolean
  getVelocity(): number
  pause(): void
  resume(): void
}
export interface MotionSpringOptions {
  stiffness?: number
  damping?: number
  mass?: number
  initial?: number
  restDelta?: number
  restSpeed?: number
}
export type MotionBindings = Partial<
  Record<keyof MotionValues | 'borderRadius' | 'borderWidth', MotionReadable>
> &
  Partial<Record<'backgroundColor' | 'borderColor' | 'color', MotionColor>>
export interface MotionDragOptions {
  axis: 'x' | 'y'
  bounds?: { left?: number; right?: number; top?: number; bottom?: number }
  snap?: { x?: readonly number[]; y?: readonly number[] }
  friction?: number
  onRelease?: (event: { x: number; y: number; velocityX: number; velocityY: number }) => void
}
export interface MotionDrag extends MotionBinding {
  readonly dragging: boolean
  pause(): void
  resume(): void
  cancel(): void
}

/** Renderer contracts. Values never expose their DOM/native target. */
export type MotionValueAdapter = Pick<MotionValue, 'get' | 'set' | 'dispose'>
export type MotionSpringAdapter = Omit<MotionSpring, 'disposed' | 'to'>
export type MotionDragAdapter = Omit<MotionDrag, 'disposed'>
export interface MotionSurfaceAdapter {
  /** The renderer borrows its host runtime and owns only this child's resources. */
  use?(setup: (adapter: MotionSurfaceAdapter) => () => void): () => void
  pointerFollow?(region: MotionRegionAdapter, options: MotionPointerOptions): MotionPointerAdapter
  animate(values: MotionFrames, options?: MotionOptions): MotionPlayback
  set(values: MotionValues): MotionPlayback
  animateValue?(
    value: MotionValueAdapter,
    frames: number | readonly (number | null)[],
    options?: MotionValueOptions,
  ): MotionPlayback
  stopValue?(value: MotionValueAdapter, options?: { layer?: string }): void
  playbackProgress?(playback: MotionPlayback): Pick<MotionReadable, 'get' | 'dispose'>
  decay?(velocity: { x?: number; y?: number }, options?: MotionDecayOptions): MotionPlayback
  motionValue?(initial: number): MotionValueAdapter
  springValue?(source: MotionValueAdapter, options?: MotionSpringOptions): MotionSpringAdapter
  bind?(values: {
    [K in keyof MotionBindings]?: Pick<NonNullable<MotionBindings[K]>, 'get' | 'dispose'>
  }): {
    dispose(): void
  }
  drag?(options: MotionDragOptions): MotionDragAdapter
  refresh?(): void
  scrollLinked?(
    source: MotionScrollAdapter,
    frames: MotionScrollFrames,
    options: MotionScrollOptions,
  ): Omit<MotionScrollLink, 'disposed'>
  mapColor?(
    source: Pick<MotionReadable, 'get' | 'dispose'>,
    input: readonly number[],
    output: readonly string[],
  ): Pick<MotionColor, 'get' | 'dispose'>
  map?(
    source: Pick<MotionReadable, 'get' | 'dispose'>,
    input: readonly number[],
    output: readonly number[],
    options?: { clamp?: boolean },
  ): Pick<MotionReadable, 'get' | 'dispose'>
}

/** CSS pixels on Web, device-independent pixels on NativeScript. Vertical only. */
export type MotionScrollFrames = Partial<Record<keyof MotionValues, readonly number[]>>
export interface MotionScrollOptions {
  range: readonly [number, number]
  execution?: 'auto' | 'scheduler'
}
export interface MotionScrollLink extends MotionBinding {
  readonly execution: 'scroll-timeline' | 'scheduler' | 'native' | 'released'
  refresh(): void
}
export interface MotionScrollSource {
  readonly available: boolean
  onAvailable(setup: () => void | (() => void)): () => void
  /** Re-read deep overflow changes not reported by layout/font observers. */
  refresh(): void
}
/** Renderer identity only. The actual scrolling node stays in the renderer's WeakMap. */
export interface MotionScrollAdapter {
  readonly kind: 'web' | 'native'
}
type ScrollState = {
  adapter: MotionScrollAdapter
  links: Set<MotionScrollLink>
  cleanup: Set<() => void>
}
const scrollSources = new WeakMap<MotionScrollSource, ScrollState | undefined>()
const scrollSetups = new WeakMap<MotionScrollSource, Set<() => void | (() => void)>>()
export function motionScrollAdapter(source: MotionScrollSource): MotionScrollAdapter {
  const state = scrollSources.get(source)
  if (!state) throw new Error('Scroll source is unavailable.')
  return state.adapter
}

export function createMotionScrollSource(): MotionScrollSource {
  const source: MotionScrollSource = {
    get available() {
      return Boolean(scrollSources.get(source))
    },
    refresh() {
      const state = scrollSources.get(source)
      if (!state) throw new Error('Scroll source is unavailable. Mount a scrolling MScreen first.')
      for (const link of state.links) if (!link.disposed) link.refresh()
    },
    onAvailable(setup) {
      let cleanup: (() => void) | undefined
      const invoke = () => {
        const result = setup()
        let ended = false
        cleanup = () => {
          if (ended) return
          ended = true
          result?.()
        }
        return cleanup
      }
      scrollSetups.get(source)!.add(invoke)
      const state = scrollSources.get(source)
      if (state) {
        try {
          state.cleanup.add(invoke())
        } catch (error) {
          scrollSetups.get(source)!.delete(invoke)
          throw error
        }
      }
      return () => {
        scrollSetups.get(source)!.delete(invoke)
        cleanup?.()
      }
    },
  }
  scrollSources.set(source, undefined)
  scrollSetups.set(source, new Set())
  return source
}

export function bindMotionScrollSource(
  source: MotionScrollSource,
  adapter: MotionScrollAdapter,
): () => void {
  if (!scrollSources.has(source)) throw new TypeError('Use createMotionScrollSource().')
  const clear = (state: ScrollState) => {
    if (scrollSources.get(source) === state) scrollSources.set(source, undefined)
    for (const link of [...state.links]) link.dispose()
    for (const cleanup of state.cleanup) cleanup()
    state.links.clear()
    state.cleanup.clear()
  }
  const previous = scrollSources.get(source)
  if (previous) clear(previous)
  const state: ScrollState = { adapter, links: new Set(), cleanup: new Set() }
  scrollSources.set(source, state)
  try {
    for (const setup of scrollSetups.get(source)!) {
      const cleanup = setup()
      if (cleanup) state.cleanup.add(cleanup)
    }
  } catch (error) {
    clear(state)
    throw error
  }
  return () => clear(state)
}

function validateScroll(frames: MotionScrollFrames, options: MotionScrollOptions) {
  const range = options?.range
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    !range.every(Number.isFinite) ||
    range[0] < 0 ||
    range[1] <= range[0] ||
    range[1] > 1e9
  )
    throw new RangeError('Scroll range must increase between 0 and 1e9 pixels/DIPs.')
  if (options.execution !== undefined && !['auto', 'scheduler'].includes(options.execution))
    throw new TypeError('Unsupported scroll execution.')
  const entries = Object.entries(frames)
  if (
    !entries.length ||
    entries.some(
      ([key, output]) =>
        !['x', 'y', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity'].includes(key) ||
        !Array.isArray(output) ||
        output.length < 2 ||
        output.length > 1024 ||
        !output.every(Number.isFinite),
    )
  )
    throw new TypeError('Scroll frames need numeric transform/opacity ranges.')
}

type Resource = { dispose(): void }
type Binding = {
  adapter: MotionSurfaceAdapter
  active: Set<MotionPlayback>
  resources: Set<Resource>
  cleanup: Set<() => void>
  valid: boolean
  context: object
}
const bindings = new WeakMap<MotionSurface, Binding | undefined>()
/** Renderer bridge; the identity has no platform object in it. */
export function motionSurfaceAdapter(surface: MotionSurface): MotionSurfaceAdapter {
  const binding = bindings.get(surface)
  if (!binding?.valid) throw new Error('Motion surface is unavailable.')
  return binding.adapter
}
const setups = new WeakMap<MotionSurface, Set<() => void | (() => void)>>()
type ValueState = {
  binding: Binding
  raw: Pick<MotionReadable, 'get' | 'dispose'> | Pick<MotionColor, 'get' | 'dispose'>
  input: boolean
  depth: number
  dependents: Set<Resource>
}
const values = new WeakMap<MotionReadable | MotionColor, ValueState>()
const dependencies = new WeakMap<Resource, Set<Set<Resource>>>()
const playbackOwners = new WeakMap<MotionPlayback, Binding>()
function depend(parent: ValueState, resource: Resource) {
  parent.dependents.add(resource)
  let groups = dependencies.get(resource)
  if (!groups) dependencies.set(resource, (groups = new Set()))
  groups.add(parent.dependents)
}

function own<T extends Resource>(binding: Binding, raw: T): T & MotionBinding {
  let disposed = false
  const handle = new Proxy(raw, {
    get(target, key) {
      if (key === 'disposed') return disposed || !binding.valid
      if (key === 'dispose')
        return () => {
          if (disposed) return
          disposed = true
          binding.resources.delete(handle)
          for (const group of dependencies.get(handle) ?? []) group.delete(handle)
          dependencies.delete(handle)
          const state = values.get(handle as unknown as MotionReadable)
          const errors: unknown[] = []
          for (const dependent of state?.dependents ?? []) {
            try {
              dependent.dispose()
            } catch (error) {
              errors.push(error)
            }
          }
          state?.dependents.clear()
          try {
            target.dispose()
          } catch (error) {
            errors.push(error)
          }
          if (errors.length) throw new AggregateError(errors, 'Motion resource cleanup failed.')
        }
      if (disposed || !binding.valid) throw new Error('This motion resource is disposed.')
      const value = Reflect.get(target, key, target)
      return typeof value === 'function'
        ? (...args: unknown[]) => {
            if (disposed || !binding.valid) throw new Error('This motion resource is disposed.')
            return value.apply(target, args)
          }
        : value
    },
  }) as T & MotionBinding
  binding.resources.add(handle)
  return handle
}

function ownValue<T extends Pick<MotionReadable, 'get' | 'dispose'>>(
  binding: Binding,
  raw: T,
  input: boolean,
  parent?: ValueState,
): T & MotionReadable {
  const mapped = Object.assign({}, raw, {
    to(
      input: readonly number[],
      output: readonly (number | string)[],
      options?: { clamp?: boolean },
    ) {
      const state = values.get(value)!
      if (state.depth >= 32)
        throw new RangeError('Motion mappings support at most 32 derived levels.')
      if (
        !Array.isArray(input) ||
        !Array.isArray(output) ||
        input.length < 2 ||
        input.length > 1024 ||
        input.length !== output.length ||
        !input.every(Number.isFinite) ||
        !(
          output.every(Number.isFinite) ||
          output.every(
            (value) => typeof value === 'string' && /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value),
          )
        )
      )
        throw new TypeError(
          'A map needs 2–1024 finite input/output pairs of numbers or hex colors.',
        )
      if (
        options &&
        (Object.keys(options).some((key) => key !== 'clamp') ||
          (options.clamp !== undefined && typeof options.clamp !== 'boolean'))
      )
        throw new TypeError('Mapping options support only a boolean clamp.')
      if (typeof output[0] === 'string') {
        if (options) throw new TypeError('Color maps use clamped ranges without options.')
        if (!binding.adapter.mapColor) throw new Error('Color mappings are unavailable.')
        const rawColor = binding.adapter.mapColor(raw, input, output as readonly string[])
        const color = own(binding, rawColor)
        values.set(color, {
          binding,
          raw: rawColor,
          input: false,
          depth: state.depth + 1,
          dependents: new Set(),
        })
        depend(state, color)
        return color
      }
      if (!binding.adapter.map) throw new Error('Numeric mappings are unavailable.')
      return ownValue(
        binding,
        binding.adapter.map(raw, input, output as readonly number[], options),
        false,
        state,
      )
    },
  })
  // Preserve getters such as moving/paused; Object.assign would snapshot them.
  const descriptors = Object.getOwnPropertyDescriptors(raw)
  delete (descriptors as Record<string, PropertyDescriptor>).to
  Object.defineProperties(mapped, descriptors)
  const value = own(binding, mapped) as T & MotionReadable
  values.set(value, {
    binding,
    raw,
    input,
    depth: parent ? parent.depth + 1 : 0,
    dependents: new Set(),
  })
  if (parent) depend(parent, value)
  return value as T & MotionReadable
}

export function createMotionSurface(): MotionSurface {
  const current = () => {
    const binding = bindings.get(surface)
    if (!binding?.valid)
      throw new Error('Motion surface is unavailable. Wait for the component to mount/load.')
    return binding
  }
  const source = (value: MotionReadable | MotionColor, binding: Binding, input = false) => {
    const state = values.get(value)
    if (
      !state ||
      state.binding.context !== binding.context ||
      value.disposed ||
      (input && !state.input)
    )
      throw new TypeError('Use a live value from this surface and presentation.')
    return state
  }
  const run = (
    invoke: (adapter: MotionSurfaceAdapter) => MotionPlayback,
  ): MotionControlledPlayback => {
    const binding = current()
    const playback = invoke(binding.adapter)
    binding.active.add(playback)
    const forget = () => {
      binding.active.delete(playback)
    }
    void playback.finished.then(forget, forget)
    const handle = controlledMotionPlayback(playback, () => binding.valid)
    playbackOwners.set(handle, binding)
    return handle
  }
  const surface: MotionSurface = {
    get available() {
      return Boolean(bindings.get(surface)?.valid)
    },
    animate: (values, options) => run((adapter) => adapter.animate(values, options)),
    set: (values) => run((adapter) => adapter.set(values)),
    use(setup) {
      return surface.onAvailable(() => {
        const binding = current()
        const start = (adapter: MotionSurfaceAdapter) => {
          const child = createMotionSurface()
          const unbind = bindMotionSurface(child, adapter, binding.context)
          let cleanup: void | (() => void)
          try {
            cleanup = setup(child)
            if (cleanup !== undefined && typeof cleanup !== 'function')
              throw new TypeError('Motion setup must return a cleanup function, not a promise.')
          } catch (error) {
            unbind()
            throw error
          }
          return () => {
            try {
              cleanup?.()
            } finally {
              unbind()
            }
          }
        }
        return binding.adapter.use?.(start) ?? start(binding.adapter)
      })
    },
    pointerFollow(region, options = {}) {
      const binding = current()
      validatePointer(options)
      const state = regionState(region)
      if (!binding.adapter.pointerFollow) throw new Error('Pointer input is unavailable.')
      const raw = binding.adapter.pointerFollow(state.adapter, options)
      const x = ownValue(binding, raw.x, false)
      const y = ownValue(binding, raw.y, false)
      const control = own(binding, {
        x,
        y,
        execution: raw.execution,
        get active() {
          return raw.active
        },
        update: (state: { disabled: boolean }) => raw.update(state),
        refresh: () => raw.refresh(),
        dispose() {
          state.resources.delete(control)
          x.dispose()
          y.dispose()
          raw.dispose()
        },
      })
      state.resources.add(control)
      return control
    },
    onAvailable(setup) {
      let cleanup: (() => void) | undefined
      const invoke = () => {
        const binding = current()
        const before = new Set(binding.resources)
        const active = new Set(binding.active)
        let release: void | (() => void)
        try {
          release = setup()
        } catch (error) {
          for (const resource of [...binding.resources].reverse())
            if (!before.has(resource)) resource.dispose()
          for (const handle of binding.active) if (!active.has(handle)) handle.stop()
          throw error
        }
        const resources = [...binding.resources].filter((resource) => !before.has(resource))
        const playback = [...binding.active].filter((handle) => !active.has(handle))
        let disposed = false
        cleanup = () => {
          if (disposed) return
          disposed = true
          binding.cleanup.delete(cleanup!)
          const errors: unknown[] = []
          for (const dispose of [
            () => release?.(),
            ...resources.reverse().map((resource) => () => resource.dispose()),
            ...playback.map((handle) => () => {
              if (binding.active.has(handle)) handle.stop()
            }),
          ]) {
            try {
              dispose()
            } catch (error) {
              errors.push(error)
            }
          }
          cleanup = undefined
          if (errors.length) throw new AggregateError(errors, 'Motion setup cleanup failed.')
        }
        binding.cleanup.add(cleanup)
        return cleanup
      }
      setups.get(surface)!.add(invoke)
      if (surface.available) {
        try {
          invoke()
        } catch (error) {
          setups.get(surface)!.delete(invoke)
          throw error
        }
      }
      return () => {
        setups.get(surface)!.delete(invoke)
        cleanup?.()
        cleanup = undefined
      }
    },
    animateValue(value, frames, options) {
      const binding = current()
      const parent = source(value, binding, true)
      if (!binding.adapter.animateValue) throw new Error('Scalar playback is unavailable.')
      const handle = run((adapter) =>
        adapter.animateValue!(parent.raw as MotionValueAdapter, frames, options),
      )
      const dependent = { dispose: () => handle.stop() }
      depend(parent, dependent)
      const forget = () => {
        parent.dependents.delete(dependent)
        dependencies.delete(dependent)
      }
      void handle.finished.then(forget, forget)
      return handle
    },
    stopValue(value, options) {
      const binding = current()
      const parent = source(value, binding, true)
      if (!binding.adapter.stopValue) throw new Error('Scalar playback is unavailable.')
      binding.adapter.stopValue(parent.raw as MotionValueAdapter, options)
    },
    playbackProgress(playback) {
      const binding = current()
      const owner = playbackOwners.get(playback)
      if (!owner?.valid || owner.context !== binding.context)
        throw new TypeError('Use playback from this surface and presentation.')
      if (!binding.adapter.playbackProgress) throw new Error('Playback progress is unavailable.')
      return ownValue(
        binding,
        binding.adapter.playbackProgress(motionPlaybackAdapter(playback)),
        false,
      )
    },
    decay(velocity, options) {
      return run((adapter) => {
        if (!adapter.decay) throw new Error('Decay playback is unavailable.')
        return adapter.decay(velocity, options)
      })
    },
    motionValue(initial) {
      const binding = current()
      if (!binding.adapter.motionValue) throw new Error('Continuous motion is unavailable.')
      const raw = binding.adapter.motionValue(initial)
      return ownValue(binding, raw, true)
    },
    springValue(input, options) {
      const binding = current()
      const parent = source(input, binding, true)
      if (!binding.adapter.springValue) throw new Error('Continuous motion is unavailable.')
      const raw = binding.adapter.springValue(parent.raw as MotionValueAdapter, options)
      return ownValue(binding, raw, false, parent)
    },
    bind(input) {
      const binding = current()
      const entries = Object.entries(input).map(
        ([key, value]) => [key, source(value, binding)] as const,
      )
      if (!binding.adapter.bind) throw new Error('Continuous motion is unavailable.')
      const handle = own(
        binding,
        binding.adapter.bind(Object.fromEntries(entries.map(([key, state]) => [key, state.raw]))),
      )
      for (const [, state] of entries) depend(state, handle)
      return handle
    },
    scrollLinked(source, frames, options) {
      const binding = current()
      const state = scrollSources.get(source)
      if (!state) throw new Error('Scroll source is unavailable.')
      validateScroll(frames, options)
      if (!binding.adapter.scrollLinked) throw new Error('Scroll motion is unavailable.')
      const raw = binding.adapter.scrollLinked(state.adapter, frames, options)
      const link = own(binding, {
        get execution() {
          return raw.execution
        },
        refresh: () => raw.refresh(),
        dispose() {
          state.links.delete(link)
          raw.dispose()
        },
      })
      state.links.add(link)
      return link
    },
    refresh() {
      current().adapter.refresh?.()
    },
    drag(options) {
      const binding = current()
      if (!binding.adapter.drag) throw new Error('Drag input is unavailable.')
      return own(binding, binding.adapter.drag(options))
    },
  }
  bindings.set(surface, undefined)
  setups.set(surface, new Set())
  return surface
}

/** Renderer-only binding. Replacement invalidates old handles before exposing the new surface. */
export function bindMotionSurface(
  surface: MotionSurface,
  adapter: MotionSurfaceAdapter,
  context: object = {},
): () => void {
  if (!bindings.has(surface)) throw new TypeError('Use createMotionSurface() to declare a surface.')
  const invalidate = (binding: Binding) => {
    binding.valid = false
    const errors: unknown[] = []
    for (const cleanup of [...binding.cleanup].reverse()) {
      try {
        cleanup()
      } catch (error) {
        errors.push(error)
      }
    }
    binding.cleanup.clear()
    for (const playback of binding.active) {
      try {
        playback.stop()
      } catch (error) {
        errors.push(error)
      }
    }
    binding.active.clear()
    for (const resource of [...binding.resources].reverse()) {
      try {
        resource.dispose()
      } catch (error) {
        errors.push(error)
      }
    }
    binding.resources.clear()
    if (errors.length) throw new AggregateError(errors, 'Motion cleanup failed.')
  }
  const previous = bindings.get(surface)
  if (previous) invalidate(previous)
  const binding: Binding = {
    adapter,
    active: new Set(),
    resources: new Set(),
    cleanup: new Set(),
    valid: true,
    context,
  }
  bindings.set(surface, binding)
  try {
    // A setup can register a child while the surface is already available. That
    // child starts immediately; a live Set iteration would run it a second time.
    for (const setup of [...setups.get(surface)!]) {
      setup()
    }
  } catch (error) {
    invalidate(binding)
    throw error
  }
  return () => {
    if (!binding.valid) return
    invalidate(binding)
    if (bindings.get(surface) === binding) bindings.set(surface, undefined)
  }
}
