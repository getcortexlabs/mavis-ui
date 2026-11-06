import {
  computed,
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
import {
  colorHex,
  colorHsv,
  hsvColor,
  parseColor,
  gaugeGeometry,
  transferValues,
  type HsvColor,
} from '../creative-controls.js'
import { createMotionSurface, type MotionGradient } from '../experimental.js'
import { colorPickerProps, gaugeProps, transferListProps } from './creative-props.js'
import { useComponentLayout } from './component-motion.js'
import { useMavisTheme } from './theme.js'
import { componentMotion } from '../motion.js'
import { choiceKey, validateChoices, type ChoiceValue } from '../choice.js'

export interface CreativeUI {
  Box: Component
  Column: Component
  Row: Component
  Stack: Component
  Card: Component
  Text: Component
  Button: Component
  Input: Component
  Slider: Component
  Checkbox: Component
  NumberFlow: Component
  Image: Component
  GaugeFallback: Component
}
export function createColorPicker(ui: CreativeUI, platform: 'web' | 'native') {
  return defineComponent({
    name: 'MColorPicker',
    inheritAttrs: false,
    props: colorPickerProps,
    emits: { 'update:modelValue': (_color: string) => true },
    setup(props, { attrs, emit }) {
      const { theme } = useMavisTheme()
      const color = computed(() => {
        const parsed = parseColor(props.modelValue)
        if (!parsed) throw new TypeError('MColorPicker modelValue must be HEX or RGB(A).')
        return parsed
      })
      const hue = ref(colorHsv(color.value).h)
      const hsv = computed(() => {
        const value = colorHsv(color.value)
        return { ...value, h: value.s && value.v ? value.h : hue.value }
      })
      const draft = ref(props.modelValue),
        invalid = ref(false)
      const surface = markRaw(createMotionSurface())
      const colors = () => [
        colorHex({ ...color.value, a: 1 }),
        colorHex(hsvColor({ ...hsv.value, v: Math.max(15, hsv.value.v * 0.65), a: 1 })),
      ]
      let gradient: MotionGradient | undefined
      onScopeDispose(
        surface.use((owner) => {
          if (!owner.supports('gradient')) return
          gradient = owner.gradient({ type: 'linear', colors: colors(), angle: 130 })
          return () => {
            gradient?.dispose()
            gradient = undefined
          }
        }),
      )
      watch(
        () => props.modelValue,
        () => {
          draft.value = props.modelValue
          invalid.value = false
          if (hsv.value.s && hsv.value.v) hue.value = hsv.value.h
          if (props.animated)
            gradient?.animate({ colors: colors() }, componentMotion(theme.value, 'data'))
          else gradient?.set({ colors: colors() })
        },
      )
      watch(
        () => props.animated,
        (animated) => {
          if (!animated) {
            gradient?.stop()
            gradient?.set({ colors: colors() })
          }
        },
      )
      function choose(value: string) {
        if (props.disabled || props.readonly) return
        const parsed = parseColor(value)
        invalid.value = !parsed
        if (parsed) {
          emit('update:modelValue', colorHex(parsed, props.alpha))
          void nextTick(() => {
            draft.value = props.modelValue
          })
        }
      }
      function channel(key: keyof HsvColor, value: number) {
        if (props.disabled || props.readonly) return
        if (key === 'h') hue.value = value
        choose(
          colorHex(
            hsvColor({ ...hsv.value, [key]: key === 'a' ? value / 100 : value }),
            props.alpha,
          ),
        )
      }
      return () =>
        h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'md',
            ...(platform === 'web'
              ? { role: 'group', 'aria-label': props.label, class: 'm-color-picker' }
              : { accessibilityLabel: props.label }),
          }),
          {
            default: () => [
              h(ui.Text, { text: props.label, variant: 'heading' }),
              h(ui.Box, {
                motionSurface: surface,
                backgroundColor: colorHex(color.value),
                height: 112,
                radius: 'lg',
                padding: 'lg',
                accessibilityHidden: true,
              }),
              h(ui.Input, {
                label: props.colorLabel,
                modelValue: draft.value,
                disabled: props.disabled,
                readonly: props.readonly,
                error: invalid.value ? props.invalidLabel : undefined,
                'onUpdate:modelValue': (value: string) => {
                  draft.value = value
                  const parsed = parseColor(value)
                  invalid.value = !parsed
                  if (parsed && !props.disabled && !props.readonly)
                    emit('update:modelValue', colorHex(parsed, props.alpha))
                },
                onBlur: () => {
                  if (!invalid.value) draft.value = props.modelValue
                },
              }),
              ...(
                [
                  ['h', props.hueLabel, 360],
                  ['s', props.saturationLabel, 100],
                  ['v', props.brightnessLabel, 100],
                  ...(props.alpha ? [['a', props.alphaLabel, 100]] : []),
                ] as [keyof HsvColor, string, number][]
              ).map(([key, label, max]) => {
                const value =
                  key === 'a' ? Math.round(hsv.value.a * 100) : Math.round(hsv.value[key])
                return h(
                  ui.Column,
                  { key, gap: 'xs' },
                  {
                    default: () => [
                      h(
                        ui.Row,
                        { justify: 'between', gap: 'sm' },
                        {
                          default: () => [
                            h(ui.Text, { text: label, variant: 'caption' }),
                            h(ui.Text, {
                              text: `${value}${key === 'h' ? '°' : '%'}`,
                              variant: 'caption',
                              tone: 'muted',
                            }),
                          ],
                        },
                      ),
                      h(ui.Slider, {
                        label,
                        modelValue: value,
                        max,
                        disabled: props.disabled || props.readonly,
                        'onUpdate:modelValue': (value: number) => channel(key, value),
                      }),
                    ],
                  },
                )
              }),
              h(ui.Text, { text: props.paletteLabel, variant: 'caption' }),
              h(
                ui.Row,
                { gap: 'xs', wrap: true },
                {
                  default: () =>
                    props.palette.map((value, index) => {
                      const parsed = parseColor(value)
                      if (!parsed) throw new TypeError('Invalid palette color.')
                      const hex = colorHex(parsed, props.alpha)
                      return h(
                        ui.Button,
                        {
                          key: `${index}:${value}`,
                          text: hex,
                          size: 'sm',
                          variant:
                            hex === colorHex(color.value, props.alpha) ? 'primary' : 'secondary',
                          disabled: props.disabled || props.readonly,
                          ...(platform === 'web'
                            ? { 'aria-pressed': hex === colorHex(color.value, props.alpha) }
                            : {}),
                          onClick: () => choose(value),
                        },
                        {
                          leading: () =>
                            h(ui.Box, {
                              width: 18,
                              height: 18,
                              radius: 'full',
                              backgroundColor: hex,
                              borderColor: theme.value.colors.border,
                              borderWidth: 1,
                            }),
                        },
                      )
                    }),
                },
              ),
            ],
          },
        )
    },
  })
}
export function createGauge(ui: CreativeUI, platform: 'web' | 'native') {
  return defineComponent({
    name: 'MGauge',
    inheritAttrs: false,
    props: gaugeProps,
    setup(props, { attrs }) {
      const { theme } = useMavisTheme()
      const geometry = computed(() => gaugeGeometry(props.value, props.min, props.max, props.semi))
      const surface = markRaw(createMotionSurface()),
        track = markRaw(createMotionSurface())
      const ready = ref(false)
      const paint = (owner: typeof surface, foreground: boolean) => {
        let dispose = () => {}
        const stop = watch(
          () => [props.semi, props.strokeWidth, props.color, theme.value],
          () => {
            dispose()
            if (!owner.supports('shape')) return
            const g = geometry.value
            const shape = owner.shape({
              d: g.path,
              viewBox: g.viewBox,
              fill: 'transparent',
              stroke: foreground
                ? (props.color ?? theme.value.colors.primary)
                : theme.value.colors.border,
              strokeWidth: props.strokeWidth,
              lineCap: 'round',
              strokeEnd: foreground ? g.ratio : 1,
            })
            if (foreground) ready.value = true
            const unwatch = foreground
              ? watch(
                  () => [geometry.value.ratio, props.animated],
                  () => {
                    if (props.animated)
                      shape.animate(
                        { strokeEnd: geometry.value.ratio },
                        componentMotion(theme.value, 'data'),
                      )
                    else shape.set({ strokeEnd: geometry.value.ratio })
                  },
                )
              : () => {}
            dispose = () => {
              unwatch()
              shape.dispose()
              if (foreground) ready.value = false
            }
          },
          { immediate: true },
        )
        return () => {
          stop()
          dispose()
        }
      }
      onScopeDispose(surface.use((owner) => paint(owner, true)))
      onScopeDispose(track.use((owner) => paint(owner, false)))
      return () => {
        if (
          !Number.isFinite(props.size) ||
          props.size < 80 ||
          !Number.isFinite(props.strokeWidth) ||
          props.strokeWidth <= 0 ||
          props.strokeWidth > 18
        )
          throw new RangeError('Gauge size must be at least 80 and strokeWidth in (0, 18].')
        const value = geometry.value.value,
          display = (props.formatValue?.(value) ?? String(value)) + props.suffix
        const height = props.size * (props.semi ? 0.58 : 1)
        return h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'sm',
            align: 'center',
            ...(platform === 'web'
              ? {
                  class: 'm-gauge',
                  role: 'meter',
                  'aria-label': props.label,
                  'aria-valuemin': props.min,
                  'aria-valuemax': props.max,
                  'aria-valuenow': value,
                  'aria-valuetext': display,
                }
              : { accessibilityLabel: `${props.label}: ${display}`, accessible: true }),
          }),
          {
            default: () => [
              h(
                ui.Box,
                {
                  width: props.size,
                  height,
                  accessibilityHidden: true,
                  ...(platform === 'web' ? { style: { display: 'grid', maxWidth: '100%' } } : {}),
                },
                {
                  default: () => [
                    h(ui.GaugeFallback, {
                      geometry: geometry.value,
                      size: props.size,
                      strokeWidth: props.strokeWidth,
                      color: props.color ?? theme.value.colors.primary,
                      track: theme.value.colors.border,
                      hidden: ready.value,
                    }),
                    ...[track, surface].map((motionSurface, i) =>
                      h(ui.Box, {
                        key: i,
                        motionSurface,
                        width: '100%',
                        height: '100%',
                        ...(platform === 'web'
                          ? { style: { gridArea: '1 / 1', pointerEvents: 'none' } }
                          : {}),
                      }),
                    ),
                  ],
                },
              ),
              h(ui.NumberFlow, {
                value,
                animated: props.animateNumber && props.animated,
                formatValue: (n: number) =>
                  (props.formatValue?.(n) ?? String(Math.round(n * 100) / 100)) + props.suffix,
                accessibilityHidden: true,
                variant: 'display',
              }),
              h(ui.Text, { text: props.label, variant: 'caption', accessibilityHidden: true }),
            ],
          },
        )
      }
    },
  })
}
export function createTransferList(ui: CreativeUI, platform: 'web' | 'native') {
  return defineComponent({
    name: 'MTransferList',
    inheritAttrs: false,
    props: transferListProps,
    emits: { 'update:modelValue': (_values: ChoiceValue[]) => true },
    setup(props, { attrs, emit }) {
      const checked = ref<ChoiceValue[]>([]),
        search = ref(['', ''])
      const region = useComponentLayout(
        () => [props.modelValue, props.options, search.value],
        true,
        () => props.animated,
      )
      watch(
        () => [props.options, props.modelValue],
        () => {
          checked.value = checked.value.filter((value) =>
            props.options.some((option) => option.value === value && !option.disabled),
          )
        },
        { deep: true },
      )
      const side = (selected: boolean) =>
        props.options.filter((option) => props.modelValue.includes(option.value) === selected)
      function move(selected: boolean) {
        if (props.disabled) return
        const values = side(selected)
          .filter((option) => checked.value.includes(option.value) && !option.disabled)
          .map((option) => option.value)
        emit(
          'update:modelValue',
          transferValues(props.options, props.modelValue, values, selected ? 'remove' : 'add'),
        )
        void nextTick(() => {
          checked.value = checked.value.filter(
            (value) => !values.includes(value) || props.modelValue.includes(value) === selected,
          )
        })
      }
      return () => {
        validateChoices(props.options, null)
        return h(
          ui.Column,
          mergeProps(attrs, {
            id: props.id,
            gap: 'md',
            ...(platform === 'web'
              ? { role: 'group', 'aria-label': props.label, class: 'm-transfer-list' }
              : { accessibilityLabel: props.label }),
          }),
          {
            default: () => [
              h(ui.Text, { text: props.label, variant: 'heading' }),
              h(
                ui.Stack,
                {
                  direction: 'column',
                  responsive: { at: 620, direction: 'row' },
                  gap: 'md',
                  align: 'stretch',
                  motionRegion: region,
                },
                {
                  default: () =>
                    [false, true].map((selected, index) => {
                      const label = selected ? props.selectedLabel : props.availableLabel
                      const visible = side(selected).filter((option) =>
                        option.label
                          .toLowerCase()
                          .includes(search.value[index]!.trim().toLowerCase()),
                      )
                      return h(
                        ui.Card,
                        { key: index, padding: 'md', grow: 1, shrink: 1 },
                        {
                          default: () =>
                            h(
                              ui.Column,
                              {
                                gap: 'sm',
                                ...(platform === 'web'
                                  ? { role: 'group', 'aria-label': label }
                                  : {}),
                              },
                              {
                                default: () => [
                                  h(ui.Text, {
                                    text: `${label} · ${side(selected).length}`,
                                    variant: 'heading',
                                  }),
                                  h(ui.Input, {
                                    label: `${props.searchLabel}: ${label}`,
                                    disabled: props.disabled,
                                    modelValue: search.value[index],
                                    'onUpdate:modelValue': (value: string) => {
                                      search.value[index] = value
                                    },
                                  }),
                                  ...visible.map((option) =>
                                    h(ui.Checkbox, {
                                      key: choiceKey(option.value),
                                      label: option.label,
                                      disabled: props.disabled || option.disabled,
                                      modelValue: checked.value.includes(option.value),
                                      'onUpdate:modelValue': (value: boolean) => {
                                        if (props.disabled || option.disabled) return
                                        checked.value = value
                                          ? [...new Set([...checked.value, option.value])]
                                          : checked.value.filter((id) => id !== option.value)
                                      },
                                    }),
                                  ),
                                  !visible.length
                                    ? h(ui.Text, { text: props.emptyLabel, tone: 'muted' })
                                    : null,
                                  h(ui.Button, {
                                    text: selected ? props.removeLabel : props.addLabel,
                                    variant: 'secondary',
                                    disabled:
                                      props.disabled ||
                                      !side(selected).some(
                                        (option) =>
                                          !option.disabled && checked.value.includes(option.value),
                                      ),
                                    onClick: () => move(selected),
                                  }),
                                ],
                              },
                            ),
                        },
                      )
                    }),
                },
              ),
            ],
          },
        )
      }
    },
  })
}
