import { defineComponent, h } from 'nativescript-vue'
import { checkboxProps, checkboxEmits } from '@getcortexlabs/mavis-core/vue'
import { ChoiceControl } from './ChoiceControl.js'

export const MCheckbox = defineComponent({
  name: 'MCheckbox',
  inheritAttrs: false,
  props: checkboxProps,
  emits: checkboxEmits,
  setup(props, { attrs, emit }) {
    return () =>
      h(ChoiceControl, {
        ...attrs,
        ...props,
        radio: false,
        onActivate() {
          if (props.disabled) return
          const next = props.indeterminate || !props.modelValue
          if (props.indeterminate) emit('update:indeterminate', false)
          emit('update:modelValue', next)
        },
      })
  },
})
