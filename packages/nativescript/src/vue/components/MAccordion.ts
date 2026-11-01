import { defineComponent, h, mergeProps, type SlotsType } from 'nativescript-vue'
import { accordionProps, accordionEmits, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import {
  choiceKey,
  validateAccordion,
  toggleAccordion,
  type AccordionPanelProps,
} from '@getcortexlabs/mavis-core'
import { MColumn } from './layout.js'
import { MListItem } from './MListItem.js'
import { MIcon } from './MIcon.js'
import { MReveal } from './MReveal.js'
import { MSeparator } from './MSeparator.js'

export const MAccordion = defineComponent({
  name: 'MAccordion',
  inheritAttrs: false,
  props: accordionProps,
  emits: accordionEmits,
  slots: Object as SlotsType<{ default: AccordionPanelProps }>,
  setup(props, { attrs, emit, slots }) {
    const { theme } = useMavisTheme()
    return () => {
      validateAccordion(
        props.items,
        props.modelValue,
        props.multiple,
        props.label,
        props.expandedLabel,
        props.collapsedLabel,
      )
      const { colors } = theme.value
      return h(
        MColumn,
        mergeProps(attrs, {
          id: props.id,
          width: props.width,
          grow: props.grow,
          shrink: props.shrink,
          accessibilityHidden: props.accessibilityHidden,
          gap: 'sm',
        }),
        {
          default: () =>
            props.items.map((item) => {
              const expanded = props.modelValue.includes(item.value)
              return h(
                MColumn,
                {
                  key: choiceKey(item.value),
                  radius: 'md',
                  backgroundColor: colors.surface,
                  style: {
                    borderWidth: 1,
                    borderColor: expanded ? colors.primarySoft : colors.border,
                  },
                },
                {
                  default: () => [
                    h(
                      MListItem,
                      {
                        title: item.title,
                        description: item.description,
                        interactive: true,
                        disabled: props.disabled || item.disabled,
                        accessibilityHidden: props.accessibilityHidden,
                        accessibilityHint: props.label,
                        accessibilityValue: expanded ? props.expandedLabel : props.collapsedLabel,
                        onClick() {
                          const next = toggleAccordion(
                            item,
                            props.modelValue,
                            props.multiple,
                            props.disabled,
                          )
                          if (next) emit('update:modelValue', next)
                        },
                      },
                      {
                        ...(item.icon
                          ? {
                              leading: () =>
                                h(MIcon, {
                                  name: item.icon!,
                                  tone: expanded ? 'primary' : 'muted',
                                }),
                            }
                          : {}),
                        trailing: () =>
                          h(MIcon, {
                            name: expanded ? 'chevron-up' : 'chevron-down',
                            size: 'sm',
                            tone: expanded ? 'primary' : 'muted',
                          }),
                      },
                    ),
                    h(
                      MReveal,
                      {
                        show: expanded,
                        padding: 'md',
                        gap: 'md',
                        style: { paddingTop: 0 },
                        accessibilityHidden: props.accessibilityHidden,
                      },
                      { default: () => [h(MSeparator), slots.default?.({ item })] },
                    ),
                  ],
                },
              )
            }),
        },
      )
    }
  },
})
