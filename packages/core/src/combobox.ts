import { choiceKey, validateChoices, type ChoiceOption, type ChoiceValue } from './choice.js'

/** The application owns networking, authentication and cancellation primitives. */
export interface ComboboxSearchContext {
  readonly requestId: number
  readonly limit: number
  /** Register fetch.abort(), a timer cleanup, or another host cancellation callback. */
  onCancel(cleanup: () => void): void
}
export type ComboboxSearch = (
  query: string,
  context: ComboboxSearchContext,
) => Promise<readonly ChoiceOption[]>
export interface ComboboxSnapshot {
  query: string
  options: readonly ChoiceOption[]
}
export type ComboboxSearchStatus = 'idle' | 'debouncing' | 'loading' | 'success' | 'empty' | 'error'
export interface ComboboxSearchState {
  readonly query: string
  readonly status: ComboboxSearchStatus
  readonly options: readonly ChoiceOption[]
  readonly limited: boolean
}
export interface ComboboxSearchOptions {
  search: ComboboxSearch
  debounce?: number
  minQueryLength?: number
  maxResults?: number
  initialResults?: ComboboxSnapshot
  onChange?: (state: ComboboxSearchState) => void
}

export function validateComboboxPolicy(
  debounce: number,
  minQueryLength: number,
  maxResults: number,
) {
  if (!Number.isInteger(debounce) || debounce < 0 || debounce > 60000)
    throw new RangeError('Combobox debounce must be an integer from 0 to 60000 milliseconds.')
  if (!Number.isInteger(minQueryLength) || minQueryLength < 0 || minQueryLength > 1000)
    throw new RangeError('Combobox minQueryLength must be an integer from 0 to 1000.')
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 100)
    throw new RangeError('Combobox maxResults must be an integer from 1 to 100.')
}

/** A single bounded result page. No request starts at construction, including during SSR. */
export function createComboboxSearch(config: ComboboxSearchOptions) {
  const debounce = config.debounce ?? 200
  const minQueryLength = config.minQueryLength ?? 1
  const maxResults = config.maxResults ?? 50
  validateComboboxPolicy(debounce, minQueryLength, maxResults)
  let generation = 0
  let disposed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let cleanups: (() => void)[] = []
  let cached: ComboboxSearchState | undefined
  function result(query: string, options: readonly ChoiceOption[]): ComboboxSearchState {
    if (!Array.isArray(options)) throw new TypeError('Combobox search must return an array.')
    validateChoices(options, null)
    return Object.freeze({
      query,
      status: options.length ? 'success' : 'empty',
      options: Object.freeze(
        options.slice(0, maxResults).map((option) => Object.freeze({ ...option })),
      ),
      limited: options.length > maxResults,
    })
  }
  let state: ComboboxSearchState = Object.freeze({
    query: '',
    status: 'idle',
    options: [],
    limited: false,
  })
  if (config.initialResults)
    state = cached = result(config.initialResults.query, config.initialResults.options)
  function publish(next: ComboboxSearchState) {
    state = Object.freeze(next)
    config.onChange?.(state)
  }
  function invalidate() {
    generation++
    clearTimeout(timer)
    timer = undefined
    const previous = cleanups
    cleanups = []
    // One host cleanup cannot prevent the remaining requests/resources from being cancelled.
    for (const cleanup of previous) {
      try {
        cleanup()
      } catch {
        /* Host cancellation failures never revive a request. */
      }
    }
  }
  function cancel() {
    invalidate()
    if (!disposed && (state.status === 'loading' || state.status === 'debouncing'))
      publish({ query: state.query, status: 'idle', options: [], limited: false })
  }
  function request(query: string, force = false) {
    if (disposed) return
    invalidate()
    if (!force && cached?.query === query) {
      publish(cached)
      return
    }
    if (query.trim().length < minQueryLength) {
      publish({ query, status: 'idle', options: [], limited: false })
      return
    }
    const identity = generation
    publish({
      query,
      status: debounce && !force ? 'debouncing' : 'loading',
      options: [],
      limited: false,
    })
    const run = async () => {
      timer = undefined
      if (disposed || identity !== generation) return
      publish({ query, status: 'loading', options: [], limited: false })
      try {
        const options = await config.search(query, {
          requestId: identity,
          limit: maxResults,
          onCancel(cleanup) {
            if (disposed || identity !== generation) cleanup()
            else cleanups.push(cleanup)
          },
        })
        if (disposed || identity !== generation) return
        const next = result(query, options)
        cleanups = []
        cached = next
        publish(next)
      } catch {
        if (disposed || identity !== generation) return
        cleanups = []
        publish({ query, status: 'error', options: [], limited: false })
      }
    }
    if (debounce && !force) timer = setTimeout(() => void run(), debounce)
    else void run()
  }
  return {
    get state() {
      return state
    },
    request,
    retry: () => request(state.query, true),
    cancel,
    dispose() {
      if (disposed) return
      disposed = true
      invalidate()
      cached = undefined
    },
  }
}

/** Highlight identity survives a page replacement only while its enabled option remains. */
export function comboboxHighlight(
  options: readonly ChoiceOption[],
  previous?: string,
): string | undefined {
  return options.some((option) => !option.disabled && choiceKey(option.value) === previous)
    ? previous
    : undefined
}
export function comboboxMove(
  options: readonly ChoiceOption[],
  previous: string | undefined,
  direction: 1 | -1,
) {
  const available = options.filter((option) => !option.disabled)
  if (!available.length) return undefined
  const index = available.findIndex((option) => choiceKey(option.value) === previous)
  const next =
    index < 0
      ? direction === 1
        ? 0
        : available.length - 1
      : Math.max(0, Math.min(available.length - 1, index + direction))
  return choiceKey(available[next]!.value)
}
export function comboboxSelected(
  value: ChoiceValue | null,
  options: readonly ChoiceOption[],
  retained?: ChoiceOption | null,
): ChoiceOption | undefined {
  if (value === null) return undefined
  return (
    options.find((option) => option.value === value) ??
    (retained?.value === value ? retained : undefined)
  )
}
