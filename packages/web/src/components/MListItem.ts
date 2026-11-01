import { defineComponent, h, mergeProps, type SlotsType, type VNode } from 'vue'
import { listItemProps, actionEmits } from '@getcortexlabs/mavis-core/vue'
import { listItemLabel } from '@getcortexlabs/mavis-core'
import { MCard } from './MCard.js'
import { MRow, MColumn } from './layout.js'
import { MText } from './MText.js'
import { MIcon } from './MIcon.js'

export const MListItem = defineComponent({
  name: 'MListItem',
  inheritAttrs: false,
  props: listItemProps,
  emits: actionEmits,
  slots: Object as SlotsType<{ leading?: () => VNode[]; trailing?: () => VNode[] }>,
  setup(props, { attrs, slots, emit }) {
    return () => {
      const label = listItemLabel(props.title, props.description, props.accessibilityLabel)
      return h(
        MCard,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          padding: 'md',
          radius: 'md',
          interactive: props.interactive,
          disabled: props.disabled,
          accessibilityHidden: props.accessibilityHidden,
          accessibilityLabel: props.interactive ? label : undefined,
          style: { borderWidth: '0' },
          onClick: () => emit('click'),
        }),
        {
          default: () =>
            h(
              MRow,
              { gap: 'md' },
              {
                default: () => [
                  slots.leading ? h(MColumn, { shrink: 0 }, { default: slots.leading }) : null,
                  h(
                    MColumn,
                    { width: 0, grow: 1, gap: 'xs' },
                    {
                      default: () => [
                        h(MText, { text: props.title, style: { fontWeight: '600' } }),
                        props.description
                          ? h(MText, { text: props.description, variant: 'caption', tone: 'muted' })
                          : null,
                      ],
                    },
                  ),
                  slots.trailing
                    ? h(MColumn, { shrink: 1, align: 'end' }, { default: slots.trailing })
                    : props.interactive
                      ? h(MIcon, { name: 'chevron-right', size: 'sm', tone: 'muted' })
                      : null,
                ],
              },
            ),
        },
      )
    }
  },
})
