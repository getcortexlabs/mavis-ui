import type { InputHandle } from './input.js'

export interface FormError {
  field: string
  message: string
}
export interface FormField {
  name: string
  label: string
  target: () => InputHandle | undefined | null
  enabled?: () => boolean
  /** Open the containing section before resolving its mounted input handle. */
  reveal?: () => void | Promise<void>
}
export interface FormValidationContext {
  readonly current: boolean
  onCancel(dispose: () => void): void
}
export interface FormState {
  readonly errors: readonly FormError[]
  readonly validating: boolean
}
export interface FormController {
  readonly state: FormState
  readonly disposed: boolean
  register(field: FormField): () => void
  label(field: string): string | undefined
  has(field: string): boolean
  setErrors(errors: readonly FormError[]): void
  subscribe(listener: (state: FormState) => void): () => void
  focusError(field: string): Promise<boolean>
  focusFirstError(): Promise<boolean>
  /** Invalidate pending validation when the host draft changes. */
  invalidate(): void
  validate(
    task: (context: FormValidationContext) => Promise<readonly FormError[]>,
  ): Promise<'valid' | 'invalid' | 'cancelled' | 'busy'>
  dispose(): void
}

function errorsCopy(errors: readonly FormError[]) {
  return Object.freeze(
    errors.map((error) => {
      if (!error || !error.field?.trim() || !error.message?.trim())
        throw new TypeError('Form errors require a field name and a non-empty message.')
      return Object.freeze({ field: error.field, message: error.message })
    }),
  )
}

/** Coordinates public focus handles and validation results; never owns the field values. */
export function createFormController(initial: readonly FormError[] = []): FormController {
  const fields = new Map<string, FormField>()
  const listeners = new Set<(state: FormState) => void>()
  let state: FormState = Object.freeze({ errors: errorsCopy(initial), validating: false })
  let disposed = false
  let generation = 0
  let focusGeneration = 0
  let cancellations = new Set<() => void>()
  const publish = (next = state) => {
    state = Object.freeze(next)
    for (const listener of [...listeners]) listener(state)
  }
  const invalidate = () => {
    generation++
    focusGeneration++
    const release = cancellations
    cancellations = new Set()
    const failures: unknown[] = []
    for (const cancel of release) {
      try {
        cancel()
      } catch (error) {
        failures.push(error)
      }
    }
    if (state.validating) publish({ ...state, validating: false })
    if (failures.length) throw new AggregateError(failures, 'Form validation cancellation failed.')
  }
  const focus = async (name: string, request: number) => {
    const field = fields.get(name)
    if (disposed || !field || field.enabled?.() === false) return false
    await field.reveal?.()
    if (
      disposed ||
      request !== focusGeneration ||
      fields.get(name) !== field ||
      field.enabled?.() === false
    )
      return false
    const target = field.target()
    if (!target) return false
    target.focus()
    return true
  }
  const controller: FormController = {
    get state() {
      return state
    },
    get disposed() {
      return disposed
    },
    register(field) {
      if (disposed) throw new Error('Form controller is disposed.')
      if (!field.name?.trim() || !field.label?.trim() || typeof field.target !== 'function')
        throw new TypeError('Form fields require a name, label and public handle getter.')
      if (fields.has(field.name)) throw new RangeError(`Duplicate form field: ${field.name}`)
      fields.set(field.name, field)
      publish()
      return () => {
        if (fields.get(field.name) !== field) return
        fields.delete(field.name)
        publish()
      }
    },
    label(name) {
      return fields.get(name)?.label
    },
    has(name) {
      return fields.has(name)
    },
    setErrors(errors) {
      if (disposed) return
      const next = errorsCopy(errors)
      invalidate()
      publish({ errors: next, validating: false })
    },
    subscribe(listener) {
      if (disposed) return () => {}
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    focusError(name) {
      return focus(name, ++focusGeneration)
    },
    async focusFirstError() {
      const request = ++focusGeneration
      for (const error of state.errors) {
        if (request !== focusGeneration || disposed) return false
        if (await focus(error.field, request)) return true
      }
      return false
    },
    invalidate,
    async validate(task) {
      if (disposed) return 'cancelled'
      if (state.validating) return 'busy'
      const request = ++generation
      const release = new Set<() => void>()
      cancellations = release
      const current = () => !disposed && generation === request
      publish({ ...state, validating: true })
      try {
        const result = await task({
          get current() {
            return current()
          },
          onCancel(cancel) {
            if (current()) release.add(cancel)
            else cancel()
          },
        })
        if (!current()) return 'cancelled'
        const errors = errorsCopy(result)
        focusGeneration++
        publish({ errors, validating: false })
        return state.errors.length ? 'invalid' : 'valid'
      } catch (error) {
        if (!current()) return 'cancelled'
        throw error
      } finally {
        release.clear()
        if (current() && state.validating) publish({ ...state, validating: false })
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      try {
        invalidate()
      } finally {
        fields.clear()
        listeners.clear()
      }
    },
  }
  return controller
}
