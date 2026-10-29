import { defineComponent, h, shallowRef } from 'vue'

export default defineComponent({
  name: 'CheckInput',
  props: { modelValue: String },
  emits: ['update:modelValue', 'focus', 'blur'],
  setup(props, { emit, expose }) {
    const element = shallowRef<HTMLInputElement>()
    expose({ focus: () => element.value?.focus(), blur: () => element.value?.blur() })
    return () =>
      h('input', {
        ref: element,
        value: props.modelValue,
        'aria-label': 'Nome da sessão',
        placeholder: 'Nome da sessão',
        style: {
          font: '18px sans-serif',
          height: '56px',
          padding: '12px',
          boxSizing: 'border-box',
          border: '1px solid #B83670',
          borderRadius: '12px',
          minWidth: 0,
        },
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value),
        onFocus: () => emit('focus'),
        onBlur: () => emit('blur'),
      })
  },
})
