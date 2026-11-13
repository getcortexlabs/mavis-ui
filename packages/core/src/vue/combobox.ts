import {
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type ExtractPropTypes,
  type PropType,
} from '@vue/runtime-core'
import { dimensionProperty, flexContract, viewContract } from '../contracts.js'
import { vueProperty, vueProps } from './contracts.js'
import { useCachedActivity } from './cached-activity.js'
import {
  choiceKey,
  isChoiceValue,
  validateChoices,
  type ChoiceOption,
  type ChoiceValue,
} from '../choice.js'
import {
  comboboxHighlight,
  comboboxMove,
  comboboxSelected,
  createComboboxSearch,
  type ComboboxSearch,
  type ComboboxSnapshot,
} from '../combobox.js'

export const comboboxProps = {
  ...vueProps(viewContract),
  ...vueProps(flexContract),
  width: vueProperty(dimensionProperty),
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  query: { type: String, required: true as const },
  selectedOption: { type: Object as PropType<ChoiceOption | null>, default: null },
  search: { type: Function as PropType<ComboboxSearch>, required: true as const },
  initialResults: { type: Object as PropType<ComboboxSnapshot>, default: undefined },
  debounce: { type: Number, default: 200 },
  minQueryLength: { type: Number, default: 1 },
  maxResults: { type: Number, default: 50 },
  label: { type: String, required: true as const },
  placeholder: { type: String, default: 'Search options' },
  helperText: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: Boolean,
  clearable: { type: Boolean, default: true },
  clearLabel: { type: String, default: 'Clear selection' },
  closeLabel: { type: String, default: 'Close results' },
  loadingText: { type: String, default: 'Searching…' },
  emptyText: { type: String, default: 'No results' },
  searchErrorText: { type: String, default: 'Could not load results.' },
  retryLabel: { type: String, default: 'Try again' },
  idleText: { type: String, default: 'Type to search.' },
  limitedText: { type: String, default: 'Refine your search to see more results.' },
}
export const comboboxEmits = {
  'update:modelValue': (value: ChoiceValue | null) => value === null || isChoiceValue(value),
  'update:query': (value: string) => typeof value === 'string',
  select: (option: ChoiceOption | null) => option === null || isChoiceValue(option.value),
  focus: () => true,
  blur: () => true,
}
type Props = Readonly<ExtractPropTypes<typeof comboboxProps>>
type Emit = {
  (event: 'update:modelValue', value: ChoiceValue | null): void
  (event: 'update:query', value: string): void
  (event: 'select', value: ChoiceOption | null): void
}

/** @internal Shared request ownership and controlled selection for the two Vue renderers. */
export function useCombobox(props: Props, emit: Emit) {
  watch(
    () => props.label,
    (label) => {
      if (!label.trim()) throw new RangeError('Combobox needs a nonempty label.')
    },
    { immediate: true },
  )
  const open = ref(false)
  const revision = ref(0)
  const composing = ref(false)
  const active = ref<string>()
  const retained = shallowRef<ChoiceOption | null>(props.selectedOption)
  const pendingSelection = shallowRef<ChoiceOption>()
  const activity = useCachedActivity()
  const makeSearch = () =>
    createComboboxSearch({
      search: (query, context) => props.search(query, context),
      debounce: props.debounce,
      minQueryLength: props.minQueryLength,
      maxResults: props.maxResults,
      initialResults: props.initialResults,
      onChange(value) {
        state.value = value
        active.value = comboboxHighlight(value.options, active.value)
      },
    })
  let search = makeSearch()
  const state = shallowRef(search.state)
  const selected = computed(() =>
    comboboxSelected(
      props.modelValue,
      state.value.options,
      props.selectedOption?.value === props.modelValue
        ? props.selectedOption
        : pendingSelection.value?.value === props.modelValue
          ? pendingSelection.value
          : retained.value,
    ),
  )
  watch(
    selected,
    (option) => {
      if (option) retained.value = option
    },
    { immediate: true },
  )
  watch(
    () => [props.modelValue, props.selectedOption] as const,
    () => {
      validateChoices(props.selectedOption ? [props.selectedOption] : [], props.modelValue)
      if (props.modelValue === null) {
        retained.value = null
        pendingSelection.value = undefined
      }
    },
    { immediate: true, deep: true },
  )
  watch(
    () =>
      [props.query, props.search, props.debounce, props.minQueryLength, props.maxResults] as const,
    (current, previous) => {
      // A parent render can update the controlled query and an inline search
      // callback together. Reconfigure first, then start exactly one request.
      if (current.slice(1).some((value, index) => value !== previous[index + 1])) {
        search.dispose()
        search = makeSearch()
        state.value = search.state
      }
      if (open.value && !composing.value) search.request(props.query)
      else search.cancel()
    },
    { flush: 'post' },
  )
  watch(
    () => props.disabled || !activity.value,
    (blocked) => {
      if (blocked) close()
    },
  )
  onBeforeUnmount(() => search.dispose())
  function show() {
    if (props.disabled || !activity.value) return
    open.value = true
    if (!composing.value) search.request(props.query)
  }
  function close() {
    open.value = false
    active.value = undefined
    composing.value = false
    search.cancel()
  }
  function edit(query: string) {
    if (props.disabled) return
    revision.value++
    // Browsers may send a final input event after compositionend. It is the same
    // accepted query, not a second request (including when debounce is zero).
    if (
      query === props.query &&
      !composing.value &&
      open.value &&
      state.value.query === query &&
      state.value.status !== 'idle'
    )
      return
    search.cancel()
    active.value = undefined
    open.value = true
    const previousQuery = props.query
    emit('update:query', query)
    if (previousQuery === query && props.query === query && !composing.value) search.request(query)
    // The watcher owns changed queries after the parent accepts them. An
    // unchanged query (for example compositionend) needs no parent update.
  }
  function choose(option: ChoiceOption) {
    const current = state.value.options.find((item) => item.value === option.value)
    if (!open.value || props.disabled || composing.value || !current || current.disabled) return
    pendingSelection.value = current
    if (props.modelValue !== current.value) emit('update:modelValue', current.value)
    emit('update:query', current.label)
    emit('select', current)
    close()
  }
  function clear() {
    if (props.disabled) return
    close()
    emit('update:modelValue', null)
    emit('update:query', '')
    emit('select', null)
  }
  function cancel() {
    close()
    emit('update:query', selected.value?.label ?? '')
  }
  return {
    open,
    composing,
    active,
    state,
    selected,
    revision,
    show,
    close,
    edit,
    choose,
    clear,
    cancel,
    startComposition() {
      composing.value = true
      search.cancel()
      active.value = undefined
    },
    endComposition(query: string) {
      composing.value = false
      edit(query)
    },
    move(direction: 1 | -1) {
      if (!open.value) show()
      active.value = comboboxMove(state.value.options, active.value, direction)
    },
    commit() {
      const option = state.value.options.find((item) => choiceKey(item.value) === active.value)
      if (option) choose(option)
    },
    retry() {
      if (!props.disabled && open.value && !composing.value) search.request(props.query, true)
    },
  }
}
