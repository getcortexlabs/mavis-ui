import { defineComponent, h, ref } from 'nativescript-vue'
import { tooltipProps } from '@getcortexlabs/mavis-core/vue'
import { MPopover } from './MPopover.js'
import { MText } from './MText.js'

/** Native help uses an explicit touch/assistive trigger; it never depends on hover or long press. */
export const MTooltip = defineComponent({
  name: 'MTooltip',
  inheritAttrs: false,
  props: tooltipProps,
  setup(props, { attrs }) {
    const open = ref(false)
    return () => {
      if (!props.text.trim() || !props.triggerLabel.trim())
        throw new TypeError('Tooltip requires text and a trigger label.')
      if (!Number.isFinite(props.delay) || props.delay < 0)
        throw new RangeError('Tooltip delay must be nonnegative and finite.')
      return h(
        MPopover,
        {
          ...attrs,
          id: props.id,
          open: open.value,
          label: props.triggerLabel,
          triggerLabel: props.triggerLabel,
          icon: props.icon,
          variant: props.variant,
          disabled: props.disabled,
          placement: props.placement,
          width: 280,
          'onUpdate:open': (value: boolean) => {
            open.value = value
          },
        },
        () => h(MText, { text: props.text }),
      )
    }
  },
})
