import {
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  ref,
  registerElement,
  watch,
} from 'nativescript-vue'
import type { EventData, TouchGestureEventData, View } from '@nativescript/core'
import { animate } from '@rafaelaugusto/jolt'
import { checkboxProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { MavisButton } from '../../native/button'
import { mixedValue, observeCheckbox } from '../../native/checkbox'
import { MBox, MRow, MColumn } from './layout.js'
import { MText } from './MText.js'
import { useNativeViewAttrs } from '../accessibility.js'

registerElement('MavisCheckboxButton', () => MavisButton)
registerElement('MavisRadioButton', () => MavisButton)

export const ChoiceControl = defineComponent({
  name: 'ChoiceControl',
  inheritAttrs: false,
  props: { ...checkboxProps, radio: Boolean, pressFeedback: { type: Boolean, default: true } },
  emits: ['activate'],
  setup(props, { attrs, emit }) {
    const { theme } = useMavisTheme()
    const nativeAttrs = useNativeViewAttrs(props)
    const focused = ref(false)
    let mark: View | undefined
    let motion: ReturnType<typeof animate> | undefined
    let observer: ReturnType<typeof observeCheckbox> | undefined

    function restore() {
      motion?.stop()
      motion = undefined
      if (mark) {
        mark.scaleX = 1
        mark.scaleY = 1
      }
    }
    function unload() {
      restore()
      observer?.dispose()
      observer = undefined
    }
    onBeforeUnmount(unload)
    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) restore()
      },
    )
    watch(
      [() => props.indeterminate, () => props.indeterminateLabel],
      () => {
        observer?.setMixed(props.indeterminate ? props.indeterminateLabel : undefined)
      },
      { flush: 'post' },
    )

    function touch(event: TouchGestureEventData) {
      if (!mark || props.disabled) return
      if (!['down', 'up', 'cancel'].includes(event.action)) return
      motion?.stop()
      const scale = event.action === 'down' ? 0.9 : 1
      motion = animate(
        mark,
        { scaleX: scale, scaleY: scale },
        {
          type: 'spring',
          duration: 180,
          bounce: 0,
        },
      )
    }

    return () => {
      const { colors } = theme.value
      const selected = props.indeterminate || props.modelValue
      return h(
        MBox,
        mergeProps(
          {
            width: props.width,
            grow: props.grow,
            shrink: props.shrink,
            style: {
              minHeight: 48,
              borderWidth: 2,
              borderRadius: 10,
              borderColor: focused.value && !props.disabled ? colors.primary : 'transparent',
              opacity: props.disabled ? 0.45 : 1,
            },
          },
          attrs,
          { accessibilityHidden: props.accessibilityHidden },
        ),
        {
          default: () => [
            h(props.radio ? 'MavisRadioButton' : 'MavisCheckboxButton', {
              ...nativeAttrs(),
              text: '',
              isEnabled: !props.disabled,
              accessible: true,
              accessibilityRole: props.radio ? 'radioButton' : 'checkbox',
              accessibilityState:
                props.modelValue && !props.indeterminate ? 'checked' : 'unchecked',
              accessibilityLabel: props.label,
              accessibilityHint: props.helperText || '',
              accessibilityValue: mixedValue(props.indeterminate, props.indeterminateLabel),
              style: {
                minHeight: 48,
                minWidth: 0,
                margin: 0,
                padding: 0,
                borderWidth: 0,
                backgroundColor: 'transparent',
                androidElevation: 0,
                androidDynamicElevationOffset: 0,
              },
              onTap: () => {
                if (!props.disabled) emit('activate')
              },
              onTouch: props.pressFeedback ? touch : undefined,
              onLoaded: (event: EventData) => {
                unload()
                observer = observeCheckbox(event.object as View, (value) => {
                  focused.value = value
                })
                observer.setMixed(props.indeterminate ? props.indeterminateLabel : undefined)
              },
              onUnloaded: unload,
            }),
            h(
              MRow,
              {
                gap: 'md',
                paddingY: 'sm',
                isUserInteractionEnabled: false,
                accessibilityHidden: true,
              },
              {
                default: () => [
                  h(
                    MBox,
                    {
                      width: 24,
                      height: 24,
                      shrink: 0,
                      radius: props.radio ? 12 : 7,
                      isUserInteractionEnabled: false,
                      accessibilityHidden: true,
                      style: {
                        borderWidth: 2,
                        borderColor: selected ? colors.primary : colors.muted,
                        backgroundColor: !props.radio && selected ? colors.primary : 'transparent',
                      },
                      onLoaded: (event: EventData) => {
                        mark = event.object as View
                      },
                      onUnloaded: () => {
                        restore()
                        mark = undefined
                      },
                    },
                    {
                      default: () =>
                        selected
                          ? h(MBox, {
                              width: 12,
                              height: props.radio ? 12 : props.indeterminate ? 2 : 7,
                              isUserInteractionEnabled: false,
                              accessibilityHidden: true,
                              style: props.radio
                                ? {
                                    backgroundColor: colors.primary,
                                    borderRadius: 6,
                                    horizontalAlignment: 'center',
                                    verticalAlignment: 'middle',
                                  }
                                : props.indeterminate
                                  ? {
                                      backgroundColor: colors.onPrimary,
                                      borderRadius: 1,
                                      horizontalAlignment: 'center',
                                      verticalAlignment: 'middle',
                                    }
                                  : {
                                      borderLeftWidth: 2,
                                      borderBottomWidth: 2,
                                      borderColor: colors.onPrimary,
                                      rotate: -45,
                                      translateY: -1,
                                      horizontalAlignment: 'center',
                                      verticalAlignment: 'middle',
                                    },
                            })
                          : null,
                    },
                  ),
                  h(
                    MColumn,
                    {
                      width: 0,
                      grow: 1,
                      gap: 'xs',
                      isUserInteractionEnabled: false,
                      accessibilityHidden: true,
                    },
                    {
                      default: () => [
                        h(MText, {
                          text: props.label,
                          accessibilityHidden: true,
                          isUserInteractionEnabled: false,
                          style: { fontWeight: '600' },
                        }),
                        props.helperText
                          ? h(MText, {
                              text: props.helperText,
                              variant: 'caption',
                              tone: 'muted',
                              accessibilityHidden: true,
                              isUserInteractionEnabled: false,
                            })
                          : null,
                      ],
                    },
                  ),
                ],
              },
            ),
          ],
        },
      )
    }
  },
})
