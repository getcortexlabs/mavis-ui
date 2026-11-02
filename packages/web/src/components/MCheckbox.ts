import { fontFamily } from '@getcortexlabs/mavis-core'
import { defineComponent, h, mergeProps, nextTick, onBeforeUnmount, useId } from 'vue'
import {
  useButtonAction,
  checkboxProps,
  checkboxEmits,
  useMavisTheme,
  useDefaultShrink,
} from '@getcortexlabs/mavis-core/vue'
import { nonNegative, resolveDimension } from '@getcortexlabs/mavis-core'
import { length, webAttrs } from '../style.js'

export const MCheckbox = defineComponent({
  name: 'MCheckbox',
  inheritAttrs: false,
  props: checkboxProps,
  emits: checkboxEmits,
  setup(props, { attrs, emit }) {
    useButtonAction()
    const { theme } = useMavisTheme()
    const shrink = useDefaultShrink()
    const generatedId = `m-checkbox-${useId()}`
    let alive = true
    onBeforeUnmount(() => {
      alive = false
    })
    return () => {
      const { colors, typography, space } = theme.value
      const id = props.id ?? generatedId
      const help = [props.helperText, props.indeterminate ? props.indeterminateLabel : '']
        .filter(Boolean)
        .join(' ')
      return h(
        'label',
        mergeProps(
          {
            class: 'm-checkbox',
            style: {
              fontFamily: fontFamily(theme.value.typography.body.fontFamily, 'web'),
              position: 'relative',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: `${space.md}px`,
              boxSizing: 'border-box',
              minWidth: 0,
              minHeight: '48px',
              padding: `${space.sm}px 2px`,
              borderRadius: '10px',
              opacity: props.disabled ? 0.45 : 1,
              flexGrow: nonNegative(props.grow, 'grow'),
              flexShrink: nonNegative(props.shrink ?? shrink, 'shrink'),
              width: length(resolveDimension(props.width)),
              color: colors.text,
              fontSize: `${typography.body.fontSize}px`,
              lineHeight: 1.5,
              '--m-focus': colors.primary,
              '--m-checkbox-border': colors.muted,
              '--m-checkbox-fill': colors.primary,
              '--m-checkbox-mark': colors.onPrimary,
            },
          },
          webAttrs({ ...attrs, accessibilityHidden: props.accessibilityHidden }),
        ),
        [
          h('input', {
            id,
            class: 'm-checkbox-input',
            type: 'checkbox',
            checked: props.modelValue,
            indeterminate: props.indeterminate,
            disabled: props.disabled,
            'aria-label': props.label,
            'aria-checked': props.indeterminate ? 'mixed' : props.modelValue,
            'aria-describedby': help ? `${id}-help` : undefined,
            onChange: (event: Event) => {
              const input = event.target as HTMLInputElement
              if (!props.disabled) {
                const next = props.indeterminate || !props.modelValue
                if (props.indeterminate) emit('update:indeterminate', false)
                emit('update:modelValue', next)
              }
              // Browsers change both properties before change. The parent owns them.
              void nextTick(() => {
                if (!alive) return
                input.checked = props.modelValue
                input.indeterminate = props.indeterminate
              })
            },
          }),
          h('span', { class: 'm-checkbox-box', 'aria-hidden': 'true' }, [
            h('span', { class: 'm-checkbox-mark' }),
          ]),
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
              h('span', { style: { display: 'block', fontWeight: 600 } }, props.label),
              props.helperText
                ? h(
                    'span',
                    {
                      style: {
                        display: 'block',
                        color: colors.muted,
                        fontSize: `${typography.caption.fontSize}px`,
                        marginTop: `${space.xs}px`,
                      },
                    },
                    props.helperText,
                  )
                : null,
              help ? h('span', { id: `${id}-help`, class: 'm-checkbox-help' }, help) : null,
            ],
          ),
        ],
      )
    }
  },
})
