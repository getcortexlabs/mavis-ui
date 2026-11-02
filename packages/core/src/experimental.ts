/** Experimental, single-surface motion contract. No platform objects cross this boundary. */
export type MotionValues = Partial<
  Record<'scale' | 'scaleX' | 'scaleY' | 'x' | 'y' | 'rotate' | 'opacity', number>
>
export type MotionFrames = { [K in keyof MotionValues]?: number | readonly (number | null)[] }
export interface MotionOptions {
  type?: 'spring' | 'tween'
  duration?: number
  bounce?: number
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}
export interface MotionPlayback {
  readonly finished: Promise<boolean>
  stop(): void
}
export interface MotionSurface {
  readonly available: boolean
  animate(values: MotionFrames, options?: MotionOptions): MotionPlayback
  set(values: MotionValues): MotionPlayback
  /** Runs once per mount/load. Its resources belong to that presentation. */
  onAvailable(setup: () => void | (() => void)): () => void
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
export interface MotionReadable extends MotionBinding {
  get(): number
  to(
    input: readonly number[],
    output: readonly number[],
    options?: { clamp?: boolean },
  ): MotionReadable
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
export type MotionBindings = Partial<Record<keyof MotionValues, MotionReadable>>
export interface MotionDragOptions {
  axis: 'x' | 'y'
  bounds?: { left?: number; right?: number; top?: number; bottom?: number }
  snap: { x?: readonly number[]; y?: readonly number[] }
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
  animate(values: MotionFrames, options?: MotionOptions): MotionPlayback
  set(values: MotionValues): MotionPlayback
  motionValue?(initial: number): MotionValueAdapter
  springValue?(source: MotionValueAdapter, options?: MotionSpringOptions): MotionSpringAdapter
  bind?(values: Partial<Record<keyof MotionValues, Pick<MotionReadable, 'get' | 'dispose'>>>): {
    dispose(): void
  }
  drag?(options: MotionDragOptions): MotionDragAdapter
  refresh?(): void
  scrollLinked?(
    source: MotionScrollAdapter,
    frames: MotionScrollFrames,
    options: MotionScrollOptions,
  ): Omit<MotionScrollLink, 'disposed'>
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
  valid: boolean
}
const bindings = new WeakMap<MotionSurface, Binding | undefined>()
const setups = new WeakMap<MotionSurface, Set<() => void | (() => void)>>()
type ValueState = {
  binding: Binding
  raw: Pick<MotionReadable, 'get' | 'dispose'>
  input: boolean
  depth: number
  dependents: Set<Resource>
}
const values = new WeakMap<MotionReadable, ValueState>()
const dependencies = new WeakMap<Resource, Set<Set<Resource>>>()
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
          for (const dependent of state?.dependents ?? []) dependent.dispose()
          state?.dependents.clear()
          target.dispose()
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
    to(input: readonly number[], output: readonly number[], options?: { clamp?: boolean }) {
      if (!binding.adapter.map) throw new Error('Numeric mappings are unavailable.')
      const state = values.get(value)!
      if (state.depth >= 32)
        throw new RangeError('Motion mappings support at most 32 derived levels.')
      if (
        !Array.isArray(input) ||
        !Array.isArray(output) ||
        input.length < 2 ||
        input.length > 1024 ||
        input.length !== output.length ||
        ![...input, ...output].every(Number.isFinite)
      )
        throw new TypeError('A numeric map needs 2–1024 finite input/output pairs.')
      if (
        options &&
        (Object.keys(options).some((key) => key !== 'clamp') ||
          (options.clamp !== undefined && typeof options.clamp !== 'boolean'))
      )
        throw new TypeError('Mapping options support only a boolean clamp.')
      return ownValue(binding, binding.adapter.map(raw, input, output, options), false, state)
    },
  })
  // Preserve getters such as moving/paused; Object.assign would snapshot them.
  const descriptors = Object.getOwnPropertyDescriptors(raw)
  delete (descriptors as Record<string, PropertyDescriptor>).to
  Object.defineProperties(mapped, descriptors)
  const value = own(binding, mapped)
  values.set(value, {
    binding,
    raw,
    input,
    depth: parent ? parent.depth + 1 : 0,
    dependents: new Set(),
  })
  if (parent) depend(parent, value)
  return value
}

export function createMotionSurface(): MotionSurface {
  const current = () => {
    const binding = bindings.get(surface)
    if (!binding?.valid)
      throw new Error('Motion surface is unavailable. Wait for the component to mount/load.')
    return binding
  }
  const source = (value: MotionReadable, binding: Binding, input = false) => {
    const state = values.get(value)
    if (!state || state.binding !== binding || value.disposed || (input && !state.input))
      throw new TypeError('Use a live value from this surface and presentation.')
    return state
  }
  const run = (invoke: (adapter: MotionSurfaceAdapter) => MotionPlayback): MotionPlayback => {
    const binding = current()
    const playback = invoke(binding.adapter)
    binding.active.add(playback)
    void playback.finished.then(() => binding.active.delete(playback))
    return {
      finished: playback.finished,
      stop() {
        if (binding.valid) playback.stop()
      },
    }
  }
  const surface: MotionSurface = {
    get available() {
      return Boolean(bindings.get(surface)?.valid)
    },
    animate: (values, options) => run((adapter) => adapter.animate(values, options)),
    set: (values) => run((adapter) => adapter.set(values)),
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
          try {
            release?.()
          } finally {
            for (const resource of resources.reverse()) resource.dispose()
            for (const handle of playback) if (binding.active.has(handle)) handle.stop()
            cleanup = undefined
          }
        }
        return cleanup
      }
      setups.get(surface)!.add(invoke)
      if (surface.available) {
        try {
          own(current(), { dispose: invoke() })
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
): () => void {
  if (!bindings.has(surface)) throw new TypeError('Use createMotionSurface() to declare a surface.')
  const invalidate = (binding: Binding) => {
    binding.valid = false
    for (const playback of binding.active) playback.stop()
    binding.active.clear()
    for (const resource of [...binding.resources].reverse()) resource.dispose()
    binding.resources.clear()
  }
  const previous = bindings.get(surface)
  if (previous) invalidate(previous)
  const binding: Binding = { adapter, active: new Set(), resources: new Set(), valid: true }
  bindings.set(surface, binding)
  try {
    for (const setup of setups.get(surface)!) {
      const dispose = setup()
      if (dispose) own(binding, { dispose })
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
