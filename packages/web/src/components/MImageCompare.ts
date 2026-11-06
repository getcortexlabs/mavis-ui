import { defineComponent, h, mergeProps, ref, watch } from 'vue'
import { finiteRange, positiveSize } from '@getcortexlabs/mavis-core'
import { imageCompareProps, usePartition, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useAnimatedNumber } from '../animated-number.js'
import { usePartitionPointer } from '../partition-pointer.js'
import { MImage } from './MImage.js'

export const MImageCompare = defineComponent({
  name: 'MImageCompare',
  inheritAttrs: false,
  props: imageCompareProps,
  emits: { 'update:modelValue': (_value: number) => true },
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const root = ref<HTMLElement>()
    const state = usePartition(
      () => finiteRange(props.modelValue, 0, 100),
      () => ({ min: 0, max: 100, step: props.step, disabled: props.disabled }),
      (value) => emit('update:modelValue', value),
    )
    const shown = useAnimatedNumber(
      () => state.canonical.value,
      () => state.dragging.value,
    )
    const vertical = () => props.orientation === 'vertical'
    const gestures = usePartitionPointer(
      {
        ...state,
        value: () => state.canonical.value,
        vertical,
        direction: () => 1,
        disabled: () => props.disabled,
        bounds: () => root.value?.getBoundingClientRect(),
      },
      true,
    )
    watch(
      () => props.orientation,
      () => state.cancel(),
    )
    return () => {
      const ratio = finiteRange(shown.value, 0, 100)
      const labelStyle = {
        position: 'absolute' as const,
        top: '14px',
        padding: '6px 12px',
        background: theme.value.colors.surface,
        color: theme.value.colors.text,
        borderRadius: '8px',
        pointerEvents: 'none' as const,
        fontSize: '13px',
        fontWeight: '600',
      }
      return h(
        'figure',
        mergeProps(attrs, {
          class: 'm-image-compare',
          style: { margin: 0 },
          'aria-label': props.label,
        }),
        [
          h(
            'div',
            {
              ref: root,
              style: {
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                aspectRatio: String(positiveSize(props.aspectRatio, 'aspectRatio')),
              },
            },
            [
              h(MImage, {
                src: props.after,
                alt: props.afterLabel,
                aspectRatio: props.aspectRatio,
                radius: 'none',
              }),
              h(
                'div',
                {
                  style: {
                    position: 'absolute',
                    inset: 0,
                    clipPath: vertical()
                      ? `inset(0 0 ${100 - ratio}% 0)`
                      : `inset(0 ${100 - ratio}% 0 0)`,
                  },
                },
                [
                  h(MImage, {
                    src: props.before,
                    alt: props.beforeLabel,
                    aspectRatio: props.aspectRatio,
                    radius: 'none',
                  }),
                ],
              ),
              h('span', { style: { ...labelStyle, left: '14px' } }, props.beforeLabel),
              h(
                'span',
                {
                  style: {
                    ...labelStyle,
                    right: '14px',
                    ...(vertical() ? { top: 'auto', bottom: '14px' } : {}),
                  },
                },
                props.afterLabel,
              ),
              h(
                'div',
                {
                  style: {
                    position: 'absolute',
                    pointerEvents: 'none',
                    background: '#fff',
                    boxShadow: '0 0 0 1px #0002',
                    ...(vertical()
                      ? {
                          left: 0,
                          right: 0,
                          top: `${ratio}%`,
                          height: '2px',
                          transform: 'translateY(-50%)',
                        }
                      : {
                          top: 0,
                          bottom: 0,
                          left: `${ratio}%`,
                          width: '2px',
                          transform: 'translateX(-50%)',
                        }),
                  },
                },
                [
                  h(
                    'span',
                    {
                      'aria-hidden': 'true',
                      style: {
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%,-50%)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: theme.value.colors.surface,
                        color: theme.value.colors.text,
                        boxShadow: '0 4px 24px #0004',
                        fontSize: '22px',
                      },
                    },
                    vertical() ? '↕' : '↔',
                  ),
                ],
              ),
              h('div', {
                ...gestures,
                role: 'slider',
                tabindex: props.disabled ? -1 : 0,
                'aria-label': props.label,
                'aria-orientation': props.orientation,
                'aria-valuemin': 0,
                'aria-valuemax': 100,
                'aria-valuenow': state.canonical.value,
                'aria-valuetext': `${props.beforeLabel}: ${Math.round(state.canonical.value)}%`,
                'aria-disabled': props.disabled || undefined,
                style: {
                  position: 'absolute',
                  inset: 0,
                  touchAction: vertical() ? 'none' : 'pan-y',
                  cursor: props.disabled ? 'default' : vertical() ? 'row-resize' : 'col-resize',
                  outlineOffset: '-4px',
                },
                onKeydown: (event: KeyboardEvent) => {
                  if (props.disabled || event.altKey || event.ctrlKey || event.metaKey) return
                  const delta = ['ArrowRight', 'ArrowDown'].includes(event.key)
                    ? 1
                    : ['ArrowLeft', 'ArrowUp'].includes(event.key)
                      ? -1
                      : 0
                  if (event.key === 'Escape') {
                    state.cancel()
                    return
                  }
                  if (!delta && !['Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return
                  event.preventDefault()
                  state.update(
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? 100
                        : state.canonical.value +
                          (delta
                            ? delta * props.step * (event.shiftKey ? 10 : 1)
                            : event.key === 'PageUp'
                              ? 10
                              : -10),
                  )
                },
              }),
            ],
          ),
          h(
            'figcaption',
            { style: { marginTop: '10px', color: theme.value.colors.muted, fontSize: '13px' } },
            `${props.label} · ${Math.round(state.canonical.value)}%`,
          ),
        ],
      )
    }
  },
})
