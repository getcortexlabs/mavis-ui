import { defineComponent, h, shallowRef } from 'nativescript-vue'
import type { TextField } from '@nativescript/core'

export default defineComponent({
  name: 'CheckInput',
  props: { modelValue: String },
  emits: ['update:modelValue', 'focus', 'blur'],
  setup(props, { emit, expose }) {
    const element = shallowRef<{ nativeView: TextField }>()
    expose({
      focus: () => element.value?.nativeView.focus(),
      blur: () => element.value?.nativeView.dismissSoftInput(),
    })
    return () =>
      h('TextField', {
        ref: element,
        text: props.modelValue,
        hint: 'Nome da sessão',
        accessibilityLabel: 'Nome da sessão',
        returnKeyType: 'done',
        fontSize: 18,
        height: 56,
        flexShrink: 0,
        padding: 12,
        borderWidth: 1,
        borderColor: '#B83670',
        borderRadius: 12,
        onLoaded: () => {
          // Keep the field in the page when testing landscape keyboard overlap.
          const native = element.value?.nativeView.android
          if (native) native.setImeOptions(native.getImeOptions() | 0x10000000) // IME_FLAG_NO_EXTRACT_UI
        },
        onTextChange: (event: { value: string }) => emit('update:modelValue', event.value),
        onFocus: () => emit('focus'),
        onBlur: () => emit('blur'),
      })
  },
})
