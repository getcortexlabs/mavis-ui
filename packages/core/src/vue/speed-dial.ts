import {
  defineComponent,
  h,
  markRaw,
  mergeProps,
  onScopeDispose,
  type Component,
} from '@vue/runtime-core'
import { createMotionSurface } from '../experimental.js'
import { uniqueActions, type SpeedDialAction } from '../screen-components.js'
import { speedDialProps } from './screen-component-props.js'
import type { ChoiceValue } from '../choice.js'
import { useMavisTheme } from './theme.js'
import { componentMotion } from '../motion.js'

export function createSpeedDial(ui: { Popover: Component; Column: Component; Button: Component }) {
  const Action = defineComponent({
    props: { index: { type: Number, required: true }, direction: String },
    setup(props, { slots }) {
      const { theme } = useMavisTheme()
      const surface = markRaw(createMotionSurface())
      onScopeDispose(
        surface.use((owner) => {
          owner.animate(
            { opacity: [0, 1], y: [props.direction === 'up' ? 12 : -12, 0], scale: [0.94, 1] },
            { ...componentMotion(theme.value, 'overlay'), delay: props.index * 35 },
          )
        }),
      )
      return () => h(ui.Column, { motionSurface: surface }, slots)
    },
  })
  return defineComponent({
    name: 'MSpeedDial',
    inheritAttrs: false,
    props: speedDialProps,
    emits: {
      'update:open': (_v: boolean) => true,
      select: (_v: ChoiceValue, _a: SpeedDialAction) => true,
      close: (_reason: string) => true,
    },
    setup(props, { attrs, emit }) {
      return () =>
        h(
          ui.Popover,
          mergeProps(attrs, {
            id: props.id,
            label: props.label,
            triggerLabel: props.label,
            icon: props.open ? 'x' : props.icon,
            variant: 'primary',
            open: props.open,
            disabled: props.disabled,
            placement: props.direction === 'up' ? 'top-end' : 'bottom-end',
            width: 260,
            padding: 'sm',
            'onUpdate:open': (v: boolean) => emit('update:open', v),
            onClose: (reason: string) => emit('close', reason),
          }),
          {
            default: () =>
              h(
                ui.Column,
                { gap: 'xs' },
                {
                  default: () => [
                    ...uniqueActions(props.actions).map((action, index) =>
                      h(
                        Action,
                        {
                          key: `${typeof action.value}:${action.value}`,
                          index,
                          direction: props.direction,
                        },
                        {
                          default: () =>
                            h(ui.Button, {
                              text: action.label,
                              icon: action.icon,
                              variant: 'ghost',
                              disabled: props.disabled || action.disabled,
                              onClick: () => {
                                if (!props.disabled && !action.disabled) {
                                  emit('select', action.value, action)
                                  emit('update:open', false)
                                }
                              },
                            }),
                        },
                      ),
                    ),
                    h(ui.Button, {
                      text: props.closeLabel,
                      variant: 'ghost',
                      size: 'sm',
                      onClick: () => {
                        emit('update:open', false)
                        emit('close', 'action')
                      },
                    }),
                  ],
                },
              ),
          },
        )
    },
  })
}
