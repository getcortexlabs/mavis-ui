import { fontFamily } from '@getcortexlabs/mavis-core'
import { defineComponent, h, mergeProps, useId } from 'vue'
import {
  switchProps,
  switchEmits,
  useMavisTheme,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import { nonNegative, resolveDimension } from '@getcortexlabs/mavis-core'
import { length, webAttrs } from '../style.js'

export const MSwitch = defineComponent({
  name: 'MSwitch',
  inheritAttrs: false,
  props: switchProps,
  emits: switchEmits,
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    const labelId = `m-switch-${useId()}`
    return () => {
      const { colors, space, typography, radius } = theme.value
      return h(
        'button',
        mergeProps(
          {
            class: 'm-switch',
            style: {
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: `${space.md}px`,
              boxSizing: 'border-box',
              minWidth: 0,
              minHeight: '48px',
              padding: `${space.sm}px 0`,
              border: 0,
              borderRadius: `${radius.sm}px`,
              margin: 0,
              background: 'transparent',
              color: colors.text,
              textAlign: 'start',
              fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
              fontSize: `${typography.body.fontSize}px`,
              lineHeight: 1.5,
              opacity: props.disabled ? 0.45 : 1,
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              width: length(resolveDimension(props.width)),
              '--m-focus': colors.primary,
              '--m-switch-track': props.modelValue ? colors.primary : colors.muted,
              '--m-switch-thumb': props.modelValue ? colors.onPrimary : colors.surface,
            },
          },
          webAttrs({ ...attrs, id: props.id, accessibilityHidden: props.accessibilityHidden }),
          {
            type: 'button',
            role: 'switch',
            disabled: props.disabled,
            'aria-checked': props.modelValue,
            'aria-labelledby': labelId,
            'aria-describedby': props.helperText ? `${labelId}-help` : undefined,
            onClick: () => {
              if (!props.disabled) emit('update:modelValue', !props.modelValue)
            },
          },
        ),
        [
          h(
            'span',
            {
              style: {
                flex: '1 1 min-content',
                minWidth: 0,
                overflowWrap: 'break-word',
                maxWidth: '100%',
              },
            },
            [
              h('span', { id: labelId, style: { display: 'block', fontWeight: 600 } }, props.label),
              props.helperText
                ? h(
                    'span',
                    {
                      id: `${labelId}-help`,
                      style: {
                        display: 'block',
                        marginTop: `${space.xs}px`,
                        color: colors.muted,
                        fontSize: `${typography.caption.fontSize}px`,
                        fontWeight: 'normal',
                      },
                    },
                    props.helperText,
                  )
                : null,
            ],
          ),
          h('span', { class: 'm-switch-track', 'aria-hidden': 'true' }, [
            h('span', { class: 'm-switch-thumb' }),
          ]),
        ],
      )
    }
  },
})
