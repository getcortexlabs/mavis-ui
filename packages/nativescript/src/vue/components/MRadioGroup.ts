import { computed, defineComponent, h, mergeProps } from 'nativescript-vue'
import { choiceKey, validateChoices, canChoose } from '@getcortexlabs/mavis-core'
import { useButtonAction, radioGroupProps, radioGroupEmits } from '@getcortexlabs/mavis-core/vue'
import { MColumn } from './layout.js'
import { MText } from './MText.js'
import { ChoiceControl } from './ChoiceControl.js'

export const MRadioGroup = defineComponent({
  name: 'MRadioGroup',
  inheritAttrs: false,
  props: radioGroupProps,
  emits: radioGroupEmits,
  setup(props, { attrs, emit }) {
    useButtonAction()
    const options = computed(() => {
      validateChoices(props.options, props.modelValue)
      return props.options
    })
    return () =>
      h(
        MColumn,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          gap: 'sm',
          accessibilityHidden: props.accessibilityHidden,
        }),
        {
          default: () => [
            h(MText, {
              text: props.label,
              style: { fontWeight: '600' },
              accessibilityHidden: props.accessibilityHidden,
            }),
            props.helperText
              ? h(MText, {
                  text: props.helperText,
                  variant: 'caption',
                  tone: 'muted',
                  accessibilityHidden: props.accessibilityHidden,
                })
              : null,
            ...options.value.map((option) =>
              h(ChoiceControl, {
                key: choiceKey(option.value),
                radio: true,
                modelValue: props.modelValue === option.value,
                label: option.label,
                helperText: option.helperText,
                disabled: props.disabled || option.disabled,
                accessibilityHidden: props.accessibilityHidden,
                onActivate() {
                  if (canChoose(option, props.modelValue, props.disabled))
                    emit('update:modelValue', option.value)
                },
              }),
            ),
          ],
        },
      )
  },
})
