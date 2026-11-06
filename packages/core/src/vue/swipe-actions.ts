import {
  defineComponent,
  h,
  markRaw,
  mergeProps,
  nextTick,
  onScopeDispose,
  ref,
  watch,
  type Component,
} from '@vue/runtime-core'
import { componentMotion } from '../motion.js'
import { createMotionSurface } from '../experimental.js'
import { choiceKey } from '../choice.js'
import {
  positiveSize,
  swipeDestination,
  validateActions,
  type SwipeAction,
  type SwipeSide,
} from '../interactive.js'
import { swipeActionsProps } from './interactive-props.js'
import { useMavisTheme } from './theme.js'

export function createSwipeActions(
  ui: {
    Box: Component
    Column: Component
    Row: Component
    Text: Component
    Button: Component
    Menu: Component
  },
  platform: 'web' | 'native',
) {
  return defineComponent({
    name: 'MSwipeActions',
    inheritAttrs: false,
    props: swipeActionsProps,
    emits: {
      'update:modelValue': (_side: SwipeSide) => true,
      action: (_action: SwipeAction) => true,
    },
    setup(props, { attrs, slots, emit }) {
      const { theme } = useMavisTheme()
      const surface = markRaw(createMotionSurface())
      const menuOpen = ref(false)
      const direction = () => (props.direction === 'rtl' ? -1 : 1)
      const offset = () =>
        props.disabled
          ? 0
          : props.modelValue === 'start'
            ? props.start.length * props.actionWidth * direction()
            : props.modelValue === 'end'
              ? -props.end.length * props.actionWidth * direction()
              : 0
      const settle = () => {
        if (surface.available)
          surface.animate({ x: offset() }, componentMotion(theme.value, 'selection'))
      }
      const select = (side: SwipeSide) => {
        if (props.disabled) return
        emit('update:modelValue', side)
        void nextTick(settle)
      }
      onScopeDispose(
        surface.use((owner) => {
          let release = () => {}
          const stop = watch(
            () => [
              props.start.length,
              props.end.length,
              props.actionWidth,
              props.direction,
              props.disabled,
            ],
            () => {
              release()
              owner.set({ x: offset() })
              if (props.disabled) return
              const start = props.start.length * positiveSize(props.actionWidth, 'actionWidth'),
                end = props.end.length * props.actionWidth
              const control = owner.drag({
                axis: 'x',
                bounds: {
                  left: direction() === 1 ? -end : -start,
                  right: direction() === 1 ? start : end,
                },
                onRelease: (event) =>
                  select(swipeDestination(event.x, event.velocityX, start, end, direction())),
              })
              release = () => control.dispose()
            },
            { immediate: true },
          )
          return () => {
            stop()
            release()
          }
        }),
      )
      watch(() => props.modelValue, settle, { flush: 'post' })
      function run(action: SwipeAction) {
        if (props.disabled || action.disabled) return
        emit('action', action)
        select(null)
      }
      const actions = (side: 'start' | 'end') =>
        h(
          ui.Row,
          {
            gap: 'none',
            justify: side === 'start' ? 'start' : 'end',
            ...(platform === 'web'
              ? {
                  inert: props.disabled || props.modelValue !== side ? true : undefined,
                  style: {
                    gridArea: '1 / 1',
                    alignSelf: 'stretch',
                    justifySelf: (side === 'start') === (direction() === 1) ? 'start' : 'end',
                  },
                }
              : {
                  horizontalAlignment:
                    (side === 'start') === (direction() === 1) ? 'left' : 'right',
                  accessibilityHidden: props.disabled || props.modelValue !== side,
                }),
          },
          () =>
            props[side].map((action) =>
              h(ui.Button, {
                key: choiceKey(action.value),
                text: action.label,
                icon: action.icon,
                width: props.actionWidth,
                variant: 'secondary',
                disabled: props.disabled || action.disabled,
                onClick: () => run(action),
              }),
            ),
        )
      return () => {
        validateActions(props.start, props.end)
        return h(
          ui.Column,
          mergeProps(attrs, {
            gap: 'xs',
            ...(platform === 'web'
              ? {
                  class: 'm-swipe-actions',
                  role: 'group',
                  'aria-label': props.label,
                  onKeydown: (event: KeyboardEvent) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      select(null)
                    }
                  },
                }
              : { accessibilityLabel: props.label }),
          }),
          () => [
            h(
              ui.Box,
              {
                radius: 'lg',
                ...(platform === 'web'
                  ? { style: { overflow: 'clip', isolation: 'isolate' } }
                  : { clipToBounds: true }),
              },
              () => [
                actions('start'),
                actions('end'),
                h(
                  ui.Box,
                  {
                    motionSurface: surface,
                    padding: 'md',
                    radius: 'lg',
                    backgroundColor: theme.value.colors.surface,
                    ...(platform === 'web'
                      ? {
                          style: {
                            gridArea: '1 / 1',
                            zIndex: 1,
                            touchAction: 'pan-y',
                            minWidth: 0,
                            border: `1px solid ${theme.value.colors.border}`,
                          },
                        }
                      : {}),
                  },
                  () => slots.default?.(),
                ),
              ],
            ),
            h(ui.Row, { justify: 'end', gap: 'xs' }, () => [
              props.modelValue
                ? h(ui.Button, {
                    text: props.closeLabel,
                    variant: 'ghost',
                    disabled: props.disabled,
                    onClick: () => select(null),
                  })
                : null,
              h(ui.Menu, {
                open: menuOpen.value,
                'onUpdate:open': (open: boolean) => {
                  menuOpen.value = open
                },
                label: `${props.actionsLabel}: ${props.label}`,
                triggerLabel: props.actionsLabel,
                disabled: props.disabled,
                items: [...props.start, ...props.end],
                onSelect: (value: string | number) => {
                  const action = [...props.start, ...props.end].find((a) => a.value === value)
                  if (action) run(action)
                },
              }),
            ]),
          ],
        )
      }
    },
  })
}
