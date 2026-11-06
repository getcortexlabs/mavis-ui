import { computed, ref, watch } from '@vue/runtime-core'
import { normalizePin, pinLength } from '../screen-components.js'
import { useComponentContent } from './component-motion.js'

export function usePinInput(
  props: {
    modelValue: string
    length: number
    disabled: boolean
    readonly: boolean
    error?: string
  },
  emit: (event: 'update:modelValue' | 'complete' | 'focus' | 'blur', value?: string) => void,
) {
  const focused = ref(false),
    position = ref(0)
  const value = computed(() => normalizePin(props.modelValue, props.length))
  const feedback = useComponentContent(() => props.error, false)
  const change = (raw: string) => {
    if (props.disabled || props.readonly) return value.value
    const next = normalizePin(raw, props.length)
    if (next !== value.value) {
      emit('update:modelValue', next)
      if (next.length === props.length) emit('complete', next)
    }
    position.value = Math.min(next.length, props.length - 1)
    return next
  }
  watch(() => props.length, pinLength, { immediate: true })
  return { value, feedback, focused, position, change }
}
